import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Cross,
  Sparkles,
  Stethoscope,
  CalendarOff,
  AlertCircle,
  CheckCircle2,
  Trash2,
  CalendarDays,
  UserCheck,
  User,
  Clock3,
} from 'lucide-react';

import CustomDropdown from '../components/common/CustomDropdown';

export default function HolidaysPage() {
  const navigate = useNavigate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [selectedLeaveType, setSelectedLeaveType] = useState('ALL');
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState('ALL');

  // Data states
  const [doctorLeaves, setDoctorLeaves] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    onLeaveToday: 0,
    upcoming: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sagar Sharma',
    email: 'dr.sagar@healthdock.in',
    organization: 'HealthDock Clinic',
  });

  // Load User profile
  useEffect(() => {
    const userStr = localStorage.getItem('healthdock_user') || localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserProfile((prev) => ({
          ...prev,
          name: u.full_name || prev.name,
          email: u.email || prev.email,
        }));
      } catch (e) {}
    }
  }, []);

  // Fetch Doctor Leaves (Scoped strictly to logged-in user profile & account)
  const loadDoctorLeaves = async () => {
    try {
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedDoctorId && selectedDoctorId !== 'ALL') params.append('doctor_id', selectedDoctorId);
      if (selectedLeaveType && selectedLeaveType !== 'ALL') params.append('leave_type', selectedLeaveType);
      if (selectedLeaveStatus && selectedLeaveStatus !== 'ALL') params.append('status', selectedLeaveStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`${API_BASE_URL}/api/holidays/leaves?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setDoctorLeaves(data.leaves || []);
        if (data.doctors) setDoctorsList(data.doctors);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load doctor leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load & when filters change
  useEffect(() => {
    setLoading(true);
    loadDoctorLeaves();
  }, [selectedDoctorId, selectedLeaveType, selectedLeaveStatus]);

  // Handle Search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDoctorLeaves();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDoctorId, selectedLeaveType, selectedLeaveStatus]);

  const totalPages = Math.max(1, Math.ceil(doctorLeaves.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaves = doctorLeaves.slice(startIndex, startIndex + itemsPerPage);

  // Navigation Items
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

  // Doctor Options for CustomDropdown (populated strictly with logged-in user profile & doctors)
  const doctorOptions = [
    { label: 'All Doctors', value: 'ALL' },
    ...(doctorsList || []).map((doc) => {
      const emailPrefix = doc.email ? doc.email.split('@')[0] : '';
      return {
        label: `${doc.full_name} (${doc.specialty || 'General'})${emailPrefix ? ` • @${emailPrefix}` : ''}`,
        value: doc.doctor_profile_id,
        icon: User,
      };
    }),
  ];

  // Leave Type Options for CustomDropdown
  const leaveTypeOptions = [
    { label: 'All Leave Types', value: 'ALL' },
    { label: 'Casual Leave (CL)', value: 'CASUAL' },
    { label: 'Medical / Sick Leave (SL)', value: 'SICK' },
    { label: 'Vacation / Annual Leave', value: 'VACATION' },
    { label: 'Conference / CME Training', value: 'CONFERENCE' },
    { label: 'Emergency Leave', value: 'EMERGENCY' },
  ];

  // Leave Status Options for CustomDropdown
  const leaveStatusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Approved', value: 'APPROVED', colorDot: 'bg-emerald-500' },
    { label: 'Pending Approval', value: 'PENDING', colorDot: 'bg-amber-500' },
  ];

  // Delete doctor leave
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/holidays/leaves/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete leave');
      }

      showToast('Doctor leave deleted and schedule blocks removed.');
      loadDoctorLeaves();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Format date helper
  const formatDateRange = (startDateStr, endDateStr) => {
    if (!startDateStr) return '-';
    try {
      const s = new Date(startDateStr);
      const e = endDateStr ? new Date(endDateStr) : s;
      const opts = { month: 'short', day: 'numeric', year: 'numeric' };

      const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
      const daysLabel = diffDays === 1 ? '1 day' : `${diffDays} days`;

      if (startDateStr === endDateStr || !endDateStr) {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {s.toLocaleDateString('en-US', opts)}
            </span>
            <span className="text-[11px] text-slate-400">1 day duration</span>
          </div>
        );
      }

      return (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {e.toLocaleDateString('en-US', opts)}
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
            {daysLabel} duration
          </span>
        </div>
      );
    } catch (e) {
      return startDateStr;
    }
  };

  // Leave Type Badge renderer
  const renderLeaveTypeBadge = (type) => {
    switch (type) {
      case 'SICK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Sick Leave
          </span>
        );
      case 'CONFERENCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Conference / CME
          </span>
        );
      case 'VACATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Vacation Leave
          </span>
        );
      case 'EMERGENCY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Emergency
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Casual Leave
          </span>
        );
    }
  };

  // Session / Shift badge
  const renderSessionBadge = (session) => {
    switch (session) {
      case 'MORNING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            <Clock3 className="w-3 h-3" />
            Morning Shift
          </span>
        );
      case 'EVENING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            <Clock3 className="w-3 h-3" />
            Evening Shift
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            <CalendarDays className="w-3 h-3 text-slate-400" />
            Full Day
          </span>
        );
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-teal-600'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#0E1624] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Delete Doctor Leave?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to remove leave for{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  "{deleteTarget.name}"
                </span>
                ? This will unblock slots on the booking calendar.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Header: Title & Subtitle on left, "Add Leave" button on top right */}
        <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-[#071224]/50 backdrop-blur-sm sticky top-0 z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Top Left: Heading and small para */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#0B192C] dark:text-white tracking-tight">
                Doctor Leaves
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                Manage doctor leave schedules, vacation dates, and emergency time-off across your clinic.
              </p>
            </div>

            {/* Top Right: Add Leave Button navigating to new page */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/holidays/new')}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] flex-shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Leave</span>
              </button>
            </div>
          </div>

          {/* Row below: Search input on the left, filter dropdowns on the right */}
          <div className="pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search input on the left */}
            <div className="flex-1 min-w-[220px] max-w-md relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns on the right */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Doctor Dropdown Filter (Scoped to logged in user profile only) */}
              <div className="w-48 sm:w-56">
                <CustomDropdown
                  value={selectedDoctorId}
                  onChange={setSelectedDoctorId}
                  options={doctorOptions}
                  className="w-full text-xs"
                />
              </div>

              {/* Leave Type Filter */}
              <div className="w-36 sm:w-44">
                <CustomDropdown
                  value={selectedLeaveType}
                  onChange={setSelectedLeaveType}
                  options={leaveTypeOptions}
                  className="w-full text-xs"
                />
              </div>

              {/* Status Filter */}
              <div className="w-32 sm:w-40">
                <CustomDropdown
                  value={selectedLeaveStatus}
                  onChange={setSelectedLeaveStatus}
                  options={leaveStatusOptions}
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 lg:px-8 space-y-6">
          {/* Leaves Table */}
          <div className="bg-white dark:bg-[#0E1624] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs min-h-[500px] flex flex-col justify-between">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading doctor leaves...</p>
              </div>
            ) : doctorLeaves.length === 0 ? (
              <div className="py-20 px-4 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <CalendarOff className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  No Doctor Leaves Recorded
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  {searchQuery || selectedDoctorId !== 'ALL' || selectedLeaveType !== 'ALL' || selectedLeaveStatus !== 'ALL'
                    ? 'No leave records match the active search filters.'
                    : 'Schedule planned absences, medical leaves, or vacation days for consulting doctors to keep patient bookings organized.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/holidays/new')}
                  className="mt-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add First Leave</span>
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0A101D] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-5">Consulting Doctor</th>
                        <th className="py-3.5 px-5">Classification</th>
                        <th className="py-3.5 px-5">Shift Coverage</th>
                        <th className="py-3.5 px-5">Date Range</th>
                        <th className="py-3.5 px-5">Reason / Handover</th>
                        <th className="py-3.5 px-5">Status</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {paginatedLeaves.map((leave) => {
                        const initial = leave.doctor_name ? leave.doctor_name.charAt(0).toUpperCase() : 'D';
                        return (
                          <tr
                            key={leave.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-[#121B2B]/40 transition-colors"
                          >
                            {/* Doctor */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    {leave.doctor_name || 'Dr. Sagar Sharma'}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {leave.specialty || 'General Medicine'} {leave.doctor_email ? `• ${leave.doctor_email}` : ''}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Classification */}
                            <td className="py-4 px-5 whitespace-nowrap">
                              {renderLeaveTypeBadge(leave.leave_type)}
                            </td>

                            {/* Shift Coverage */}
                            <td className="py-4 px-5 whitespace-nowrap">
                              {renderSessionBadge(leave.session)}
                            </td>

                            {/* Date Range */}
                            <td className="py-4 px-5 whitespace-nowrap">
                              {formatDateRange(leave.start_date, leave.end_date)}
                            </td>

                            {/* Reason */}
                            <td className="py-4 px-5 max-w-xs">
                              <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                                {leave.reason ? leave.reason : <span className="text-slate-400 italic">No notes provided</span>}
                              </p>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-5 whitespace-nowrap">
                              {leave.status === 'APPROVED' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Pending
                                </span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="py-4 px-5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    id: leave.id,
                                    name: `${leave.doctor_name || 'Doctor'} (${leave.start_date})`,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete leave"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Pagination */}
                <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{doctorLeaves.length === 0 ? 0 : startIndex + 1}</span> to{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(startIndex + itemsPerPage, doctorLeaves.length)}</span> of{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{doctorLeaves.length}</span> doctor {doctorLeaves.length === 1 ? 'leave' : 'leaves'}
                    </span>
                  </div>

                  {/* Pagination Controls on the right */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer flex items-center gap-1 text-xs px-2.5 font-medium"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30'
                                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer flex items-center gap-1 text-xs px-2.5 font-medium"
                      title="Next page"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
