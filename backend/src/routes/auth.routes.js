import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'healthdock_jwt_super_secret_key_2026';

// Send Email OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'SIGNUP' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      `INSERT INTO email_otps (email, otp_code, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [email.toLowerCase(), otpCode, purpose, expiresAt]
    );

    console.log(`[OTP] Generated OTP for ${email}: ${otpCode}`);

    return res.json({
      success: true,
      message: 'OTP sent to your email address',
      // In development, return the code directly so user can easily test
      devOtp: otpCode,
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Verify Email OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp_code, purpose = 'SIGNUP' } = req.body;
    if (!email || !otp_code) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    const result = await query(
      `SELECT * FROM email_otps 
       WHERE email = $1 AND otp_code = $2 AND purpose = $3 AND is_used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), otp_code.trim(), purpose]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    await query(`UPDATE email_otps SET is_used = true WHERE id = $1`, [result.rows[0].id]);

    return res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// Doctor Signup
router.post('/signup', async (req, res) => {
  try {
    const { full_name, email, phone, password, specialty = 'General Physician', clinic_name } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [cleanEmail]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate unique slug for doctor booking page
    let baseSlug = full_name
      .toLowerCase()
      .replace(/^dr\.\s*/i, 'dr-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!baseSlug) baseSlug = 'doctor';

    let bookingSlug = baseSlug;
    let counter = 1;
    while (true) {
      const slugCheck = await query(`SELECT id FROM booking_pages WHERE slug = $1`, [bookingSlug]);
      if (slugCheck.rowCount === 0) break;
      bookingSlug = `${baseSlug}-${counter++}`;
    }

    // Generate org slug
    const orgName = clinic_name || `${full_name}'s Practice`;
    let orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'clinic';
    const orgCheck = await query(`SELECT id FROM organizations WHERE slug = $1`, [orgSlug]);
    if (orgCheck.rowCount > 0) {
      orgSlug = `${orgSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 1. Create User
    const userRes = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, is_email_verified, account_status)
       VALUES ($1, $2, $3, $4, true, 'ACTIVE')
       RETURNING id, full_name, email, phone, created_at`,
      [full_name, cleanEmail, phone || null, passwordHash]
    );
    const user = userRes.rows[0];

    // 2. Create Organization
    const orgRes = await query(
      `INSERT INTO organizations (name, slug, email, phone, created_by, plan_tier)
       VALUES ($1, $2, $3, $4, $5, 'SINGLE_PRACTICE')
       RETURNING id, name, slug`,
      [orgName, orgSlug, cleanEmail, phone || null, user.id]
    );
    const org = orgRes.rows[0];

    // 3. Create or Fetch Role
    let roleRes = await query(
      `SELECT id FROM roles WHERE organization_id = $1 AND name = 'CLINIC_ADMIN'`,
      [org.id]
    );
    let roleId;
    if (roleRes.rowCount === 0) {
      const newRole = await query(
        `INSERT INTO roles (organization_id, name, is_system_role)
         VALUES ($1, 'CLINIC_ADMIN', true)
         RETURNING id`,
        [org.id]
      );
      roleId = newRole.rows[0].id;
    } else {
      roleId = roleRes.rows[0].id;
    }

    // 4. Link User to Organization
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role_id, status)
       VALUES ($1, $2, $3, 'ACTIVE')`,
      [org.id, user.id, roleId]
    );

    // 5. Create Doctor Profile
    const docRes = await query(
      `INSERT INTO doctor_profiles (user_id, organization_id, specialty, consultation_fee)
       VALUES ($1, $2, $3, 1000.00)
       RETURNING id, user_id, organization_id, specialty, consultation_fee`,
      [user.id, org.id, specialty]
    );
    const doctorProfile = docRes.rows[0];

    // 6. Create Initial Booking Page (matches Screenshots 1 & 2)
    const pageRes = await query(
      `INSERT INTO booking_pages (
         doctor_profile_id, organization_id, page_name, slug, description, theme, timezone
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, page_name, slug, description, theme, timezone, logo_url, is_live`,
      [
        doctorProfile.id,
        org.id,
        full_name,
        bookingSlug,
        'Welcome to my scheduling page, please select an option below to book an appointment',
        'Modern Minimal',
        'Asia/Calcutta'
      ]
    );
    const bookingPage = pageRes.rows[0];

    // 7. Seed Initial Default Weekly Availability (Monday through Friday 09:00 - 17:00)
    for (let day = 1; day <= 5; day++) {
      const sched = await query(
        `INSERT INTO availability_schedules (doctor_profile_id, day_of_week, is_active)
         VALUES ($1, $2, true)
         RETURNING id`,
        [doctorProfile.id, day]
      );
      await query(
        `INSERT INTO schedule_time_blocks (schedule_id, start_time, end_time)
         VALUES ($1, '09:00:00', '17:00:00')`,
        [sched.rows[0].id]
      );
    }

    // 8. Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        doctorProfileId: doctorProfile.id,
        organizationId: org.id,
        bookingSlug: bookingPage.slug,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Doctor account created successfully',
      token,
      user,
      organization: org,
      doctorProfile,
      bookingPage,
    });
  } catch (err) {
    console.error('Error in signup:', err);
    return res.status(500).json({ error: 'Failed to create account. ' + err.message });
  }
});

// Doctor Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRes = await query(`SELECT * FROM users WHERE email = $1`, [cleanEmail]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Fetch doctor profile and booking page
    const docRes = await query(
      `SELECT * FROM doctor_profiles WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    const doctorProfile = docRes.rows[0] || null;

    let bookingPage = null;
    if (doctorProfile) {
      const pageRes = await query(
        `SELECT * FROM booking_pages WHERE doctor_profile_id = $1 LIMIT 1`,
        [doctorProfile.id]
      );
      bookingPage = pageRes.rows[0] || null;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        doctorProfileId: doctorProfile?.id,
        organizationId: doctorProfile?.organization_id,
        bookingSlug: bookingPage?.slug,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
      },
      doctorProfile,
      bookingPage,
    });
  } catch (err) {
    console.error('Error in login:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Current User Details
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await query(
      `SELECT id, full_name, email, phone, avatar_url, created_at FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRes.rows[0];

    const docRes = await query(
      `SELECT * FROM doctor_profiles WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    const doctorProfile = docRes.rows[0] || null;

    let bookingPage = null;
    if (doctorProfile) {
      const pageRes = await query(
        `SELECT * FROM booking_pages WHERE doctor_profile_id = $1 LIMIT 1`,
        [doctorProfile.id]
      );
      bookingPage = pageRes.rows[0] || null;
    }

    return res.json({
      user,
      doctorProfile,
      bookingPage,
    });
  } catch (err) {
    console.error('Error fetching me:', err);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;
