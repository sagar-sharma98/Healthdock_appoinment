import { query } from '../db/index.js';

// Convert HH:MM or HH:MM:SS to total minutes from midnight
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

// Convert total minutes from midnight to HH:MM format
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Format HH:MM to 12-hour display string (e.g. 09:30 -> "9:30 AM")
export function format12Hour(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${period}`;
}

/**
 * Calculate all slots for a specific doctor on a specific date
 */
export async function getDoctorSlotsForDate(doctorProfileId, dateStr, organizationId) {
  // 1. Determine day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  // 2. Fetch active schedules and time blocks for this doctor on this day
  const schedRes = await query(
    `SELECT s.*, 
            json_agg(
              json_build_object(
                'id', tb.id,
                'start_time', tb.start_time,
                'end_time', tb.end_time,
                'max_tokens_per_slot', tb.max_tokens_per_slot
              )
            ) FILTER (WHERE tb.id IS NOT NULL) as time_blocks
     FROM availability_schedules s
     LEFT JOIN schedule_time_blocks tb ON tb.schedule_id = s.id
     WHERE s.doctor_profile_id = $1 AND s.day_of_week = $2 AND s.is_active = TRUE
     GROUP BY s.id`,
    [doctorProfileId, dayOfWeek]
  );

  const schedules = schedRes.rows;

  // 3. Check Hospital Holiday
  let holiday = null;
  if (organizationId) {
    const holRes = await query(
      `SELECT title, holiday_type FROM hospital_holidays 
       WHERE organization_id = $1 AND is_active = TRUE 
       AND start_date <= $2 AND end_date >= $2 LIMIT 1`,
      [organizationId, dateStr]
    );
    if (holRes.rowCount > 0) {
      holiday = holRes.rows[0];
    }
  }

  // 4. Check Doctor Leave
  let leave = null;
  const leaveRes = await query(
    `SELECT reason, leave_type, session FROM doctor_leaves 
     WHERE doctor_profile_id = $1 AND status = 'APPROVED' 
     AND start_date <= $2 AND end_date >= $2 LIMIT 1`,
    [doctorProfileId, dateStr]
  );
  if (leaveRes.rowCount > 0) {
    leave = leaveRes.rows[0];
  }

  // 5. Fetch booked appointments for doctor on this date
  const bookedRes = await query(
    `SELECT a.id, a.booking_reference, a.daily_token, a.start_time::text, a.end_time::text,
            a.consultation_mode, a.status,
            COALESCE(p.full_name, a.booker_name, 'Patient') as patient_name,
            COALESCE(p.phone, a.booker_phone) as patient_phone
     FROM appointments a
     LEFT JOIN patients p ON a.patient_id = p.id
     WHERE a.doctor_profile_id = $1 
       AND a.appointment_date = $2 
       AND a.status NOT IN ('CANCELLED')`,
    [doctorProfileId, dateStr]
  );

  const bookingsMap = new Map();
  bookedRes.rows.forEach(b => {
    const key = b.start_time.slice(0, 5);
    bookingsMap.set(key, b);
  });

  // 6. Fetch manual slot blocks
  const blocksRes = await query(
    `SELECT start_time::text, reason FROM doctor_slot_blocks 
     WHERE doctor_profile_id = $1 AND block_date = $2`,
    [doctorProfileId, dateStr]
  );
  const slotBlocksMap = new Map();
  blocksRes.rows.forEach(sb => {
    slotBlocksMap.set(sb.start_time.slice(0, 5), sb.reason || 'Blocked by Doctor');
  });

  // 7. Generate slots for MORNING and EVENING shifts
  const shiftConfigs = [
    { type: 'MORNING', label: 'Morning Shift', defaultStart: 9 * 60, defaultEnd: 13 * 60 },
    { type: 'EVENING', label: 'Evening Shift', defaultStart: 14 * 60, defaultEnd: 18 * 60 },
  ];

  const shiftResults = [];
  let totalSlotsCount = 0;
  let availableSlotsCount = 0;
  let bookedSlotsCount = 0;
  let blockedSlotsCount = 0;

  for (const shiftCfg of shiftConfigs) {
    // Find matching schedule for this shift, or fallback to an active schedule that covers this shift's window
    let sched = schedules.find(s => s.shift_type === shiftCfg.type || s.shift_type === 'BOTH');
    if (!sched && schedules.length > 0) {
      // Check if any schedule covers this window (e.g. 9-17)
      for (const s of schedules) {
        if (s.shift_type === 'BOTH') {
          sched = s;
          break;
        }
        const tb = s.time_blocks?.[0];
        const tbStart = tb ? timeToMinutes(tb.start_time) : 9 * 60;
        const tbEnd = tb ? timeToMinutes(tb.end_time) : 17 * 60;
        if (tbStart < shiftCfg.defaultEnd && tbEnd > shiftCfg.defaultStart) {
          sched = s;
          break;
        }
      }
    }

    if (!sched) {
      shiftResults.push({
        shift_type: shiftCfg.type,
        label: `${shiftCfg.label} (${format12Hour(minutesToTime(shiftCfg.defaultStart))} – ${format12Hour(minutesToTime(shiftCfg.defaultEnd))})`,
        is_active: false,
        reason: 'No schedule configured for this shift',
        slots: [],
      });
      continue;
    }

    const duration = sched.slot_duration_minutes || 30;
    const tb = sched.time_blocks?.[0];
    const schedStartMins = tb ? timeToMinutes(tb.start_time) : shiftCfg.defaultStart;
    const schedEndMins = tb ? timeToMinutes(tb.end_time) : shiftCfg.defaultEnd;

    // Constrain slot start/end to this shift's window
    const windowStart = Math.max(schedStartMins, shiftCfg.defaultStart);
    const windowEnd = Math.min(schedEndMins, shiftCfg.defaultEnd);

    // If window is invalid, skip
    if (windowStart >= windowEnd) {
      shiftResults.push({
        shift_type: shiftCfg.type,
        label: `${shiftCfg.label} (${format12Hour(minutesToTime(shiftCfg.defaultStart))} – ${format12Hour(minutesToTime(shiftCfg.defaultEnd))})`,
        is_active: false,
        reason: 'Shift hours outside working schedule',
        slots: [],
      });
      continue;
    }

    // Check shift-level leave or holiday
    const isShiftBlockedByHoliday = Boolean(holiday);
    const isShiftBlockedByLeave = Boolean(
      leave && (
        leave.session === 'FULL_DAY' ||
        (leave.session === 'FIRST_HALF' && shiftCfg.type === 'MORNING') ||
        (leave.session === 'SECOND_HALF' && shiftCfg.type === 'EVENING')
      )
    );

    const shiftSlots = [];
    let cur = windowStart;

    while (cur < windowEnd) {
      const startStr = minutesToTime(cur);
      const endStr = minutesToTime(cur + duration);
      const startFormatted = format12Hour(startStr);
      const endFormatted = format12Hour(endStr);
      const label = startFormatted; // Only start time
      const shortLabel = startFormatted;
      const timeRange = `${startFormatted} - ${endFormatted}`;

      totalSlotsCount++;

      let status = 'AVAILABLE';
      let blockReason = null;
      let bookingInfo = null;

      if (isShiftBlockedByHoliday) {
        status = 'BLOCKED';
        blockReason = `Holiday: ${holiday.title}`;
        blockedSlotsCount++;
      } else if (isShiftBlockedByLeave) {
        status = 'BLOCKED';
        blockReason = `Doctor Leave: ${leave.reason || leave.leave_type}`;
        blockedSlotsCount++;
      } else if (slotBlocksMap.has(startStr)) {
        status = 'BLOCKED';
        blockReason = slotBlocksMap.get(startStr);
        blockedSlotsCount++;
      } else if (bookingsMap.has(startStr)) {
        status = 'BOOKED';
        const b = bookingsMap.get(startStr);
        bookingInfo = {
          id: b.id,
          reference: b.booking_reference,
          token: b.daily_token,
          patient_name: b.patient_name,
          phone: b.patient_phone,
          mode: b.consultation_mode,
        };
        bookedSlotsCount++;
      } else {
        availableSlotsCount++;
      }

      shiftSlots.push({
        slot_id: startStr,
        start_time: startStr,
        end_time: endStr,
        label,
        short_label: shortLabel,
        time_range: timeRange,
        shift_type: shiftCfg.type,
        status,
        is_available: status === 'AVAILABLE',
        block_reason: blockReason,
        booking: bookingInfo,
      });

      cur += duration;
    }

    shiftResults.push({
      shift_type: shiftCfg.type,
      label: `${shiftCfg.label} (${format12Hour(minutesToTime(windowStart))} – ${format12Hour(minutesToTime(windowEnd))})`,
      is_active: true,
      slot_duration_minutes: duration,
      slots: shiftSlots,
    });
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    date: dateStr,
    day_of_week: dayOfWeek,
    day_name: dayNames[dayOfWeek],
    is_holiday: Boolean(holiday),
    holiday_title: holiday?.title || null,
    is_leave: Boolean(leave),
    leave_reason: leave?.reason || null,
    summary: {
      total_slots: totalSlotsCount,
      available_slots: availableSlotsCount,
      booked_slots: bookedSlotsCount,
      blocked_slots: blockedSlotsCount,
    },
    shifts: shiftResults,
  };
}

/**
 * Calculate weekly doctor overview for all 7 days of the week (Monday to Sunday)
 */
export async function getWeeklyDoctorsOverview(organizationId, referenceDateStr, userId = null) {
  // If referenceDateStr provided, find the Monday of that week; else current week's Monday
  const refDate = referenceDateStr ? new Date(referenceDateStr + 'T00:00:00') : new Date();
  const currentDay = refDate.getDay(); // 0 = Sun, 1 = Mon ...
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const mondayDate = new Date(refDate);
  mondayDate.setDate(refDate.getDate() + distanceToMonday);

  // Generate 7 weekday dates: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const weekDays = [
    { day_of_week: 1, name: 'Monday', short: 'Mon' },
    { day_of_week: 2, name: 'Tuesday', short: 'Tue' },
    { day_of_week: 3, name: 'Wednesday', short: 'Wed' },
    { day_of_week: 4, name: 'Thursday', short: 'Thu' },
    { day_of_week: 5, name: 'Friday', short: 'Fri' },
    { day_of_week: 6, name: 'Saturday', short: 'Sat' },
    { day_of_week: 0, name: 'Sunday', short: 'Sun' },
  ];

  const weekDayDates = weekDays.map((wd, idx) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    return { ...wd, date: dateStr };
  });

  // Fetch only doctors belonging to the logged-in account's organization or user
  let docsQuery = `SELECT dp.id as doctor_profile_id,
            u.id as user_id,
            u.full_name as doctor_name,
            u.email as doctor_email,
            u.avatar_url,
            dp.specialty,
            dp.qualification,
            dp.consultation_fee,
            dp.organization_id
     FROM doctor_profiles dp
     JOIN users u ON dp.user_id = u.id`;
  let params = [];

  if (organizationId && userId) {
    docsQuery += ` WHERE (dp.organization_id = $1 OR u.id = $2 OR dp.user_id IN (
      SELECT user_id FROM organization_members WHERE organization_id = $1
    ))`;
    params.push(organizationId, userId);
  } else if (organizationId) {
    docsQuery += ` WHERE (dp.organization_id = $1 OR dp.user_id IN (
      SELECT user_id FROM organization_members WHERE organization_id = $1
    ))`;
    params.push(organizationId);
  } else if (userId) {
    docsQuery += ` WHERE u.id = $1`;
    params.push(userId);
  } else {
    // If neither org nor user is available, limit strictly to the first organization
    const firstOrg = await query(`SELECT organization_id FROM doctor_profiles ORDER BY created_at ASC LIMIT 1`);
    if (firstOrg.rowCount > 0 && firstOrg.rows[0].organization_id) {
      docsQuery += ` WHERE dp.organization_id = $1`;
      params.push(firstOrg.rows[0].organization_id);
    }
  }

  docsQuery += ` ORDER BY u.full_name ASC`;

  const docsRes = await query(docsQuery, params);

  const doctorsList = [];

  for (const doc of docsRes.rows) {
    const daysStats = {};

    for (const wd of weekDayDates) {
      const slotData = await getDoctorSlotsForDate(doc.doctor_profile_id, wd.date, organizationId);
      daysStats[wd.day_of_week] = {
        day_of_week: wd.day_of_week,
        day_name: wd.name,
        date: wd.date,
        is_active: slotData.shifts.some(s => s.is_active),
        is_holiday: slotData.is_holiday,
        holiday_title: slotData.holiday_title,
        is_leave: slotData.is_leave,
        total_slots: slotData.summary.total_slots,
        available_slots: slotData.summary.available_slots,
        booked_slots: slotData.summary.booked_slots,
        blocked_slots: slotData.summary.blocked_slots,
      };
    }

    doctorsList.push({
      doctor_profile_id: doc.doctor_profile_id,
      user_id: doc.user_id,
      name: doc.doctor_name,
      email: doc.doctor_email,
      specialty: doc.specialty || 'General Physician',
      qualification: doc.qualification || 'MBBS',
      avatar_url: doc.avatar_url,
      consultation_fee: doc.consultation_fee,
      days: daysStats,
    });
  }

  return {
    week_start: weekDayDates[0].date,
    week_end: weekDayDates[6].date,
    week_days: weekDayDates,
    doctors: doctorsList,
  };
}
