import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Optional auth helper: if token provided, sets req.user; otherwise proceeds with fallback
const optionalOrRequiredAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  // If token is provided, verify it
  authenticateToken(req, res, next);
};

// ==========================================
// CALENDAR-BHARAT API INTEGRATION
// ==========================================
const bharatCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

const monthMap = {
  January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
  July: '07', August: '08', September: '09', October: '10', November: '11', December: '12'
};

async function fetchCalendarBharat(year = '2026') {
  const targetYear = String(year);
  const cached = bharatCache.get(targetYear);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const url = `https://jayantur13.github.io/calendar-bharat/calendar/${targetYear}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Calendar-Bharat API returned ${response.status} for year ${targetYear}`);
      return [];
    }
    const raw = await response.json();
    const yearObj = raw[targetYear] || {};

    const holidays = [];
    for (const monthName in yearObj) {
      const monthDays = yearObj[monthName] || {};
      for (const dateKey in monthDays) {
        const item = monthDays[dateKey];
        const match = dateKey.match(/^([A-Za-z]+)\s+(\d+),\s+(\d{4})/);
        let isoDate = null;
        if (match) {
          const [_, mName, day, yr] = match;
          const mm = monthMap[mName] || '01';
          isoDate = `${yr}-${mm}-${day.padStart(2, '0')}`;
        }

        let holidayType = 'PUBLIC';
        if (item.type === 'Government Holiday') {
          holidayType = 'NATIONAL';
        } else if (item.type === 'Religional Festival') {
          holidayType = 'FESTIVAL';
        }

        holidays.push({
          id: `cb-${isoDate}-${encodeURIComponent((item.event || '').toLowerCase().replace(/[^a-z0-9]/g, '-'))}`,
          title: item.event,
          start_date: isoDate,
          end_date: isoDate,
          holiday_type: holidayType,
          original_type: item.type,
          description: item.extras || '',
          source: 'Calendar-Bharat',
          is_external: true,
          is_active: true,
        });
      }
    }

    holidays.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
    bharatCache.set(targetYear, { data: holidays, timestamp: Date.now() });
    return holidays;
  } catch (err) {
    console.error('Error fetching Calendar-Bharat API:', err.message);
    return [];
  }
}

// ==========================================
// 1. HOSPITAL HOLIDAYS ENDPOINTS
// ==========================================

// GET /api/holidays/hospital
router.get('/hospital', optionalOrRequiredAuth, async (req, res) => {
  try {
    const { year = '2026', month, search, type, source = 'ALL' } = req.query;

    let customHolidays = [];
    if (source !== 'BHARAT') {
      let sql = `
        SELECT id, organization_id, title, start_date::text, end_date::text, 
               holiday_type, description, is_active, created_at, updated_at
        FROM hospital_holidays
        WHERE is_active = TRUE
      `;
      const params = [];

      if (year && year !== 'ALL') {
        params.push(year);
        sql += ` AND (EXTRACT(YEAR FROM start_date) = $${params.length} OR EXTRACT(YEAR FROM end_date) = $${params.length})`;
      }

      if (month && month !== 'ALL') {
        params.push(parseInt(month, 10));
        sql += ` AND (EXTRACT(MONTH FROM start_date) = $${params.length} OR EXTRACT(MONTH FROM end_date) = $${params.length})`;
      }

      sql += ` ORDER BY start_date ASC`;
      const result = await query(sql, params);
      customHolidays = result.rows.map(h => ({
        ...h,
        source: 'Custom Clinic Holiday',
        is_external: false,
      }));
    }

    // Fetch Calendar-Bharat data
    let bharatHolidays = [];
    if (source !== 'CUSTOM') {
      const targetYear = (year && year !== 'ALL') ? year : '2026';
      bharatHolidays = await fetchCalendarBharat(targetYear);
    }

    // Combine holidays
    let combined = [...customHolidays, ...bharatHolidays];

    // Filter by Month if requested
    if (month && month !== 'ALL') {
      const mm = String(month).padStart(2, '0');
      combined = combined.filter(h => h.start_date && h.start_date.substring(5, 7) === mm);
    }

    // Apply category filters
    if (type && type !== 'ALL') {
      combined = combined.filter(h => h.holiday_type === type);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      combined = combined.filter(h => 
        h.title?.toLowerCase().includes(q) || 
        h.description?.toLowerCase().includes(q)
      );
    }

    // Sort by start_date ascending
    combined.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

    return res.json({
      success: true,
      holidays: combined,
      source: 'Calendar-Bharat & Clinic Data',
      count: combined.length,
    });
  } catch (err) {
    console.error('Error fetching hospital holidays:', err);
    return res.status(500).json({ error: 'Failed to fetch hospital holidays: ' + err.message });
  }
});

// POST /api/holidays/hospital
router.post('/hospital', optionalOrRequiredAuth, async (req, res) => {
  try {
    const {
      title,
      start_date,
      end_date,
      holiday_type = 'PUBLIC',
      description = '',
    } = req.body;

    if (!title || !start_date) {
      return res.status(400).json({ error: 'Holiday title and start date are required' });
    }

    const finalEndDate = end_date || start_date;
    const orgId = req.user?.organizationId || null;

    const result = await query(
      `INSERT INTO hospital_holidays (organization_id, title, start_date, end_date, holiday_type, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, organization_id, title, start_date::text, end_date::text, holiday_type, description, is_active, created_at`,
      [orgId, title.trim(), start_date, finalEndDate, holiday_type, description?.trim() || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Hospital holiday created successfully',
      holiday: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating hospital holiday:', err);
    return res.status(500).json({ error: 'Failed to create hospital holiday: ' + err.message });
  }
});

// PUT /api/holidays/hospital/:id
router.put('/hospital/:id', optionalOrRequiredAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start_date, end_date, holiday_type, description, is_active } = req.body;

    const result = await query(
      `UPDATE hospital_holidays
       SET title = COALESCE($1, title),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           holiday_type = COALESCE($4, holiday_type),
           description = COALESCE($5, description),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, organization_id, title, start_date::text, end_date::text, holiday_type, description, is_active, updated_at`,
      [title?.trim(), start_date, end_date, holiday_type, description, is_active, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    return res.json({
      success: true,
      message: 'Holiday updated successfully',
      holiday: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating hospital holiday:', err);
    return res.status(500).json({ error: 'Failed to update hospital holiday: ' + err.message });
  }
});

// DELETE /api/holidays/hospital/:id
router.delete('/hospital/:id', optionalOrRequiredAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM hospital_holidays WHERE id = $1 RETURNING id`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    return res.json({
      success: true,
      message: 'Hospital holiday removed successfully',
    });
  } catch (err) {
    console.error('Error deleting hospital holiday:', err);
    return res.status(500).json({ error: 'Failed to delete hospital holiday: ' + err.message });
  }
});

// ==========================================
// 2. DOCTOR LEAVES ENDPOINTS
// ==========================================

// GET /api/holidays/leaves
router.get('/leaves', optionalOrRequiredAuth, async (req, res) => {
  try {
    const { doctor_id, date, status, leave_type, year, search } = req.query;

    let orgId = req.user?.organizationId;
    let userId = req.user?.userId;

    if (req.user && !orgId && userId) {
      const orgLookup = await query(
        `SELECT organization_id FROM doctor_profiles WHERE user_id = $1 
         UNION 
         SELECT organization_id FROM organization_members WHERE user_id = $1 
         LIMIT 1`,
        [userId]
      );
      if (orgLookup.rowCount > 0 && orgLookup.rows[0].organization_id) {
        orgId = orgLookup.rows[0].organization_id;
      }
    }

    let sql = `
      SELECT dl.id, dl.doctor_profile_id, dl.organization_id,
             dl.start_date::text, dl.end_date::text, dl.leave_type, dl.session,
             dl.reason, dl.status, dl.created_at, dl.updated_at,
             u.full_name as doctor_name, u.email as doctor_email, u.avatar_url,
             dp.specialty
      FROM doctor_leaves dl
      JOIN doctor_profiles dp ON dl.doctor_profile_id = dp.id
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN organization_members om ON om.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Scope leaves strictly to logged-in user / clinic organization
    let orgWhere = [];
    if (orgId) {
      params.push(orgId);
      orgWhere.push(`(dl.organization_id = $${params.length} OR dp.organization_id = $${params.length} OR om.organization_id = $${params.length})`);
    }
    if (userId) {
      params.push(userId);
      orgWhere.push(`(dp.user_id = $${params.length} OR u.id = $${params.length})`);
    }
    if (orgWhere.length > 0) {
      sql += ` AND (${orgWhere.join(' OR ')})`;
    }

    if (doctor_id && doctor_id !== 'ALL') {
      params.push(doctor_id);
      sql += ` AND dl.doctor_profile_id = $${params.length}`;
    }

    if (date && date !== 'ALL') {
      params.push(date);
      sql += ` AND dl.start_date <= $${params.length} AND dl.end_date >= $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND dl.status = $${params.length}`;
    }

    if (leave_type && leave_type !== 'ALL') {
      params.push(leave_type);
      sql += ` AND dl.leave_type = $${params.length}`;
    }

    if (year) {
      params.push(year);
      sql += ` AND (EXTRACT(YEAR FROM dl.start_date) = $${params.length} OR EXTRACT(YEAR FROM dl.end_date) = $${params.length})`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(u.full_name) LIKE $${params.length} OR LOWER(dl.reason) LIKE $${params.length} OR LOWER(dp.specialty) LIKE $${params.length})`;
    }

    sql += ` GROUP BY dl.id, dl.doctor_profile_id, dl.organization_id, dl.start_date, dl.end_date, dl.leave_type, dl.session, dl.reason, dl.status, dl.created_at, dl.updated_at, u.full_name, u.email, u.avatar_url, dp.specialty
             ORDER BY dl.start_date DESC`;

    const result = await query(sql, params);

    // Fetch list of doctors strictly belonging to this logged in account / clinic
    let docParams = [];
    let docWhere = [];
    if (orgId) {
      docParams.push(orgId);
      docWhere.push(`(dp.organization_id = $${docParams.length} OR om.organization_id = $${docParams.length})`);
    }
    if (userId) {
      docParams.push(userId);
      docWhere.push(`(dp.user_id = $${docParams.length} OR u.id = $${docParams.length})`);
    }
    const docWhereClause = docWhere.length > 0 ? `WHERE (${docWhere.join(' OR ')})` : '';

    const doctorsRes = await query(
      `SELECT dp.id as doctor_profile_id, u.id as user_id, u.full_name, u.email, dp.specialty, u.avatar_url
       FROM doctor_profiles dp
       JOIN users u ON dp.user_id = u.id
       LEFT JOIN organization_members om ON om.user_id = u.id
       ${docWhereClause}
       GROUP BY dp.id, u.id, u.full_name, u.email, dp.specialty, u.avatar_url
       ORDER BY u.full_name ASC`,
      docParams
    );

    // Calculate leaves stats
    const todayStr = new Date().toISOString().split('T')[0];
    const leaves = result.rows;
    const activeLeavesToday = leaves.filter(l => l.start_date <= todayStr && l.end_date >= todayStr).length;
    const upcomingLeaves = leaves.filter(l => l.start_date > todayStr).length;
    const pendingApproval = leaves.filter(l => l.status === 'PENDING').length;

    return res.json({
      success: true,
      leaves,
      doctors: doctorsRes.rows,
      stats: {
        total: leaves.length,
        onLeaveToday: activeLeavesToday,
        upcoming: upcomingLeaves,
        pending: pendingApproval,
      },
    });
  } catch (err) {
    console.error('Error fetching doctor leaves:', err);
    return res.status(500).json({ error: 'Failed to fetch doctor leaves: ' + err.message });
  }
});

// POST /api/holidays/leaves
router.post('/leaves', optionalOrRequiredAuth, async (req, res) => {
  try {
    let {
      doctor_profile_id,
      start_date,
      end_date,
      leave_type = 'CASUAL',
      session = 'FULL_DAY',
      reason = '',
      status = 'APPROVED',
    } = req.body;

    let orgId = req.user?.organizationId;
    let userId = req.user?.userId;

    if (req.user && !orgId && userId) {
      const orgLookup = await query(
        `SELECT organization_id FROM doctor_profiles WHERE user_id = $1 
         UNION 
         SELECT organization_id FROM organization_members WHERE user_id = $1 
         LIMIT 1`,
        [userId]
      );
      if (orgLookup.rowCount > 0 && orgLookup.rows[0].organization_id) {
        orgId = orgLookup.rows[0].organization_id;
      }
    }

    // If doctor_profile_id is not provided, use authenticated user or first available doctor for this account
    if (!doctor_profile_id) {
      if (req.user?.doctorProfileId) {
        doctor_profile_id = req.user.doctorProfileId;
      } else if (userId) {
        const myDoc = await query(`SELECT id FROM doctor_profiles WHERE user_id = $1 LIMIT 1`, [userId]);
        if (myDoc.rowCount > 0) {
          doctor_profile_id = myDoc.rows[0].id;
        }
      }
      
      if (!doctor_profile_id) {
        const firstDoc = await query(`SELECT id FROM doctor_profiles LIMIT 1`);
        if (firstDoc.rowCount > 0) {
          doctor_profile_id = firstDoc.rows[0].id;
        } else {
          return res.status(400).json({ error: 'No doctor profile found to record leave' });
        }
      }
    }

    if (!start_date) {
      return res.status(400).json({ error: 'Start date is required' });
    }

    const finalEndDate = end_date || start_date;

    // Get doctor's org id if not already known
    if (!orgId) {
      const docInfo = await query(`SELECT organization_id FROM doctor_profiles WHERE id = $1`, [doctor_profile_id]);
      orgId = docInfo.rows[0]?.organization_id || null;
    }

    const result = await query(
      `INSERT INTO doctor_leaves (doctor_profile_id, organization_id, start_date, end_date, leave_type, session, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, doctor_profile_id, organization_id, start_date::text, end_date::text, leave_type, session, reason, status, created_at`,
      [doctor_profile_id, orgId, start_date, finalEndDate, leave_type, session, reason?.trim() || '', status]
    );

    // Also sync date_overrides for the doctor so slots are blocked
    try {
      // Loop over start_date to finalEndDate
      let curr = new Date(start_date);
      const end = new Date(finalEndDate);
      while (curr <= end) {
        const dateStr = curr.toISOString().split('T')[0];
        await query(
          `INSERT INTO date_overrides (doctor_profile_id, override_date, is_available, reason)
           VALUES ($1, $2, false, $3)
           ON CONFLICT (doctor_profile_id, override_date) 
           DO UPDATE SET is_available = false, reason = EXCLUDED.reason`,
          [doctor_profile_id, dateStr, `Doctor Leave: ${reason || leave_type}`]
        );
        curr.setDate(curr.getDate() + 1);
      }
    } catch (overrideErr) {
      console.warn('Could not sync date_overrides:', overrideErr.message);
    }

    // Fetch joined details
    const fullLeave = await query(
      `SELECT dl.id, dl.doctor_profile_id, dl.organization_id,
              dl.start_date::text, dl.end_date::text, dl.leave_type, dl.session,
              dl.reason, dl.status, dl.created_at,
              u.full_name as doctor_name, u.email as doctor_email, u.avatar_url,
              dp.specialty
       FROM doctor_leaves dl
       JOIN doctor_profiles dp ON dl.doctor_profile_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE dl.id = $1`,
      [result.rows[0].id]
    );

    return res.status(201).json({
      success: true,
      message: 'Doctor leave booked successfully',
      leave: fullLeave.rows[0] || result.rows[0],
    });
  } catch (err) {
    console.error('Error creating doctor leave:', err);
    return res.status(500).json({ error: 'Failed to record doctor leave: ' + err.message });
  }
});

// PUT /api/holidays/leaves/:id
router.put('/leaves/:id', optionalOrRequiredAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, leave_type, session, reason, status } = req.body;

    const result = await query(
      `UPDATE doctor_leaves
       SET start_date = COALESCE($1, start_date),
           end_date = COALESCE($2, end_date),
           leave_type = COALESCE($3, leave_type),
           session = COALESCE($4, session),
           reason = COALESCE($5, reason),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, doctor_profile_id, organization_id, start_date::text, end_date::text, leave_type, session, reason, status, updated_at`,
      [start_date, end_date, leave_type, session, reason?.trim(), status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Doctor leave not found' });
    }

    return res.json({
      success: true,
      message: 'Doctor leave updated successfully',
      leave: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating doctor leave:', err);
    return res.status(500).json({ error: 'Failed to update doctor leave: ' + err.message });
  }
});

// DELETE /api/holidays/leaves/:id
router.delete('/leaves/:id', optionalOrRequiredAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM doctor_leaves WHERE id = $1 RETURNING id, doctor_profile_id, start_date, end_date`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Doctor leave record not found' });
    }

    // Clean up corresponding date_overrides if any
    const deleted = result.rows[0];
    try {
      let curr = new Date(deleted.start_date);
      const end = new Date(deleted.end_date);
      while (curr <= end) {
        const dateStr = curr.toISOString().split('T')[0];
        await query(
          `DELETE FROM date_overrides 
           WHERE doctor_profile_id = $1 AND override_date = $2 AND reason LIKE 'Doctor Leave%'`,
          [deleted.doctor_profile_id, dateStr]
        );
        curr.setDate(curr.getDate() + 1);
      }
    } catch (e) {
      // Ignored
    }

    return res.json({
      success: true,
      message: 'Doctor leave deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting doctor leave:', err);
    return res.status(500).json({ error: 'Failed to delete doctor leave: ' + err.message });
  }
});

export default router;
