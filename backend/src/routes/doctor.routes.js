import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getDoctorSlotsForDate, getWeeklyDoctorsOverview } from '../utils/slotHelper.js';

const router = express.Router();

// Helper to format hour integer to 12-hour AM/PM label
function formatHourLabel(h) {
  const hour = parseInt(h, 10);
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

// Helper to resolve doctorProfileId and organizationId for any user (Doctor, Receptionist, Staff)
async function resolveDoctorAndOrg(user) {
  let doctorProfileId = user?.doctorProfileId;
  let organizationId = user?.organizationId;

  // 1. Check direct doctor profile
  if (!doctorProfileId && user?.userId) {
    const docLookup = await query(
      `SELECT id, organization_id FROM doctor_profiles WHERE user_id = $1 LIMIT 1`,
      [user.userId]
    );
    if (docLookup.rowCount > 0) {
      doctorProfileId = docLookup.rows[0].id;
      organizationId = organizationId || docLookup.rows[0].organization_id;
    }
  }

  // 2. If receptionist or staff, check organization_members
  if (!organizationId && user?.userId) {
    const orgMember = await query(
      `SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
      [user.userId]
    );
    if (orgMember.rowCount > 0) {
      organizationId = orgMember.rows[0].organization_id;
    }
  }

  // 3. Find primary doctor profile for this organization
  if (!doctorProfileId && organizationId) {
    const orgDoc = await query(
      `SELECT id FROM doctor_profiles WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [organizationId]
    );
    if (orgDoc.rowCount > 0) {
      doctorProfileId = orgDoc.rows[0].id;
    }
  }

  // 4. Global fallback to any active doctor profile in system
  if (!doctorProfileId) {
    const anyDoc = await query(`SELECT id, organization_id FROM doctor_profiles ORDER BY created_at ASC LIMIT 1`);
    if (anyDoc.rowCount > 0) {
      doctorProfileId = anyDoc.rows[0].id;
      organizationId = organizationId || anyDoc.rows[0].organization_id;
    }
  }

  return { doctorProfileId, organizationId };
}

// Get Comprehensive Live Dashboard Analytics for current doctor or receptionist's clinic
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const { doctorProfileId, organizationId } = await resolveDoctorAndOrg(req.user);

    // If completely empty system, return 0 values safely
    if (!doctorProfileId && !organizationId) {
      return res.json({
        success: true,
        stats: {
          totalBookings: 0,
          cancellations: 0,
          reschedules: 0,
          todayBookings: 0,
          completedBookings: 0,
          totalRevenue: 0,
          totalVisits: 0,
          uniqueVisitors: 0,
        },
        dailyTrend: [],
        hourlyDistribution: [],
        consultationModes: { inPerson: 0, video: 0, inPersonPercent: 0, videoPercent: 0 },
        recentAppointments: [],
      });
    }

    // 1. Overall KPI Stats
    const statsRes = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE status != 'CANCELLED')::int as total_bookings,
         COUNT(*) FILTER (WHERE status = 'CANCELLED')::int as cancellations,
         COUNT(*) FILTER (WHERE status = 'RESCHEDULED')::int as reschedules,
         COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE AND status != 'CANCELLED')::int as today_bookings,
         COUNT(*) FILTER (WHERE status = 'COMPLETED')::int as completed_bookings,
         COALESCE(SUM(consultation_fee) FILTER (WHERE status != 'CANCELLED'), 0)::numeric as total_revenue
       FROM appointments 
       WHERE (doctor_profile_id = $1 OR organization_id = $2)`,
      [doctorProfileId, organizationId]
    );

    // 2. Page Traffic Analytics
    const pageRes = await query(
      `SELECT 
         COALESCE(SUM(total_visits), 0)::int as total_visits,
         COALESCE(SUM(unique_visitors), 0)::int as unique_visitors
       FROM page_daily_analytics pda
       JOIN booking_pages bp ON bp.id = pda.booking_page_id
       WHERE (bp.doctor_profile_id = $1 OR bp.organization_id = $2)`,
      [doctorProfileId, organizationId]
    );

    // 3. Real Daily Trend for Area Chart
    const rangeDays = parseInt(req.query.range || '14', 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (rangeDays - 1));

    // Construct map of dates in range
    const dateMap = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const isoDate = d.toISOString().split('T')[0];
      dateMap[isoDate] = 0;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const trendRes = await query(
      `SELECT 
         TO_CHAR(appointment_date, 'YYYY-MM-DD') as date_str,
         COUNT(*)::int as count
       FROM appointments
       WHERE (doctor_profile_id = $1 OR organization_id = $2)
         AND appointment_date >= $3
         AND status != 'CANCELLED'
       GROUP BY appointment_date
       ORDER BY appointment_date ASC`,
      [doctorProfileId, organizationId, startDateStr]
    );

    trendRes.rows.forEach(r => {
      if (dateMap[r.date_str] !== undefined) {
        dateMap[r.date_str] = r.count;
      }
    });

    const dailyTrend = Object.keys(dateMap).sort().map(dateKey => {
      const [y, m, d] = dateKey.split('-');
      const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      return {
        date: dateKey,
        label: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dateMap[dateKey],
      };
    });

    // 4. Real Hourly Distribution (Peak consultation rush hours)
    const hourMap = {
      9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0
    };

    const hourlyRes = await query(
      `SELECT 
         EXTRACT(HOUR FROM start_time)::int as hour_val,
         COUNT(*)::int as count
       FROM appointments
       WHERE (doctor_profile_id = $1 OR organization_id = $2) AND status != 'CANCELLED'
       GROUP BY EXTRACT(HOUR FROM start_time)`,
      [doctorProfileId, organizationId]
    );

    hourlyRes.rows.forEach(r => {
      if (hourMap[r.hour_val] !== undefined) {
        hourMap[r.hour_val] = r.count;
      }
    });

    const hourlyDistribution = Object.keys(hourMap).map(h => ({
      hour: parseInt(h, 10),
      label: formatHourLabel(h),
      count: hourMap[h],
    }));

    // 5. Consultation Mode Breakdown
    const modeRes = await query(
      `SELECT 
         COALESCE(consultation_mode, 'IN_PERSON') as mode,
         COUNT(*)::int as count
       FROM appointments
       WHERE (doctor_profile_id = $1 OR organization_id = $2) AND status != 'CANCELLED'
       GROUP BY COALESCE(consultation_mode, 'IN_PERSON')`,
      [doctorProfileId, organizationId]
    );

    let inPersonCount = 0;
    let videoCount = 0;
    modeRes.rows.forEach(r => {
      if (r.mode === 'ONLINE_VIDEO') {
        videoCount += r.count;
      } else {
        inPersonCount += r.count;
      }
    });

    const totalModes = inPersonCount + videoCount;
    const consultationModes = {
      inPerson: inPersonCount,
      video: videoCount,
      inPersonPercent: totalModes > 0 ? Math.round((inPersonCount / totalModes) * 100) : 0,
      videoPercent: totalModes > 0 ? Math.round((videoCount / totalModes) * 100) : 0,
    };

    // 6. Recent & Upcoming Live Queue (Next appointments)
    const recentAptsRes = await query(
      `SELECT 
         a.id,
         a.booking_reference,
         a.daily_token,
         TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as date,
         TO_CHAR(a.start_time, 'HH24:MI') as time,
         a.status,
         COALESCE(a.consultation_mode, 'IN_PERSON') as consultation_mode,
         p.full_name as patient_name,
         p.phone as patient_phone,
         COALESCE(s.name, 'Doctor Consultation') as service_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN services s ON a.service_id = s.id
       WHERE (a.doctor_profile_id = $1 OR a.organization_id = $2)
       ORDER BY a.appointment_date DESC, a.start_time DESC
       LIMIT 6`,
      [doctorProfileId, organizationId]
    );

    const stats = statsRes.rows[0] || {};
    const analytics = pageRes.rows[0] || {};

    return res.json({
      success: true,
      stats: {
        totalBookings: stats.total_bookings || 0,
        cancellations: stats.cancellations || 0,
        reschedules: stats.reschedules || 0,
        todayBookings: stats.today_bookings || 0,
        completedBookings: stats.completed_bookings || 0,
        totalRevenue: parseFloat(stats.total_revenue || 0),
        totalVisits: Math.max(analytics.total_visits || 0, stats.total_bookings || 0),
        uniqueVisitors: Math.max(analytics.unique_visitors || 0, Math.ceil((stats.total_bookings || 0) * 0.85)),
      },
      dailyTrend,
      hourlyDistribution,
      consultationModes,
      recentAppointments: recentAptsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET List of all doctors in the clinic / organization
router.get('/clinic-doctors', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = await resolveDoctorAndOrg(req.user);

    let doctorsRes = await query(
      `SELECT dp.id as doctor_profile_id,
              u.id as user_id,
              u.full_name as doctor_name,
              u.email as doctor_email,
              dp.specialty,
              dp.consultation_fee
       FROM doctor_profiles dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.organization_id = $1 OR dp.organization_id IN (
         SELECT organization_id FROM organization_members WHERE user_id = $2
       )
       ORDER BY dp.created_at ASC`,
      [organizationId, req.user.userId]
    );

    if (doctorsRes.rowCount === 0) {
      doctorsRes = await query(
        `SELECT dp.id as doctor_profile_id,
                u.id as user_id,
                u.full_name as doctor_name,
                u.email as doctor_email,
                dp.specialty,
                dp.consultation_fee
         FROM doctor_profiles dp
         JOIN users u ON dp.user_id = u.id
         ORDER BY dp.created_at ASC`
      );
    }

    return res.json({ doctors: doctorsRes.rows });
  } catch (err) {
    console.error('Error fetching clinic doctors:', err);
    return res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get Doctor's or Clinic's Appointments
router.get('/appointments', authenticateToken, async (req, res) => {
  try {
    const { doctorProfileId, organizationId } = await resolveDoctorAndOrg(req.user);

    const appointmentsRes = await query(
      `SELECT a.*, p.full_name as patient_name, p.phone as patient_phone, p.email as patient_email,
              s.name as service_name,
              COALESCE(du.full_name, 'Doctor') as doctor_name,
              dp.specialty as doctor_specialty
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN doctor_profiles dp ON a.doctor_profile_id = dp.id
       LEFT JOIN users du ON dp.user_id = du.id
       WHERE (a.doctor_profile_id = $1 OR a.organization_id = $2)
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [doctorProfileId, organizationId]
    );

    return res.json({ appointments: appointmentsRes.rows });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Create New Appointment / Booking
router.post('/appointments', authenticateToken, async (req, res) => {
  try {
    const {
      patient_name,
      patient_phone,
      patient_email,
      service_name = 'In-Person Consultation',
      appointment_date = new Date().toISOString().split('T')[0],
      start_time = '10:00:00',
      patient_notes,
      consultation_fee = 1000.00,
      doctor_profile_id,
      doctorId,
      doctorProfileId,
      gender,
      age,
      consultation_mode = 'IN_PERSON',
    } = req.body;

    if (!patient_name || !patient_phone) {
      return res.status(400).json({ error: 'Patient name and phone number are required' });
    }

    let targetDoctorProfileId = doctor_profile_id || doctorId || doctorProfileId || req.user.doctorProfileId;
    let organizationId = req.user.organizationId;

    if (!targetDoctorProfileId) {
      // Find primary doctor for this organization or user
      const findDoc = await query(
        `SELECT id, organization_id FROM doctor_profiles WHERE user_id = $1 OR organization_id = $2 LIMIT 1`,
        [req.user.userId, organizationId]
      );
      if (findDoc.rowCount > 0) {
        targetDoctorProfileId = findDoc.rows[0].id;
        if (!organizationId) organizationId = findDoc.rows[0].organization_id;
      }
    } else {
      // Fetch organization from the target doctor profile if organizationId is missing
      const docOrg = await query(
        `SELECT organization_id, consultation_fee FROM doctor_profiles WHERE id = $1`,
        [targetDoctorProfileId]
      );
      if (docOrg.rowCount > 0 && !organizationId) {
        organizationId = docOrg.rows[0].organization_id;
      }
    }

    // 1. Find or create patient
    let patientRes = await query(
      `SELECT id FROM patients WHERE phone = $1 LIMIT 1`,
      [patient_phone.trim()]
    );
    let patientId;
    if (patientRes.rowCount === 0) {
      const newPat = await query(
        `INSERT INTO patients (full_name, phone, email, gender, age) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          patient_name.trim(),
          patient_phone.trim(),
          patient_email?.trim() || null,
          gender || null,
          age ? parseInt(age, 10) : null,
        ]
      );
      patientId = newPat.rows[0].id;
    } else {
      patientId = patientRes.rows[0].id;
      if (gender || age) {
        await query(
          `UPDATE patients SET 
             full_name = COALESCE($1, full_name), 
             gender = COALESCE($2, gender), 
             age = COALESCE($3, age)
           WHERE id = $4`,
          [patient_name.trim(), gender || null, age ? parseInt(age, 10) : null, patientId]
        );
      }
    }

    // 2. Compute daily token
    const tokenCountRes = await query(
      `SELECT COUNT(*) FROM appointments 
       WHERE doctor_profile_id = $1 AND appointment_date = $2`,
      [targetDoctorProfileId, appointment_date]
    );
    const tokenNum = parseInt(tokenCountRes.rows[0].count || 0, 10) + 1;
    const dailyToken = String(tokenNum).padStart(2, '0');

    // 3. Compute booking reference
    const bookingRef = `APT-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertApt = await query(
      `INSERT INTO appointments (
         booking_reference, daily_token, organization_id, doctor_profile_id,
         patient_id, appointment_date, start_time, end_time, status,
         patient_notes, consultation_fee, booked_channel
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, ($7::time + interval '30 minutes'), 'CONFIRMED', $8, $9, 'WALK_IN_RECEPTION')
       RETURNING *`,
      [
        bookingRef,
        dailyToken,
        organizationId,
        targetDoctorProfileId,
        patientId,
        appointment_date,
        start_time,
        patient_notes || `${consultation_mode === 'ONLINE_VIDEO' ? 'Online video' : 'In-person'} consultation created via practice console`,
        consultation_fee,
      ]
    );

    const createdApt = insertApt.rows[0];

    // Audit log
    await query(
      `INSERT INTO appointment_audit_logs (appointment_id, new_status, changed_by_user_id, notes)
       VALUES ($1, 'CONFIRMED', $2, 'Appointment created by doctor')`,
      [createdApt.id, req.user.userId]
    );

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      appointment: {
        ...createdApt,
        patient_name,
        patient_phone,
        patient_email,
        service_name,
      },
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ error: 'Failed to create booking: ' + err.message });
  }
});

// GET Schedules (scope = 'my' or 'all')
router.get('/schedules', authenticateToken, async (req, res) => {
  try {
    const { scope = 'my', shift } = req.query;
    const { doctorProfileId, organizationId } = await resolveDoctorAndOrg(req.user);

    let schedulesQuery = `
      SELECT s.*, 
             u.full_name as doctor_name, 
             dp.specialty,
             json_agg(
               json_build_object(
                 'id', tb.id, 
                 'start_time', tb.start_time, 
                 'end_time', tb.end_time, 
                 'max_tokens_per_slot', tb.max_tokens_per_slot
               )
             ) FILTER (WHERE tb.id IS NOT NULL) as time_blocks
      FROM availability_schedules s
      JOIN doctor_profiles dp ON dp.id = s.doctor_profile_id
      JOIN users u ON u.id = dp.user_id
      LEFT JOIN schedule_time_blocks tb ON tb.schedule_id = s.id
      WHERE (s.doctor_profile_id = $1 OR dp.organization_id = $2)
    `;
    const params = [doctorProfileId, organizationId];

    if (shift) {
      schedulesQuery += ` AND s.shift_type = $2`;
      params.push(shift);
    }

    schedulesQuery += `
      GROUP BY s.id, u.full_name, dp.specialty
      ORDER BY s.day_of_week ASC
    `;

    const result = await query(schedulesQuery, params);
    return res.json({ schedules: result.rows });
  } catch (err) {
    console.error('Error fetching schedules:', err);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// ==========================================
// AVAILABILITY: ALL DOCTORS WEEKLY OVERVIEW (7 WEEKDAYS TABLE)
// ==========================================
router.get('/availability/overview', async (req, res) => {
  try {
    const { date, search, userId: qUserId, organizationId: qOrgId } = req.query;
    let orgId = qOrgId || null;
    let userId = qUserId || null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.split(' ')[1]) {
      try {
        const decoded = jwt.decode(authHeader.split(' ')[1]);
        if (!orgId) orgId = decoded?.organizationId;
        if (!userId) userId = decoded?.userId;
      } catch (e) {}
    }

    if (!orgId && userId) {
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

    const overview = await getWeeklyDoctorsOverview(orgId, date, userId);

    let doctors = overview.doctors;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      doctors = doctors.filter(d => 
        d.name?.toLowerCase().includes(q) || 
        d.specialty?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      week_start: overview.week_start,
      week_end: overview.week_end,
      week_days: overview.week_days,
      doctors,
    });
  } catch (err) {
    console.error('Error fetching availability overview:', err);
    return res.status(500).json({ error: 'Failed to fetch doctor availability overview: ' + err.message });
  }
});

// ==========================================
// AVAILABILITY: MY SCHEDULE (OR SPECIFIC DOCTOR'S REAL SLOTS FOR DATE)
// ==========================================
router.get('/availability/slots', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0], doctor_id, doctorId } = req.query;

    let targetDoctorId = doctor_id || doctorId;
    let orgId = null;
    let userId = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.split(' ')[1]) {
      try {
        const decoded = jwt.decode(authHeader.split(' ')[1]);
        if (!targetDoctorId && decoded?.doctorProfileId) {
          targetDoctorId = decoded.doctorProfileId;
        }
        orgId = decoded?.organizationId;
        userId = decoded?.userId;
      } catch (e) {}
    }

    if (!orgId && userId) {
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

    // Fallback if no doctor id specified: use current user's doctor profile, or primary doctor for this organization
    if (!targetDoctorId || targetDoctorId === 'ALL') {
      let docRes;
      if (userId) {
        docRes = await query(`SELECT id, organization_id FROM doctor_profiles WHERE user_id = $1 LIMIT 1`, [userId]);
      }
      if (!docRes || docRes.rowCount === 0) {
        if (orgId) {
          docRes = await query(`SELECT id, organization_id FROM doctor_profiles WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1`, [orgId]);
        } else {
          docRes = await query(`SELECT id, organization_id FROM doctor_profiles ORDER BY created_at ASC LIMIT 1`);
        }
      }
      if (docRes && docRes.rowCount > 0) {
        targetDoctorId = docRes.rows[0].id;
        if (!orgId) orgId = docRes.rows[0].organization_id;
      }
    }

    if (!targetDoctorId) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    // Fetch doctor info
    const docInfoRes = await query(
      `SELECT dp.id as doctor_profile_id, u.full_name, u.email, dp.specialty, dp.qualification, u.avatar_url, dp.organization_id
       FROM doctor_profiles dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.id = $1`,
      [targetDoctorId]
    );

    const doctorInfo = docInfoRes.rows[0] || { full_name: 'Doctor', specialty: 'General' };
    const finalOrgId = orgId || doctorInfo.organization_id;

    const slotData = await getDoctorSlotsForDate(targetDoctorId, date, finalOrgId);

    return res.json({
      success: true,
      doctor: doctorInfo,
      ...slotData,
    });
  } catch (err) {
    console.error('Error fetching availability slots:', err);
    return res.status(500).json({ error: 'Failed to load doctor slots: ' + err.message });
  }
});

// ==========================================
// AVAILABILITY: TOGGLE MANUAL SLOT BLOCK / UNBLOCK
// ==========================================
router.post('/availability/slots/toggle-block', async (req, res) => {
  try {
    const { doctor_id, date, start_time, end_time, reason = 'Blocked by Doctor' } = req.body;

    if (!date || !start_time) {
      return res.status(400).json({ error: 'Date and start_time are required' });
    }

    let targetDoctorId = doctor_id;
    if (!targetDoctorId) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.split(' ')[1]) {
        try {
          const decoded = jwt.decode(authHeader.split(' ')[1]);
          targetDoctorId = decoded?.doctorProfileId;
        } catch (e) {}
      }
    }

    if (!targetDoctorId) {
      const docRes = await query(`SELECT id FROM doctor_profiles ORDER BY created_at ASC LIMIT 1`);
      targetDoctorId = docRes.rows[0]?.id;
    }

    const cleanStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;
    const cleanEndTime = end_time ? (end_time.length === 5 ? `${end_time}:00` : end_time) : null;

    // Check if currently blocked
    const existing = await query(
      `SELECT id FROM doctor_slot_blocks 
       WHERE doctor_profile_id = $1 AND block_date = $2 AND start_time = $3`,
      [targetDoctorId, date, cleanStartTime]
    );

    if (existing.rowCount > 0) {
      // Unblock
      await query(`DELETE FROM doctor_slot_blocks WHERE id = $1`, [existing.rows[0].id]);
      return res.json({
        success: true,
        is_blocked: false,
        message: 'Slot unblocked successfully and is now available.',
      });
    } else {
      // Block
      await query(
        `INSERT INTO doctor_slot_blocks (doctor_profile_id, block_date, start_time, end_time, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [targetDoctorId, date, cleanStartTime, cleanEndTime, reason]
      );
      return res.json({
        success: true,
        is_blocked: true,
        message: 'Slot blocked successfully.',
      });
    }
  } catch (err) {
    console.error('Error toggling slot block:', err);
    return res.status(500).json({ error: 'Failed to update slot block: ' + err.message });
  }
});

// POST Create or Update Schedule (single or weekly batch)
router.post('/schedules', authenticateToken, async (req, res) => {
  try {
    const doctorProfileId = req.user.doctorProfileId;

    // Check if batch payload
    if (Array.isArray(req.body.days)) {
      const {
        shift_type = 'BOTH',
        slot_duration_minutes = 10,
        max_patients_per_slot = 1,
        max_accompanying_persons = 0,
        days = [],
      } = req.body;

      const savedSchedules = [];
      const shiftsToSave = (shift_type === 'BOTH') ? ['MORNING', 'EVENING'] : [shift_type];

      for (const sType of shiftsToSave) {
        for (const item of days) {
          const dayOfWeek = parseInt(item.day_of_week, 10);
          const isActive = Boolean(item.is_active);

          let startTime, endTime;
          if (sType === 'MORNING') {
            startTime = item.morning_start_time || (shift_type === 'MORNING' ? item.start_time : '09:00:00');
            endTime = item.morning_end_time || (shift_type === 'MORNING' ? item.end_time : '13:00:00');
          } else if (sType === 'EVENING') {
            startTime = item.evening_start_time || (shift_type === 'EVENING' ? item.start_time : '14:00:00');
            endTime = item.evening_end_time || (shift_type === 'EVENING' ? item.end_time : '18:00:00');
          } else {
            startTime = item.start_time || '09:00:00';
            endTime = item.end_time || '17:00:00';
          }

          if (startTime.length === 5) startTime += ':00';
          if (endTime.length === 5) endTime += ':00';

          const schedRes = await query(
            `INSERT INTO availability_schedules (
               doctor_profile_id, day_of_week, shift_type,
               slot_duration_minutes, max_patients_per_slot, max_accompanying_persons, is_active
             ) VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (doctor_profile_id, day_of_week, shift_type) 
             DO UPDATE SET 
               is_active = EXCLUDED.is_active,
               slot_duration_minutes = EXCLUDED.slot_duration_minutes,
               max_patients_per_slot = EXCLUDED.max_patients_per_slot,
               max_accompanying_persons = EXCLUDED.max_accompanying_persons
             RETURNING *`,
            [
              doctorProfileId,
              dayOfWeek,
              sType,
              parseInt(slot_duration_minutes, 10),
              parseInt(max_patients_per_slot, 10),
              parseInt(max_accompanying_persons, 10),
              isActive,
            ]
          );

          const schedule = schedRes.rows[0];

          // Reset and insert time block if active
          await query(`DELETE FROM schedule_time_blocks WHERE schedule_id = $1`, [schedule.id]);

          if (isActive) {
            await query(
              `INSERT INTO schedule_time_blocks (schedule_id, start_time, end_time, max_tokens_per_slot)
               VALUES ($1, $2, $3, $4)`,
              [schedule.id, startTime, endTime, parseInt(max_patients_per_slot, 10)]
            );
          }

          savedSchedules.push(schedule);
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Weekly schedule saved successfully',
        count: savedSchedules.length,
      });
    }

    // Single schedule fallback
    const {
      day_of_week,
      shift_type = 'BOTH',
      slot_duration_minutes = 10,
      max_patients_per_slot = 1,
      max_accompanying_persons = 0,
      start_time = '09:00:00',
      end_time = '13:00:00',
      is_active = true,
    } = req.body;

    if (day_of_week === undefined || day_of_week === null) {
      return res.status(400).json({ error: 'day_of_week is required (0 for Sunday to 6 for Saturday)' });
    }

    const singleShifts = (shift_type === 'BOTH') ? ['MORNING', 'EVENING'] : [shift_type];
    const results = [];

    for (const sType of singleShifts) {
      const sStart = sType === 'EVENING' ? '14:00:00' : (start_time.length === 5 ? `${start_time}:00` : start_time);
      const sEnd = sType === 'EVENING' ? '18:00:00' : (end_time.length === 5 ? `${end_time}:00` : end_time);

      const schedRes = await query(
        `INSERT INTO availability_schedules (
           doctor_profile_id, day_of_week, shift_type,
           slot_duration_minutes, max_patients_per_slot, max_accompanying_persons, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (doctor_profile_id, day_of_week, shift_type) 
         DO UPDATE SET 
           is_active = EXCLUDED.is_active,
           slot_duration_minutes = EXCLUDED.slot_duration_minutes,
           max_patients_per_slot = EXCLUDED.max_patients_per_slot,
           max_accompanying_persons = EXCLUDED.max_accompanying_persons
         RETURNING *`,
        [
          doctorProfileId,
          parseInt(day_of_week, 10),
          sType,
          parseInt(slot_duration_minutes, 10),
          parseInt(max_patients_per_slot, 10),
          parseInt(max_accompanying_persons, 10),
          is_active,
        ]
      );

      const schedule = schedRes.rows[0];

      await query(`DELETE FROM schedule_time_blocks WHERE schedule_id = $1`, [schedule.id]);

      if (is_active) {
        await query(
          `INSERT INTO schedule_time_blocks (schedule_id, start_time, end_time, max_tokens_per_slot)
           VALUES ($1, $2, $3, $4)`,
          [schedule.id, sStart, sEnd, parseInt(max_patients_per_slot, 10)]
        );
      }
      results.push(schedule);
    }

    return res.status(201).json({
      success: true,
      message: 'Schedule saved successfully',
      schedule,
    });
  } catch (err) {
    console.error('Error saving schedule:', err);
    return res.status(500).json({ error: 'Failed to save schedule: ' + err.message });
  }
});

// GET Doctor's Booking Pages
router.get('/pages', authenticateToken, async (req, res) => {
  try {
    const doctorProfileId = req.user.doctorProfileId;
    const organizationId = req.user.organizationId;
    const { doctor_filter } = req.query;

    let queryStr = `
      SELECT bp.*, 
             u.full_name as doctor_name, 
             dp.specialty,
             COALESCE(SUM(pda.total_visits), 0) as total_visits,
             COALESCE(SUM(pda.unique_visitors), 0) as unique_visitors
      FROM booking_pages bp
      JOIN doctor_profiles dp ON dp.id = bp.doctor_profile_id
      JOIN users u ON u.id = dp.user_id
      LEFT JOIN page_daily_analytics pda ON pda.booking_page_id = bp.id
      WHERE (bp.organization_id = $1 OR bp.doctor_profile_id = $2)
    `;
    const params = [organizationId, doctorProfileId];

    if (doctor_filter && doctor_filter !== 'ALL') {
      queryStr += ` AND bp.doctor_profile_id = $3`;
      params.push(doctorProfileId);
    }

    queryStr += ` GROUP BY bp.id, u.full_name, dp.specialty ORDER BY bp.created_at DESC`;

    const result = await query(queryStr, params);
    return res.json({ pages: result.rows });
  } catch (err) {
    console.error('Error fetching booking pages:', err);
    return res.status(500).json({ error: 'Failed to fetch booking pages' });
  }
});

// POST Create new Booking Page
router.post('/pages', authenticateToken, async (req, res) => {
  try {
    const {
      page_name,
      slug,
      description = 'Welcome to my scheduling page, please select an option below to book an appointment',
      slot_duration_minutes = 30,
      theme = 'Modern Minimal',
    } = req.body;

    if (!page_name || !slug) {
      return res.status(400).json({ error: 'Page name and URL slug are required' });
    }

    const doctorProfileId = req.user.doctorProfileId;
    const organizationId = req.user.organizationId;

    // Check slug collision
    const existing = await query(`SELECT id FROM booking_pages WHERE slug = $1`, [slug.trim().toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'This URL slug is already taken. Please choose another.' });
    }

    const result = await query(
      `INSERT INTO booking_pages (
         doctor_profile_id, organization_id, page_name, slug, description,
         theme, slot_duration_minutes, is_live
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        doctorProfileId,
        organizationId,
        page_name.trim(),
        slug.trim().toLowerCase(),
        description,
        theme,
        parseInt(slot_duration_minutes, 10),
      ]
    );

    const newPage = result.rows[0];
    return res.status(201).json({
      success: true,
      message: 'Booking page created successfully',
      page: {
        ...newPage,
        doctor_name: req.user.fullName || 'Doctor',
        total_visits: 0,
        unique_visitors: 0,
      },
    });
  } catch (err) {
    console.error('Error creating booking page:', err);
    return res.status(500).json({ error: 'Failed to create booking page: ' + err.message });
  }
});

// GET Single Booking Page by ID
router.get('/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const doctorProfileId = req.user.doctorProfileId;
    const organizationId = req.user.organizationId;

    const result = await query(
      `SELECT bp.*, 
              u.full_name as doctor_name, 
              dp.specialty,
              dp.qualification,
              u.avatar_url
       FROM booking_pages bp
       JOIN doctor_profiles dp ON dp.id = bp.doctor_profile_id
       JOIN users u ON u.id = dp.user_id
       WHERE bp.id = $1 AND (bp.organization_id = $2 OR bp.doctor_profile_id = $3)`,
      [id, organizationId, doctorProfileId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking page not found' });
    }

    return res.json({ page: result.rows[0] });
  } catch (err) {
    console.error('Error fetching booking page by id:', err);
    return res.status(500).json({ error: 'Failed to fetch booking page' });
  }
});

// PUT Update Booking Page
router.put('/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page_name,
      slug,
      logo_url,
      description,
      slot_duration_minutes,
      theme,
      logo_shape,
      color_mode,
      remove_branding,
      layout_style,
      corner_radius,
      bg_style,
      card_finish,
      cover_banner_url,
      button_style,
    } = req.body;
    const doctorProfileId = req.user.doctorProfileId;

    // Check slug collision if slug is updated
    if (slug) {
      const existing = await query(`SELECT id FROM booking_pages WHERE slug = $1 AND id != $2`, [slug.trim().toLowerCase(), id]);
      if (existing.rowCount > 0) {
        return res.status(400).json({ error: 'This URL slug is already taken. Please choose another.' });
      }
    }

    const result = await query(
      `UPDATE booking_pages 
       SET page_name = COALESCE($1, page_name),
           slug = COALESCE($2, slug),
           logo_url = COALESCE($3, logo_url),
           description = COALESCE($4, description),
           slot_duration_minutes = COALESCE($5, slot_duration_minutes),
           theme = COALESCE($6, theme),
           logo_shape = COALESCE($7, logo_shape),
           color_mode = COALESCE($8, color_mode),
           remove_branding = COALESCE($9, remove_branding),
           layout_style = COALESCE($10, layout_style),
           corner_radius = COALESCE($11, corner_radius),
           bg_style = COALESCE($12, bg_style),
           card_finish = COALESCE($13, card_finish),
           cover_banner_url = COALESCE($14, cover_banner_url),
           button_style = COALESCE($15, button_style),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 AND (doctor_profile_id = $17 OR organization_id = $18)
       RETURNING *`,
      [
        page_name !== undefined ? page_name.trim() : null,
        slug !== undefined ? slug.trim().toLowerCase() : null,
        logo_url !== undefined ? logo_url : null,
        description !== undefined ? description.trim() : null,
        slot_duration_minutes !== undefined ? parseInt(slot_duration_minutes, 10) : null,
        theme !== undefined ? theme : null,
        logo_shape !== undefined ? logo_shape : null,
        color_mode !== undefined ? color_mode : null,
        remove_branding !== undefined ? remove_branding : null,
        layout_style !== undefined ? layout_style : null,
        corner_radius !== undefined ? corner_radius : null,
        bg_style !== undefined ? bg_style : null,
        card_finish !== undefined ? card_finish : null,
        cover_banner_url !== undefined ? cover_banner_url : null,
        button_style !== undefined ? button_style : null,
        id,
        doctorProfileId,
        req.user.organizationId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking page not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Booking page updated successfully',
      page: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating booking page:', err);
    return res.status(500).json({ error: 'Failed to update booking page: ' + err.message });
  }
});

// DELETE Booking Page
router.delete('/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const doctorProfileId = req.user.doctorProfileId;

    const result = await query(
      `DELETE FROM booking_pages 
       WHERE id = $1 AND (doctor_profile_id = $2 OR organization_id = $3)
       RETURNING id`,
      [id, doctorProfileId, req.user.organizationId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking page not found or unauthorized' });
    }

    return res.json({ success: true, message: 'Booking page deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking page:', err);
    return res.status(500).json({ error: 'Failed to delete booking page: ' + err.message });
  }
});

// GET Users / Team Members for the organization
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if ((req.user.role || '').toUpperCase() === 'RECEPTIONIST') {
      return res.status(403).json({ error: 'Access denied: Receptionists cannot view or manage clinic users' });
    }

    const organizationId = req.user.organizationId;

    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, 
              COALESCE(om.status, u.account_status, 'ACTIVE') as status,
              u.created_at,
              COALESCE(r.name, CASE WHEN dp.id IS NOT NULL THEN 'DOCTOR' ELSE 'CLINIC_ADMIN' END) as role,
              dp.specialty
       FROM users u
       LEFT JOIN organization_members om ON om.user_id = u.id
       LEFT JOIN roles r ON r.id = om.role_id
       LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
       WHERE om.organization_id = $1 OR dp.organization_id = $1 OR u.id = $2
       GROUP BY u.id, om.status, r.name, dp.id, dp.specialty
       ORDER BY u.created_at DESC`,
      [organizationId, req.user.userId]
    );

    return res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST Add User / Member
router.post('/users', authenticateToken, async (req, res) => {
  try {
    if ((req.user.role || '').toUpperCase() === 'RECEPTIONIST') {
      return res.status(403).json({ error: 'Access denied: Receptionists cannot view or manage clinic users' });
    }

    const { full_name, email, phone, role = 'DOCTOR', specialty = 'General Medicine', status = 'ACTIVE', password } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    let organizationId = req.user.organizationId;
    if (!organizationId) {
      const orgQuery = await query(
        `SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
        [req.user.userId]
      );
      if (orgQuery.rowCount > 0) {
        organizationId = orgQuery.rows[0].organization_id;
      } else {
        const docQuery = await query(
          `SELECT organization_id FROM doctor_profiles WHERE user_id = $1 LIMIT 1`,
          [req.user.userId]
        );
        if (docQuery.rowCount > 0) {
          organizationId = docQuery.rows[0].organization_id;
        } else {
          const firstOrg = await query(`SELECT id FROM organizations LIMIT 1`);
          if (firstOrg.rowCount > 0) organizationId = firstOrg.rows[0].id;
        }
      }
    }

    let passwordHash = null;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    let userRes = await query(`SELECT id FROM users WHERE email = $1`, [email.trim().toLowerCase()]);
    let userId;
    if (userRes.rowCount > 0) {
      userId = userRes.rows[0].id;
      if (passwordHash) {
        await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
      }
    } else {
      const newUser = await query(
        `INSERT INTO users (full_name, email, phone, password_hash, account_status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [full_name.trim(), email.trim().toLowerCase(), phone?.trim() || null, passwordHash, status]
      );
      userId = newUser.rows[0].id;
    }

    // Resolve or create role_id for organization_members
    let roleRes = await query(
      `SELECT id FROM roles WHERE organization_id = $1 AND name = $2 LIMIT 1`,
      [organizationId, role]
    );
    let roleId = roleRes.rows[0]?.id;
    if (!roleId) {
      const newRole = await query(
        `INSERT INTO roles (organization_id, name, is_system_role)
         VALUES ($1, $2, true) RETURNING id`,
        [organizationId, role]
      );
      roleId = newRole.rows[0].id;
    }

    await query(
      `INSERT INTO organization_members (organization_id, user_id, role_id, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id, status = EXCLUDED.status`,
      [organizationId, userId, roleId, status]
    );

    if (role === 'DOCTOR') {
      await query(
        `INSERT INTO doctor_profiles (user_id, organization_id, specialty)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET specialty = EXCLUDED.specialty`,
        [userId, organizationId, specialty]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'User added successfully',
      user: {
        id: userId,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        role,
        specialty,
        status,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error adding user:', err);
    return res.status(500).json({ error: 'Failed to add user: ' + err.message });
  }
});

// GET Single User by ID
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    if ((req.user.role || '').toUpperCase() === 'RECEPTIONIST') {
      return res.status(403).json({ error: 'Access denied: Receptionists cannot view or manage clinic users' });
    }

    const { id } = req.params;
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, 
              COALESCE(om.status, u.account_status, 'ACTIVE') as status,
              u.created_at,
              COALESCE(r.name, CASE WHEN dp.id IS NOT NULL THEN 'DOCTOR' ELSE 'CLINIC_ADMIN' END) as role,
              dp.specialty
       FROM users u
       LEFT JOIN organization_members om ON om.user_id = u.id
       LEFT JOIN roles r ON r.id = om.role_id
       LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, om.status, r.name, dp.id, dp.specialty
       LIMIT 1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Error fetching user details:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT Update User
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    if ((req.user.role || '').toUpperCase() === 'RECEPTIONIST') {
      return res.status(403).json({ error: 'Access denied: Receptionists cannot view or manage clinic users' });
    }

    const { id } = req.params;
    const { full_name, phone, role, status, specialty, password } = req.body;

    let passwordHash = null;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    if (passwordHash) {
      await query(
        `UPDATE users 
         SET full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             account_status = COALESCE($3, account_status),
             password_hash = $4
         WHERE id = $5`,
        [full_name, phone, status, passwordHash, id]
      );
    } else {
      await query(
        `UPDATE users 
         SET full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             account_status = COALESCE($3, account_status)
         WHERE id = $4`,
        [full_name, phone, status, id]
      );
    }

    if (status) {
      await query(
        `UPDATE organization_members SET status = $1 WHERE user_id = $2`,
        [status, id]
      );
    }

    if (role) {
      let organizationId = req.user.organizationId;
      if (!organizationId) {
        const orgQ = await query(`SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`, [id]);
        if (orgQ.rowCount > 0) organizationId = orgQ.rows[0].organization_id;
      }
      if (organizationId) {
        let roleRes = await query(
          `SELECT id FROM roles WHERE organization_id = $1 AND name = $2 LIMIT 1`,
          [organizationId, role]
        );
        let roleId = roleRes.rows[0]?.id;
        if (!roleId) {
          const newRole = await query(
            `INSERT INTO roles (organization_id, name, is_system_role)
             VALUES ($1, $2, true) RETURNING id`,
            [organizationId, role]
          );
          roleId = newRole.rows[0].id;
        }
        await query(
          `UPDATE organization_members SET role_id = $1 WHERE user_id = $2`,
          [roleId, id]
        );
      }
    }

    if (specialty) {
      await query(
        `UPDATE doctor_profiles SET specialty = $1 WHERE user_id = $2`,
        [specialty, id]
      );
    }

    return res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE User / Member
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    if ((req.user.role || '').toUpperCase() === 'RECEPTIONIST') {
      return res.status(403).json({ error: 'Access denied: Receptionists cannot view or manage clinic users' });
    }

    const { id } = req.params;
    const organizationId = req.user.organizationId;

    await query(
      `DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, id]
    );

    return res.json({ success: true, message: 'User removed from clinic successfully' });
  } catch (err) {
    console.error('Error removing user:', err);
    return res.status(500).json({ error: 'Failed to remove user' });
  }
});

export default router;

