import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Sun,
  Sunset,
  Users,
  UserCheck,
  Calendar,
  Check,
  AlertCircle,
  Sparkles,
  Save,
  Moon,
  Cross,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Calendar as CalendarIcon,
  FileText,
  GitBranch,
  Settings,
  CalendarOff,
} from 'lucide-react';
import CustomDropdown from '../components/common/CustomDropdown';

const WEEKDAYS = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

export default function AddSchedulePage() {
  const navigate = useNavigate();

  // Top Configuration Dropdowns
  const [shiftType, setShiftType] = useState('MORNING'); // 'MORNING' | 'EVENING'
  const [slotDuration, setSlotDuration] = useState('30'); // 10, 15, 30, 45, 60
  const [patientCount, setPatientCount] = useState('1'); // 1, 2, 3, 4, 5
  const [accompanyingPeople, setAccompanyingPeople] = useState('1'); // 0, 1, 2, 3

  // Days configuration state (Sunday to Saturday)
  const [daysSchedule, setDaysSchedule] = useState(() => {
    return WEEKDAYS.map(day => ({
      day_of_week: day.id,
      name: day.name,
      short: day.short,
      is_available: day.id !== 0, // Mon-Sat active by default, Sunday off
      start_time: '09:00',
      end_time: '13:00',
    }));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sagar Sharma',
    email: 'dr.sagar@healthdock.in',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('healthdock_user') || localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserProfile(prev => ({
          ...prev,
          name: u.full_name || prev.name,
          email: u.email || prev.email,
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // When shiftType changes, adjust default start and end times:
  // Morning: 09:00 to 13:00 (9 AM to 1 PM)
  // Evening: 14:00 to 18:00 (2 PM to 6 PM)
  useEffect(() => {
    const defaultStart = shiftType === 'EVENING' ? '14:00' : '09:00';
    const defaultEnd = shiftType === 'EVENING' ? '18:00' : '13:00';

    setDaysSchedule(prev =>
      prev.map(day => ({
        ...day,
        start_time: defaultStart,
        end_time: defaultEnd,
      }))
    );
  }, [shiftType]);

  // Toggle day availability
  const handleToggleDay = (dayIndex) => {
    setDaysSchedule(prev =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          return { ...day, is_available: !day.is_available };
        }
        return day;
      })
    );
  };

  // Change individual day time
  const handleTimeChange = (dayIndex, field, value) => {
    setDaysSchedule(prev =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          return { ...day, [field]: value };
        }
        return day;
      })
    );
  };

  // Options for Dropdowns
  const shiftOptions = [
    { label: 'Morning Shift (09:00 AM - 01:00 PM)', value: 'MORNING', icon: Sun },
    { label: 'Evening Shift (02:00 PM - 06:00 PM)', value: 'EVENING', icon: Sunset },
  ];

  const slotDurationOptions = [
    { label: '10 mins', value: '10' },
    { label: '15 mins', value: '15' },
    { label: '30 mins (Standard)', value: '30' },
    { label: '45 mins', value: '45' },
    { label: '1 hour (60 mins)', value: '60' },
  ];

  const patientCountOptions = [
    { label: '1 Patient per slot', value: '1' },
    { label: '2 Patients per slot', value: '2' },
    { label: '3 Patients per slot', value: '3' },
    { label: '4 Patients per slot', value: '4' },
    { label: '5 Patients per slot', value: '5' },
  ];

  const accompanyingOptions = [
    { label: '0 People (Patient Only)', value: '0' },
    { label: '1 Attendant / Relative', value: '1' },
    { label: '2 People allowed', value: '2' },
    { label: '3 People allowed', value: '3' },
    { label: 'No Limit', value: '5' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Check if at least one day is available
    const hasAvailableDay = daysSchedule.some(d => d.is_available);
    if (!hasAvailableDay) {
      setError('Please enable availability for at least one day of the week.');
      return;
    }

    // Validate times for active days
    for (const d of daysSchedule) {
      if (d.is_available && d.start_time >= d.end_time) {
        setError(`Shift end time must be after start time on ${d.name}`);
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');

      const payload = {
        shift_type: shiftType,
        slot_duration_minutes: parseInt(slotDuration, 10),
        max_patients_per_slot: parseInt(patientCount, 10),
        max_accompanying_persons: parseInt(accompanyingPeople, 10),
        days: daysSchedule.map(d => ({
          day_of_week: d.day_of_week,
          is_active: d.is_available,
          start_time: `${d.start_time}:00`,
          end_time: `${d.end_time}:00`,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/api/doctor/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save clinical schedule');
      }

      setSuccessMsg('Clinical shift schedule saved successfully!');
      setTimeout(() => {
        navigate('/availability');
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, link: '/dashboard' },
    { id: 'Bookings', icon: BookOpen, link: '/bookings' },
    { id: 'Availability', icon: Clock, link: '/availability', active: true },
    { id: 'Holidays', icon: CalendarOff, link: '/holidays' },
    { id: 'Calendar', icon: CalendarIcon, link: '/dashboard' },
    { id: 'Contacts', icon: Users, link: '/dashboard' },
    { id: 'Pages', icon: FileText, link: '/pages' },
    { id: 'Users', icon: Users, link: '/users' },
    { id: 'Workflows', icon: GitBranch, link: '/dashboard' },
    { id: 'Settings', icon: Settings, link: '/dashboard' },
  ];

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* Top Header with Back Navigation */}
        <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-[#071224]/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/availability')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Back to Availability"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
                  Add Schedule
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light pl-8">
                Configure your shift hours, slot durations, and weekly patient booking capacity.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => navigate('/availability')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-serif font-medium shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving Schedule...' : 'Save Schedule'}</span>
              </button>
            </div>

          </div>
        </header>

        {/* Form Body */}
        <div className="p-6 lg:px-8 max-w-5xl space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:rose-900/50 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:emerald-900/50 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Dropdown Configurations */}
          <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-serif font-bold text-base text-[#0B192C] dark:text-white">
                Shift & Slot Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the clinical shift, consultation interval, and patient attendance rules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              
              {/* 1. Shift Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Duty Shift
                </label>
                <CustomDropdown
                  value={shiftType}
                  onChange={setShiftType}
                  options={shiftOptions}
                  className="w-full"
                />
                <span className="text-[10px] text-slate-400 block">
                  {shiftType === 'MORNING' ? 'Times default to 9:00 AM - 1:00 PM' : 'Times default to 2:00 PM - 6:00 PM'}
                </span>
              </div>

              {/* 2. Slot Interval / Duration Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Slot Duration
                </label>
                <CustomDropdown
                  value={slotDuration}
                  onChange={setSlotDuration}
                  options={slotDurationOptions}
                  className="w-full"
                />
                <span className="text-[10px] text-slate-400 block">
                  Length of each consultation window
                </span>
              </div>

              {/* 3. Patient Count on that Slot Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Patients Per Slot
                </label>
                <CustomDropdown
                  value={patientCount}
                  onChange={setPatientCount}
                  options={patientCountOptions}
                  className="w-full"
                />
                <span className="text-[10px] text-slate-400 block">
                  Max tokens issued per interval
                </span>
              </div>

              {/* 4. Accompanying People Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Accompanying People
                </label>
                <CustomDropdown
                  value={accompanyingPeople}
                  onChange={setAccompanyingPeople}
                  options={accompanyingOptions}
                  className="w-full"
                />
                <span className="text-[10px] text-slate-400 block">
                  Guests allowed to accompany patient
                </span>
              </div>

            </div>
          </div>

          {/* Section 2: Days of the Week (Sunday to Saturday) with Start/End Times and Available/Unavailable Switch */}
          <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="font-serif font-bold text-base text-[#0B192C] dark:text-white">
                  Weekly Schedule & Working Hours
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle availability switch for each day from Sunday to Saturday and set consultation hours.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold border border-teal-500/20">
                  {shiftType === 'MORNING' ? 'Morning Shift (9 AM – 1 PM)' : 'Evening Shift (2 PM – 6 PM)'}
                </span>
              </div>
            </div>

            {/* List of 7 Days */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {daysSchedule.map((day, idx) => {
                return (
                  <div
                    key={day.day_of_week}
                    className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      day.is_available ? '' : 'opacity-60 bg-slate-50/40 dark:bg-slate-900/20 rounded-xl px-2'
                    }`}
                  >
                    
                    {/* Day Name and Switch Toggle */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                      
                      {/* Availability Switch Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleDay(idx)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          day.is_available ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={day.is_available ? 'Click to make unavailable' : 'Click to make available'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            day.is_available ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Day Label & Status Badge */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white font-serif">
                            {day.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              day.is_available
                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-500/20'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {day.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {day.is_available ? 'Active duty hours' : 'Day slot is unavailable'}
                        </span>
                      </div>

                    </div>

                    {/* Start Time & End Time Inputs */}
                    <div className="flex items-center gap-3">
                      
                      {day.is_available ? (
                        <div className="flex items-center gap-2 text-xs">
                          
                          {/* Start Time */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-medium">Start:</span>
                            <input
                              type="time"
                              value={day.start_time}
                              onChange={(e) => handleTimeChange(idx, 'start_time', e.target.value)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                            />
                          </div>

                          <span className="text-slate-400">to</span>

                          {/* End Time */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-medium">End:</span>
                            <input
                              type="time"
                              value={day.end_time}
                              onChange={(e) => handleTimeChange(idx, 'end_time', e.target.value)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                            />
                          </div>

                        </div>
                      ) : (
                        <div className="py-1 px-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-400 text-xs italic font-medium">
                          No consultations scheduled on this day
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate('/availability')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-serif font-medium shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Schedule...' : 'Save Weekly Schedule'}</span>
            </button>
          </div>

        </div>

      </main>
  );
}
