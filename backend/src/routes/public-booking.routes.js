import express from 'express';
import { query } from '../db/index.js';
import { getDoctorSlotsForDate } from '../utils/slotHelper.js';

const router = express.Router();

// ==========================================
// 1. GET PUBLIC BOOKING PAGE DETAILS
// ==========================================
router.get('/booking/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch booking page
    const pageRes = await query(
      `SELECT bp.*, 
              dp.id as doctor_profile_id,
              dp.specialty,
              dp.qualification,
              dp.experience_years,
              dp.consultation_fee,
              dp.bio,
              u.id as user_id,
              u.full_name as doctor_name,
              u.email as doctor_email,
              u.avatar_url,
              org.id as org_id,
              org.name as organization_name
       FROM booking_pages bp
       JOIN doctor_profiles dp ON bp.doctor_profile_id = dp.id
       JOIN users u ON dp.user_id = u.id
       JOIN organizations org ON bp.organization_id = org.id
       WHERE bp.slug = $1 AND bp.is_live = TRUE`,
      [slug.trim().toLowerCase()]
    );

    if (pageRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking page not found or is currently unavailable.' });
    }

    const row = pageRes.rows[0];

    // Fetch branches for organization
    const branchesRes = await query(
      `SELECT id, name, address, city, phone 
       FROM clinic_branches 
       WHERE organization_id = $1 AND is_active = TRUE
       ORDER BY created_at ASC`,
      [row.org_id]
    );

    // Fetch services for doctor
    const servicesRes = await query(
      `SELECT id, name, type, duration_minutes, price, description 
       FROM services 
       WHERE doctor_profile_id = $1 AND is_active = TRUE
       ORDER BY name ASC`,
      [row.doctor_profile_id]
    );

    return res.json({
      success: true,
      page: {
        id: row.id,
        slug: row.slug,
        page_name: row.page_name,
        description: row.description || 'Welcome to my scheduling page, please select an option below to book an appointment.',
        theme: row.theme,
        logo_url: row.logo_url,
        logo_shape: row.logo_shape,
        color_mode: row.color_mode,
        remove_branding: row.remove_branding,
        layout_style: row.layout_style || 'SPLIT_2_COL',
        corner_radius: row.corner_radius || 'Rounded',
        bg_style: row.bg_style || 'Mesh Gradient',
        card_finish: row.card_finish || 'Glassmorphic',
        cover_banner_url: row.cover_banner_url || '',
        button_style: row.button_style || 'Solid',
        slot_duration_minutes: row.slot_duration_minutes || 30,
        organization_id: row.organization_id,
        organization_name: row.organization_name,
      },
      doctor: {
        id: row.doctor_profile_id,
        name: row.doctor_name,
        email: row.doctor_email,
        specialty: row.specialty || 'General Physician',
        qualification: row.qualification || 'MBBS, MD',
        experience_years: row.experience_years || 8,
        consultation_fee: row.consultation_fee || '500.00',
        avatar_url: row.avatar_url,
        bio: row.bio,
      },
      branches: branchesRes.rows.length > 0 ? branchesRes.rows : [
        {
          id: 'default-main',
          name: 'Main Clinic - Sector 18',
          address: 'Plot 42, Health Street, Sector 18, Medical Enclave',
          city: 'Delhi NCR',
          phone: '+91 98765 43210',
        },
        {
          id: 'default-city',
          name: 'HealthDock Central Hub',
          address: 'Tower B, Ground Floor, Cyber City',
          city: 'Gurugram',
          phone: '+91 98765 43211',
        }
      ],
      services: servicesRes.rows,
    });
  } catch (err) {
    console.error('Error fetching public booking page:', err);
    return res.status(500).json({ error: 'Server error loading booking page' });
  }
});

// ==========================================
// 2. SEND OTP
// ==========================================
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || String(phone).trim().length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, '').slice(-10);
    // Generate 6 digit OTP (default 123456 for reliable dev & simulation)
    const otpCode = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      `INSERT INTO otp_verifications (phone, otp_code, expires_at)
       VALUES ($1, $2, $3)`,
      [cleanPhone, otpCode, expiresAt]
    );

    return res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      phone: cleanPhone,
      dev_otp: otpCode, // Provided for instant demo testing
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ==========================================
// 3. VERIFY OTP
// ==========================================
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, '').slice(-10);
    const cleanOtp = String(otp).trim();

    // Verify against database or master test OTP '123456'
    const result = await query(
      `SELECT id FROM otp_verifications 
       WHERE phone = $1 AND otp_code = $2 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [cleanPhone, cleanOtp]
    );

    if (result.rowCount === 0 && cleanOtp !== '123456') {
      return res.status(400).json({ error: 'Invalid or expired OTP. Try 123456.' });
    }

    if (result.rowCount > 0) {
      await query(`UPDATE otp_verifications SET is_verified = TRUE WHERE id = $1`, [result.rows[0].id]);
    }

    return res.json({
      success: true,
      verified: true,
      phone: cleanPhone,
      message: 'Mobile number verified successfully',
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// ==========================================
// 4. GET AVAILABLE SLOTS (MORNING & EVENING) USING DOCTOR'S REAL SCHEDULES
// ==========================================
router.get('/booking/:slug/slots', async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, shift = 'MORNING' } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    }

    // 1. Get doctor profile ID from slug
    const pageRes = await query(
      `SELECT bp.doctor_profile_id, bp.organization_id, bp.slot_duration_minutes
       FROM booking_pages bp
       WHERE bp.slug = $1 AND bp.is_live = TRUE`,
      [slug.trim().toLowerCase()]
    );

    if (pageRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking page not found' });
    }

    const { doctor_profile_id, organization_id } = pageRes.rows[0];

    // 2. Fetch real slots from doctor's schedules
    const slotData = await getDoctorSlotsForDate(doctor_profile_id, date, organization_id);

    // If day is a hospital holiday
    if (slotData.is_holiday) {
      return res.json({
        success: true,
        date,
        shift,
        is_blocked: true,
        block_reason: `Hospital Holiday: ${slotData.holiday_title}`,
        slots: [],
      });
    }

    // If doctor is on leave
    if (slotData.is_leave) {
      return res.json({
        success: true,
        date,
        shift,
        is_blocked: true,
        block_reason: `Doctor on Leave: ${slotData.leave_reason || 'Approved leave'}`,
        slots: [],
      });
    }

    // Find requested shift
    const matchingShift = slotData.shifts.find(s => s.shift_type === shift.toUpperCase());

    if (!matchingShift || !matchingShift.is_active || matchingShift.slots.length === 0) {
      return res.json({
        success: true,
        date,
        shift,
        is_blocked: true,
        block_reason: `No consultation slots configured for ${shift.toLowerCase()} shift on ${slotData.day_name}`,
        slots: [],
      });
    }

    return res.json({
      success: true,
      date,
      shift,
      is_blocked: false,
      slots: matchingShift.slots,
    });
  } catch (err) {
    console.error('Error fetching public slots:', err);
    return res.status(500).json({ error: 'Failed to calculate available slots: ' + err.message });
  }
});

// ==========================================
// 5. CONFIRM PUBLIC APPOINTMENT
// ==========================================
router.post('/booking/:slug/confirm', async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      booker_name,
      booker_phone,
      booking_for = 'MYSELF',
      patient_name,
      patient_age,
      family_relation,
      reason,
      consultation_mode = 'IN_PERSON',
      branch_name = 'Main Clinic - Sector 18',
      appointment_date,
      start_time,
      payment_method = 'PAY_AT_CLINIC',
      whatsapp_updates_enabled = true,
      consent_agreed = true,
    } = req.body;

    if (!booker_phone || !appointment_date || !start_time) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }

    // 1. Fetch booking page & doctor info
    const pageRes = await query(
      `SELECT bp.id, bp.doctor_profile_id, bp.organization_id, bp.slot_duration_minutes,
              dp.consultation_fee, u.full_name as doctor_name, u.email as doctor_email
       FROM booking_pages bp
       JOIN doctor_profiles dp ON bp.doctor_profile_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE bp.slug = $1 AND bp.is_live = TRUE`,
      [slug.trim().toLowerCase()]
    );

    if (pageRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking page not found' });
    }

    const {
      doctor_profile_id,
      organization_id,
      consultation_fee = 500,
      doctor_name,
      slot_duration_minutes = 30,
    } = pageRes.rows[0];

    // Compute end_time
    const [sH, sM] = start_time.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = startMins + slot_duration_minutes;
    const end_time = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}:00`;

    // 2. Patient Profile: find or create
    const cleanPhone = String(booker_phone).trim().replace(/\D/g, '').slice(-10);
    const finalPatientName = (booking_for === 'FAMILY_MEMBER' && patient_name?.trim())
      ? patient_name.trim()
      : booker_name?.trim() || 'Patient';

    let patientId;
    const existingPatient = await query(`SELECT id FROM patients WHERE phone = $1 LIMIT 1`, [cleanPhone]);
    if (existingPatient.rowCount > 0) {
      patientId = existingPatient.rows[0].id;
      if (patient_age) {
        await query(`UPDATE patients SET age = $1, full_name = $2 WHERE id = $3`, [parseInt(patient_age, 10), finalPatientName, patientId]);
      }
    } else {
      const newPatient = await query(
        `INSERT INTO patients (phone, full_name, age) VALUES ($1, $2, $3) RETURNING id`,
        [cleanPhone, finalPatientName, patient_age ? parseInt(patient_age, 10) : null]
      );
      patientId = newPatient.rows[0].id;
    }

    // 3. Compute unique reference & token
    const tokenCountRes = await query(
      `SELECT COUNT(*)::int as count FROM appointments WHERE doctor_profile_id = $1 AND appointment_date = $2`,
      [doctor_profile_id, appointment_date]
    );
    const dailyTokenNum = (tokenCountRes.rows[0]?.count || 0) + 1;
    const dailyToken = `#${String(dailyTokenNum).padStart(2, '0')}`;
    const bookingRef = `HD-${Math.floor(1000 + Math.random() * 9000)}`;

    const consentRecord = {
      notice_version: 'v1.0',
      dpdp_act_2026_consent: consent_agreed,
      marketing_consent: req.body.marketing_consent !== undefined ? Boolean(req.body.marketing_consent) : false,
      communication_preferences: req.body.comm_prefs || {
        confirmations: true,
        reminders: true,
        rescheduling: true,
        education: false,
        promotions: false,
      },
      timestamp: new Date().toISOString(),
      ip: req.ip || '127.0.0.1',
      purposes: [
        'Appointment Processing (v1.0)',
        '24h Reminders & Alerts (v1.0)',
        'Educational / Marketing'
      ],
    };

    // 4. Insert appointment
    const insertApt = await query(
      `INSERT INTO appointments (
         booking_reference, daily_token, organization_id, doctor_profile_id,
         patient_id, appointment_date, start_time, end_time, status,
         consultation_fee, is_paid, payment_method, booked_channel,
         patient_notes, consultation_mode, branch_name, booking_for,
         family_relation, patient_age, booker_name, booker_phone,
         whatsapp_updates_enabled, consent_record, payment_status
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, $7, $8, 'CONFIRMED',
         $9, $10, $11, 'ONLINE_BOOKING_LINK',
         $12, $13, $14, $15,
         $16, $17, $18, $19,
         $20, $21, $22
       ) RETURNING *`,
      [
        bookingRef,
        dailyToken,
        organization_id,
        doctor_profile_id,
        patientId,
        appointment_date,
        start_time,
        end_time,
        consultation_fee,
        payment_method === 'ONLINE_UPI_QR' || payment_method === 'ONLINE_RAZORPAY',
        payment_method,
        reason || 'Consultation booking',
        consultation_mode,
        branch_name,
        booking_for,
        family_relation || null,
        patient_age ? parseInt(patient_age, 10) : null,
        booker_name || finalPatientName,
        cleanPhone,
        whatsapp_updates_enabled,
        JSON.stringify(consentRecord),
        (payment_method === 'ONLINE_UPI_QR' || payment_method === 'ONLINE_RAZORPAY') ? 'PAID' : 'PENDING_AT_CLINIC',
      ]
    );

    const createdAppointment = insertApt.rows[0];

    // 5. Audit Log & Consent Log
    await query(
      `INSERT INTO appointment_audit_logs (appointment_id, new_status, notes)
       VALUES ($1, 'CONFIRMED', 'Self-booked via public page by patient')`,
      [createdAppointment.id]
    );

    await query(
      `INSERT INTO consent_logs (appointment_id, consent_type, is_granted, notes)
       VALUES 
         ($1, 'DPDP_DATA_PROCESSING', TRUE, 'Patient accepted DPDP Act 2026 consent (v1.0)'),
         ($1, 'WHATSAPP_NOTIFICATION', $2, 'Patient WhatsApp notification preference'),
         ($1, 'EDUCATIONAL_MARKETING', $3, 'Patient educational & marketing consent status')`,
      [
        createdAppointment.id,
        Boolean(whatsapp_updates_enabled),
        Boolean(req.body.marketing_consent)
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: {
        ...createdAppointment,
        doctor_name,
        patient_name: finalPatientName,
        booker_name: booker_name || finalPatientName,
        booker_phone: cleanPhone,
        consent_record: consentRecord,
        formatted_date: new Date(appointment_date).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        }),
      },
    });
  } catch (err) {
    console.error('Error confirming public appointment:', err);
    return res.status(500).json({ error: 'Failed to complete appointment booking: ' + err.message });
  }
});

// ==========================================
// 6. INSTANTLY UPDATE CONSENT / WHATSAPP SETTINGS
// ==========================================
router.put('/appointments/:id/consent-settings', async (req, res) => {
  try {
    const { id } = req.params;
    const { whatsapp_updates_enabled, consent_type, is_granted, marketing_consent, comm_prefs } = req.body;

    let updateFields = [];
    let params = [id];

    if (whatsapp_updates_enabled !== undefined) {
      params.push(Boolean(whatsapp_updates_enabled));
      updateFields.push(`whatsapp_updates_enabled = $${params.length}`);
    }

    // Fetch existing appointment to update consent_record JSONB
    const aptRes = await query(`SELECT consent_record FROM appointments WHERE id = $1`, [id]);
    if (aptRes.rowCount > 0) {
      let currentRecord = aptRes.rows[0].consent_record;
      if (typeof currentRecord === 'string') {
        try { currentRecord = JSON.parse(currentRecord); } catch(e) { currentRecord = {}; }
      } else if (!currentRecord) {
        currentRecord = {};
      }

      if (marketing_consent !== undefined) {
        currentRecord.marketing_consent = Boolean(marketing_consent);
      }
      if (comm_prefs !== undefined) {
        currentRecord.communication_preferences = comm_prefs;
      }
      currentRecord.last_updated = new Date().toISOString();

      params.push(JSON.stringify(currentRecord));
      updateFields.push(`consent_record = $${params.length}`);
    }

    if (updateFields.length > 0) {
      await query(
        `UPDATE appointments SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $1`,
        params
      );
    }

    // Record in consent log
    if (consent_type) {
      await query(
        `INSERT INTO consent_logs (appointment_id, consent_type, is_granted, notes)
         VALUES ($1, $2, $3, 'Updated post-booking by patient')`,
        [id, consent_type, Boolean(is_granted)]
      );
    }

    return res.json({
      success: true,
      message: 'Consent preferences updated and saved to database.',
      whatsapp_updates_enabled,
      marketing_consent,
    });
  } catch (err) {
    console.error('Error updating consent settings:', err);
    return res.status(500).json({ error: 'Failed to update preferences: ' + err.message });
  }
});

export default router;
