import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Plus,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  Share2,
  Bell,
  Stethoscope,
  Phone,
  Mail,
  Video,
  MapPin,
  CalendarOff,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Users,
} from 'lucide-react';
import CreateBookingModal from '../components/common/CreateBookingModal';

// Helper to format date as YYYY-MM-DD
function getISODateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    return val.split('T')[0];
  }
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

// Helper to format time (e.g. "10:30:00" -> "10:30 AM")
function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }
  return timeStr;
}

export default function CalendarPage() {
  // Calendar date state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => getISODateStr(new Date()));
  const [viewMode, setViewMode] = useState('Month'); // 'Day' | 'Week' | 'Month'

  // Backend data
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInitialDate, setBookingInitialDate] = useState('');
  const [bookingInitialTime, setBookingInitialTime] = useState('');
  const [activeAppointmentModal, setActiveAppointmentModal] = useState(null);

  // Fetch appointments, doctor schedules, and leaves
  const fetchCalendarData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('healthdock_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [aptRes, schedRes, leaveRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/doctor/appointments`, { headers }),
        fetch(`${API_BASE_URL}/api/doctor/schedules`, { headers }),
        fetch(`${API_BASE_URL}/api/holidays/leaves`, { headers }),
      ]);

      if (aptRes.status === 'fulfilled' && aptRes.value.ok) {
        const aptData = await aptRes.value.json();
        setAppointments(aptData.appointments || []);
      }

      if (schedRes.status === 'fulfilled' && schedRes.value.ok) {
        const schedData = await schedRes.value.json();
        setSchedules(schedData.schedules || []);
      }

      if (leaveRes.status === 'fulfilled' && leaveRes.value.ok) {
        const leaveData = await leaveRes.value.json();
        setLeaves(leaveData.leaves || []);
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // Map appointments by date string "YYYY-MM-DD"
  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((apt) => {
      const d = getISODateStr(apt.appointment_date);
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(apt);
      }
    });
    // Sort by start_time
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    });
    return map;
  }, [appointments]);

  // Map leaves by date string
  const leavesByDate = useMemo(() => {
    const map = {};
    leaves.forEach((l) => {
      const start = getISODateStr(l.start_date);
      const end = getISODateStr(l.end_date) || start;
      if (start) {
        // Mark all dates in range
        const s = new Date(start);
        const e = new Date(end);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          const str = getISODateStr(d);
          if (!map[str]) map[str] = [];
          map[str].push(l);
        }
      }
    });
    return map;
  }, [leaves]);

  // Map schedules by day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const schedulesByDay = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const day = s.day_of_week;
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    return map;
  }, [schedules]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'Month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'Day') {
      next.setDate(next.getDate() - 1);
      setSelectedDateStr(getISODateStr(next));
    } else if (viewMode === 'Week') {
      next.setDate(next.getDate() - 7);
      setSelectedDateStr(getISODateStr(next));
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'Month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'Day') {
      next.setDate(next.getDate() + 1);
      setSelectedDateStr(getISODateStr(next));
    } else if (viewMode === 'Week') {
      next.setDate(next.getDate() + 7);
      setSelectedDateStr(getISODateStr(next));
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(getISODateStr(now));
  };

  // Header Title
  const getHeaderTitle = () => {
    if (viewMode === 'Month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'Day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    // Week
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Helper for status styling
  const getStatusColor = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') {
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
    if (s === 'COMPLETED') {
      return 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30';
    }
    if (s === 'CANCELLED') {
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    }
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  };

  // Month Grid Calculation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(year, month - 1, d);
      grid.push({
        date: dateObj,
        dateStr: getISODateStr(dateObj),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      grid.push({
        date: dateObj,
        dateStr: getISODateStr(dateObj),
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Trailing days from next month to round out to multiples of 7
    const remaining = (7 - (grid.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const dateObj = new Date(year, month + 1, n);
      grid.push({
        date: dateObj,
        dateStr: getISODateStr(dateObj),
        dayNumber: n,
        isCurrentMonth: false,
      });
    }

    return grid;
  }, [currentDate]);

  // Week Days Calculation
  const weekDays = useMemo(() => {
    const cur = new Date(currentDate);
    const dayOfWeek = cur.getDay();
    const start = new Date(cur);
    start.setDate(cur.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        date: d,
        dateStr: getISODateStr(d),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: getISODateStr(d) === getISODateStr(new Date()),
      });
    }
    return days;
  }, [currentDate]);

  // Selected Day appointments
  const selectedDayAppointments = useMemo(() => {
    return appointmentsByDate[selectedDateStr] || [];
  }, [appointmentsByDate, selectedDateStr]);

  // Selected Day schedules / shifts
  const selectedDaySchedules = useMemo(() => {
    const d = new Date(`${selectedDateStr}T00:00:00`);
    const dayOfWeek = isNaN(d.getDay()) ? 0 : d.getDay();
    return schedulesByDay[dayOfWeek] || [];
  }, [selectedDateStr, schedulesByDay]);

  // Selected Day leave
  const selectedDayLeaves = useMemo(() => {
    return leavesByDate[selectedDateStr] || [];
  }, [leavesByDate, selectedDateStr]);

  // Hourly slots for Day view: 8:00 AM to 8:00 PM (8 to 20)
  const dayTimelineHours = useMemo(() => {
    const hours = [];
    for (let h = 8; h <= 20; h++) {
      const label = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
      const hourStr = String(h).padStart(2, '0');

      // Filter appointments that start within this hour
      const slotApts = selectedDayAppointments.filter((apt) => {
        if (!apt.start_time) return false;
        const aptHour = apt.start_time.split(':')[0];
        return aptHour === hourStr;
      });

      hours.push({
        hour: h,
        hourStr,
        label,
        appointments: slotApts,
      });
    }
    return hours;
  }, [selectedDayAppointments]);

  // Open booking modal for specific date/time
  const handleOpenBooking = (dateStr = '', timeStr = '') => {
    setBookingInitialDate(dateStr || selectedDateStr || getISODateStr(new Date()));
    setBookingInitialTime(timeStr || '10:00');
    setIsBookingModalOpen(true);
  };

  const handleDayCellClick = (cellDateStr, cellDate) => {
    setSelectedDateStr(cellDateStr);
    setCurrentDate(cellDate);
    // Smooth transition to Day view
    setViewMode('Day');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white">
              Clinical Calendar
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Live OPD Calendar
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual multi-doctor appointment calendar, token allocation, and working shift timings.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenBooking()}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
          <Link
            to="/bookings"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-teal-500" />
            <span>Bookings Table</span>
          </Link>
          <Link
            to="/availability"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Duty Shifts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        {/* Navigation & View Toggle Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          {/* Date Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-3 text-slate-800 dark:text-slate-100 min-w-[140px] text-center">
                {getHeaderTitle()}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline px-2.5 py-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
            >
              Today
            </button>

            <button
              type="button"
              onClick={fetchCalendarData}
              disabled={isLoading}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Refresh calendar data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-500' : ''}`} />
            </button>
          </div>

          {/* View Mode Switcher (Day, Week, Month) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              {['Day', 'Week', 'Month'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setViewMode(mode);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            VIEW MODE 1: MONTH VIEW
           ========================================================================= */}
        {viewMode === 'Month' && (
          <div className="space-y-3">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((cell) => {
                const isToday = cell.dateStr === getISODateStr(new Date());
                const isSelected = cell.dateStr === selectedDateStr;
                const cellAppointments = appointmentsByDate[cell.dateStr] || [];
                const cellLeaves = leavesByDate[cell.dateStr] || [];
                const cellDayOfWeek = cell.date.getDay();
                const cellSchedules = schedulesByDay[cellDayOfWeek] || [];

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => handleDayCellClick(cell.dateStr, cell.date)}
                    className={`min-h-[105px] md:min-h-[120px] p-2 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer group ${
                      !cell.isCurrentMonth
                        ? 'opacity-40 bg-slate-50/30 dark:bg-slate-900/10 border-slate-200/40 dark:border-slate-800/40'
                        : isSelected
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/15 ring-2 ring-teal-500/30 shadow-sm'
                        : isToday
                        ? 'border-teal-400/80 bg-teal-50/30 dark:bg-teal-500/10'
                        : 'border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 hover:border-teal-300 dark:hover:border-teal-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isToday
                            ? 'bg-teal-500 text-white shadow-sm'
                            : isSelected
                            ? 'bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-200'
                            : 'text-slate-700 dark:text-slate-300 group-hover:text-teal-600'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      <div className="flex items-center gap-1">
                        {/* Prominent Booking Count Badge */}
                        {cellAppointments.length > 0 && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1 shadow-xs"
                            title={`${cellAppointments.length} bookings on ${cell.dateStr}`}
                          >
                            <Users className="w-2.5 h-2.5" />
                            <span>{cellAppointments.length}</span>
                            <span className="hidden xl:inline text-[9px] font-medium opacity-80">
                              {cellAppointments.length === 1 ? 'visit' : 'visits'}
                            </span>
                          </span>
                        )}

                        {isToday && (
                          <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-500/10 px-1.5 py-0.5 rounded">
                            Today
                          </span>
                        )}
                        {cellLeaves.length > 0 && (
                          <span
                            className="text-[9px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1 rounded truncate max-w-[50px]"
                            title={`Doctor on Leave: ${cellLeaves[0].leave_type || 'Leave'}`}
                          >
                            Leave
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Shift indicator if configured */}
                    {cell.isCurrentMonth && cellSchedules.length > 0 && cellAppointments.length === 0 && (
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-1">
                        {cellSchedules.map((s) => s.shift_type).join(' & ')}
                      </div>
                    )}

                    {/* Bottom: Appointment Tokens or High-Capacity Summary */}
                    <div className="space-y-1 mt-1.5">
                      {/* When small count (1 or 2): show individual visit pills */}
                      {cellAppointments.length <= 2 &&
                        cellAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAppointmentModal(apt);
                            }}
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-medium truncate flex items-center justify-between hover:scale-[1.02] transition-transform ${getStatusColor(
                              apt.status
                            )}`}
                            title={`Token #${apt.daily_token || '01'} - ${apt.patient_name || 'Patient'} (${formatTimeDisplay(
                              apt.start_time
                            )})`}
                          >
                            <span className="truncate">
                              <span className="font-bold">#{apt.daily_token || '1'}</span>{' '}
                              {apt.patient_name || 'Patient'}
                            </span>
                            <span className="text-[9px] font-mono opacity-80 ml-1 flex-shrink-0">
                              {formatTimeDisplay(apt.start_time)}
                            </span>
                          </div>
                        ))}

                      {/* When booking count goes big (3 or more): show first visit + high-capacity count card */}
                      {cellAppointments.length >= 3 && (
                        <>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAppointmentModal(cellAppointments[0]);
                            }}
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-medium truncate flex items-center justify-between hover:scale-[1.02] transition-transform ${getStatusColor(
                              cellAppointments[0].status
                            )}`}
                            title={`First visit: Token #${cellAppointments[0].daily_token || '01'} - ${cellAppointments[0].patient_name}`}
                          >
                            <span className="truncate">
                              <span className="font-bold">#{cellAppointments[0].daily_token || '1'}</span>{' '}
                              {cellAppointments[0].patient_name}
                            </span>
                            <span className="text-[9px] font-mono opacity-80 ml-1 flex-shrink-0">
                              {formatTimeDisplay(cellAppointments[0].start_time)}
                            </span>
                          </div>

                          <div className="p-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/25 group-hover:bg-teal-500/20 transition-colors">
                            <div className="flex items-center justify-between text-[10px] font-bold text-teal-800 dark:text-teal-200">
                              <span className="flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" />
                                {cellAppointments.length} Bookings
                              </span>
                              <span className="text-[9px] font-mono text-teal-600 dark:text-teal-400">
                                Tokens #1–#{cellAppointments[cellAppointments.length - 1]?.daily_token || cellAppointments.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                                {cellAppointments.filter((a) => (a.status || '').toUpperCase() === 'CONFIRMED').length} Confirmed
                              </span>
                              <span className="text-teal-600 dark:text-teal-400 font-semibold group-hover:underline flex-shrink-0 ml-1">
                                View Day →
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW MODE 2: DAY VIEW (HOURLY TIMELINE & LIVE BOOKING CARDS)
           ========================================================================= */}
        {viewMode === 'Day' && (
          <div className="space-y-6">
            {/* Day Header Banner & Quick Shift Info */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-teal-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>
                  {selectedDateStr === getISODateStr(new Date()) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500 text-white">
                      Today
                    </span>
                  )}
                </div>

                {/* Duty Shift Summary */}
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Duty Shifts:</span>
                  {selectedDaySchedules.length > 0 ? (
                    selectedDaySchedules.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 font-medium"
                      >
                        {s.shift_type}{' '}
                        {s.time_blocks && s.time_blocks.length > 0
                          ? `(${s.time_blocks.map((tb) => `${formatTimeDisplay(tb.start_time)} - ${formatTimeDisplay(tb.end_time)}`).join(', ')})`
                          : ''}
                      </span>
                    ))
                  ) : (
                    <span className="italic text-slate-400">Regular clinical hours</span>
                  )}
                </div>
              </div>

              {/* Day Stats & Action */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {selectedDayAppointments.length}
                    </span>{' '}
                    Bookings
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedDayAppointments.filter((a) => (a.status || '').toUpperCase() === 'CONFIRMED').length}
                    </span>{' '}
                    Confirmed
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenBooking(selectedDateStr, '10:00')}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Slot</span>
                </button>
              </div>
            </div>

            {/* Leave Alert if any */}
            {selectedDayLeaves.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <div>
                  <span className="font-bold">Doctor Leave Notice: </span>
                  {selectedDayLeaves.map((l) => `${l.leave_type || 'Leave'}${l.reason ? ` (${l.reason})` : ''}`).join(', ')}
                </div>
              </div>
            )}

            {/* Hourly Agenda Timeline */}
            <div className="space-y-3">
              {dayTimelineHours.map(({ hour, hourStr, label, appointments: hourApts }) => (
                <div
                  key={hour}
                  className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  {/* Time Column */}
                  <div className="w-20 sm:w-24 flex-shrink-0 pt-1 text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {label}
                    </span>
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-px self-stretch bg-slate-200 dark:bg-slate-800 relative">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 absolute -left-[3.5px] top-2" />
                  </div>

                  {/* Appointments or Empty Slot */}
                  <div className="flex-1 space-y-2">
                    {hourApts.length > 0 ? (
                      hourApts.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => setActiveAppointmentModal(apt)}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500/50 shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            {/* Token Badge */}
                            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex flex-col items-center justify-center flex-shrink-0 border border-teal-500/30">
                              <span className="text-[9px] uppercase font-bold tracking-wider">Token</span>
                              <span className="text-xs font-black">#{apt.daily_token || '01'}</span>
                            </div>

                            {/* Patient Info */}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {apt.patient_name || 'Patient'}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(
                                    apt.status
                                  )}`}
                                >
                                  {apt.status || 'CONFIRMED'}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  {apt.consultation_mode === 'VIDEO' ? (
                                    <>
                                      <Video className="w-3 h-3 text-blue-500" />
                                      <span>Video Consultation</span>
                                    </>
                                  ) : (
                                    <>
                                      <Stethoscope className="w-3 h-3 text-teal-500" />
                                      <span>In-Person Visit</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                                {apt.patient_phone && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {apt.patient_phone}
                                  </span>
                                )}
                                {apt.service_name && (
                                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                                    {apt.service_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Time & Action */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-1 rounded-lg">
                              {formatTimeDisplay(apt.start_time)}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                              View →
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between py-1 text-slate-400 dark:text-slate-500 text-xs">
                        <span className="italic">No appointments</span>
                        <button
                          type="button"
                          onClick={() => handleOpenBooking(selectedDateStr, `${hourStr}:00`)}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty Day Fallback State */}
            {selectedDayAppointments.length === 0 && (
              <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Appointments Booked for this Date
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no confirmed patient visits registered for {selectedDateStr}. Click below to add an appointment or switch back to month view.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(selectedDateStr, '10:00')}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book Appointment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('Month')}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Back to Month View
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW MODE 3: WEEK VIEW
           ========================================================================= */}
        {viewMode === 'Week' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDays.map((day) => {
                const dayApts = appointmentsByDate[day.dateStr] || [];
                const dayLeaves = leavesByDate[day.dateStr] || [];
                const isSelected = day.dateStr === selectedDateStr;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => handleDayCellClick(day.dateStr, day.date)}
                    className={`p-3 rounded-xl border min-h-[160px] flex flex-col justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/15 ring-2 ring-teal-500/30'
                        : day.isToday
                        ? 'border-teal-400 bg-teal-50/30 dark:bg-teal-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-teal-300 dark:hover:border-teal-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                        <div>
                          <div className="text-[11px] font-semibold text-slate-400 uppercase">
                            {day.dayName}
                          </div>
                          <div className="text-base font-bold text-slate-900 dark:text-white">
                            {day.dayNumber}
                          </div>
                        </div>
                        {day.isToday && (
                          <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Leaves */}
                      {dayLeaves.length > 0 && (
                        <div className="mt-2 text-[9px] font-bold text-rose-600 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded">
                          Doctor on Leave
                        </div>
                      )}

                      {/* Appointments */}
                      <div className="space-y-1.5 mt-2.5">
                        {dayApts.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAppointmentModal(apt);
                            }}
                            className={`p-1.5 rounded-lg border text-[10px] font-medium truncate ${getStatusColor(
                              apt.status
                            )}`}
                          >
                            <div className="font-bold truncate">#{apt.daily_token || '1'} {apt.patient_name}</div>
                            <div className="text-[9px] font-mono opacity-80">{formatTimeDisplay(apt.start_time)}</div>
                          </div>
                        ))}
                        {dayApts.length === 0 && (
                          <div className="text-[10px] text-slate-400 italic pt-2">No visits</div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayCellClick(day.dateStr, day.date);
                      }}
                      className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 pt-2 text-right hover:underline"
                    >
                      View Day →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Highlights & Upcoming Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Live Token Allocation
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Every booking automatically receives a sequential daily queue token for seamless OPD reception triage.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Shift Schedule Synchronization
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Doctor availability duty shifts and approved leaves are automatically respected across all calendar views.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Realtime OPD Queue Status
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Instantly view which patient is currently in consultation and who is waiting in the clinic lounge.
          </p>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {activeAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex flex-col items-center justify-center border border-teal-500/30">
                  <span className="text-[9px] font-bold uppercase tracking-wider">Token</span>
                  <span className="text-sm font-black">#{activeAppointmentModal.daily_token || '01'}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeAppointmentModal.patient_name || 'Patient Details'}
                  </h3>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${getStatusColor(
                      activeAppointmentModal.status
                    )}`}
                  >
                    {activeAppointmentModal.status || 'CONFIRMED'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAppointmentModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {getISODateStr(activeAppointmentModal.appointment_date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Time:</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {formatTimeDisplay(activeAppointmentModal.start_time)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Consultation Type:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeAppointmentModal.consultation_mode === 'VIDEO' ? 'Video Call' : 'In-Person Consultation'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Service:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeAppointmentModal.service_name || 'General OPD'}
                </span>
              </div>
              {activeAppointmentModal.patient_phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                  <a
                    href={`tel:${activeAppointmentModal.patient_phone}`}
                    className="font-semibold text-teal-600 dark:text-teal-400 hover:underline font-mono"
                  >
                    {activeAppointmentModal.patient_phone}
                  </a>
                </div>
              )}
              {activeAppointmentModal.patient_email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Email:</span>
                  <a
                    href={`mailto:${activeAppointmentModal.patient_email}`}
                    className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    {activeAppointmentModal.patient_email}
                  </a>
                </div>
              )}
              {activeAppointmentModal.patient_notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Notes:</span>
                  <p className="text-slate-700 dark:text-slate-300 italic">
                    "{activeAppointmentModal.patient_notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                to="/bookings"
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                View in Bookings
              </Link>
              <button
                type="button"
                onClick={() => setActiveAppointmentModal(null)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialDate={bookingInitialDate}
        initialTime={bookingInitialTime}
        onBookingCreated={() => {
          fetchCalendarData();
        }}
      />
    </div>
  );
}
