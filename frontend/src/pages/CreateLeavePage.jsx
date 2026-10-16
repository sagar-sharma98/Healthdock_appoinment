import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Clock,
  Calendar as CalendarIcon,
  Users,
  FileText,
  GitBranch,
  Settings,
  Moon,
  Sun,
  Cross,
  Sparkles,
  CalendarOff,
  User,
  Stethoscope,
  Check,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Clock3,
  ChevronDown,
} from 'lucide-react';
import CustomDropdown from '../components/common/CustomDropdown';

export default function CreateLeavePage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Form Fields - All initialized completely EMPTY on render
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [session, setSession] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // UI States
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sidebar profile
  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sagar Sharma',
    email: 'dr.sagar@healthdock.in',
  });

  // Dark mode synchronization matching HolidaysPage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('healthdock_user') || localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUserProfile((prev) => ({
          ...prev,
          name: u.full_name || prev.name,
          email: u.email || prev.email,
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch doctors belonging ONLY to logged in user / clinic
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setFetchingDoctors(true);
        const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/holidays/leaves', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          const docs = data.doctors || [];
          setDoctorsList(docs);
          // Do NOT prefill selectedDoctorId - leave all fields empty on initial render
        } else {
          setErrorMsg('Failed to load clinic doctors.');
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setErrorMsg('Error connecting to leave service.');
      } finally {
        setFetchingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // Sidebar navigation items
  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, link: '/dashboard' },
    { id: 'Bookings', icon: BookOpen, link: '/bookings' },
    { id: 'Availability', icon: Clock, link: '/availability' },
    { id: 'Holidays', icon: CalendarOff, link: '/holidays', active: true },
    { id: 'Calendar', icon: CalendarIcon, link: '/dashboard' },
    { id: 'Contacts', icon: Users, link: '/dashboard' },
    { id: 'Pages', icon: FileText, link: '/pages' },
    { id: 'Users', icon: Users, link: '/users' },
    { id: 'Workflows', icon: GitBranch, link: '/dashboard' },
    { id: 'Settings', icon: Settings, link: '/dashboard' },
  ];

  // 1. Doctor Dropdown Options (Scoped strictly to logged-in user profile & team)
  const doctorDropdownOptions = doctorsList.map((doc) => {
    const emailPrefix = doc.email ? doc.email.split('@')[0] : '';
    return {
      label: `${doc.full_name} (${doc.specialty || 'General'})${emailPrefix ? ` • @${emailPrefix}` : ''}`,
      value: doc.doctor_profile_id,
      icon: Stethoscope,
    };
  });

  // 2. Leave Type Dropdown Options
  const leaveTypeOptions = [
    { label: 'Casual Leave (CL)', value: 'CASUAL', colorDot: 'bg-teal-500' },
    { label: 'Medical / Sick Leave (SL)', value: 'SICK', colorDot: 'bg-rose-500' },
    { label: 'Vacation / Annual Leave', value: 'VACATION', colorDot: 'bg-indigo-500' },
    { label: 'Conference / CME Training', value: 'CONFERENCE', colorDot: 'bg-amber-500' },
    { label: 'Emergency Leave', value: 'EMERGENCY', colorDot: 'bg-red-500' },
  ];

  // 3. Session / Duration Dropdown Options
  const sessionOptions = [
    { label: 'Full Day (All time slots blocked)', value: 'FULL_DAY', icon: CalendarDays },
    { label: 'Morning Shift (First Half)', value: 'MORNING', icon: Clock3 },
    { label: 'Evening Shift (Second Half)', value: 'EVENING', icon: Clock3 },
  ];

  // 4. Status Dropdown Options
  const statusOptions = [
    { label: 'Approved', value: 'APPROVED', colorDot: 'bg-emerald-500' },
    { label: 'Pending Approval', value: 'PENDING', colorDot: 'bg-amber-500' },
  ];

  // Form Submit Handler
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedDoctorId) {
      setErrorMsg('Please select a consulting doctor.');
      return;
    }
    if (!leaveType) {
      setErrorMsg('Please select a leave classification.');
      return;
    }
    if (!startDate) {
      setErrorMsg('Please select the start date for the leave.');
      return;
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');

      const payload = {
        doctor_profile_id: selectedDoctorId,
        start_date: startDate,
        end_date: endDate || startDate,
        leave_type: leaveType,
        session: session || 'FULL_DAY',
        status: status || 'APPROVED',
        reason: reason.trim(),
      };

      const res = await fetch('http://localhost:5000/api/holidays/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record doctor leave.');
      }

      setSuccessMsg('Doctor leave scheduled successfully. Updating calendar...');
      setTimeout(() => {
        navigate('/holidays');
      }, 700);
    } catch (err) {
      console.error('Error saving doctor leave:', err);
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto">
      {/* Top Header - Matches HolidaysPage spacing & styling */}
      <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-[#071224]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0B192C] dark:text-white tracking-tight">
            Create Doctor Leave
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            Record planned absences, vacation or conference leaves to automatically block patient booking slots.
          </p>
        </div>
      </header>

        {/* Content Body: Clean Form without section banners */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 lg:p-12 space-y-8">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {fetchingDoctors ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading doctors for your practice...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Doctor & Leave Classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Doctor Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Consulting Doctor <span className="text-rose-500">*</span>
                  </label>
                  <CustomDropdown
                    value={selectedDoctorId}
                    onChange={setSelectedDoctorId}
                    options={doctorDropdownOptions}
                    placeholder="Select consulting doctor"
                    className="w-full text-xs"
                  />
                </div>

                {/* Leave Type Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Leave Classification <span className="text-rose-500">*</span>
                  </label>
                  <CustomDropdown
                    value={leaveType}
                    onChange={setLeaveType}
                    options={leaveTypeOptions}
                    placeholder="Select leave type"
                    className="w-full text-xs"
                  />
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (!endDate || e.target.value > endDate) {
                          setEndDate(e.target.value);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    End Date
                  </label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      min={startDate || undefined}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Shift Coverage & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session / Shift */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Shift / Slot Coverage
                  </label>
                  <CustomDropdown
                    value={session}
                    onChange={setSession}
                    options={sessionOptions}
                    placeholder="Select shift coverage"
                    className="w-full text-xs"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Approval Status
                  </label>
                  <CustomDropdown
                    value={status}
                    onChange={setStatus}
                    options={statusOptions}
                    placeholder="Select status"
                    className="w-full text-xs"
                  />
                </div>
              </div>

              {/* Leave Reason / Clinical Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Leave Reason / Clinical Notes
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Attending Annual Medical Conference / Personal leave..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/holidays')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || fetchingDoctors}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-teal-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Leave...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Add Leave</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
  );
}
