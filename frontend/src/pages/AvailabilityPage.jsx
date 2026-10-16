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
  Moon,
  Sun,
  Cross,
  Sparkles,
  CalendarOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Stethoscope,
  Video,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  User,
  Check,
} from 'lucide-react';
import CustomCalendarPicker from '../components/common/CustomCalendarPicker';
import CustomDropdown from '../components/common/CustomDropdown';
import AvailabilityEmptyState from '../components/common/AvailabilityEmptyState';

function format12Hour(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${period}`;
}

export default function AvailabilityPage() {
  const navigate = useNavigate();
  
  // Switch tab: 'all' (All Doctors Table) or 'my' (My Schedule Slot Matrix)
  const [activeTab, setActiveTab] = useState('all');

  // Search & Date filters
  const [searchQuery, setSearchQuery] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // All Doctors Overview State
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // My Schedule State
  const [slotsData, setSlotsData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [togglingSlot, setTogglingSlot] = useState(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sagar Sharma',
    email: 'dr.sagar@healthdock.in',
    doctorProfileId: null,
  });

  // Load User Profile
  useEffect(() => {
    const userStr = localStorage.getItem('healthdock_user') || localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserProfile(prev => ({
          ...prev,
          name: u.full_name || prev.name,
          email: u.email || prev.email,
          doctorProfileId: u.doctorProfileId || prev.doctorProfileId,
        }));
        if (u.doctorProfileId) {
          setSelectedDoctorId(u.doctorProfileId);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 1. Fetch All Doctors Weekly Overview
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const userStr = localStorage.getItem('healthdock_user') || localStorage.getItem('user');
      let currentUser = null;
      try { currentUser = userStr ? JSON.parse(userStr) : null; } catch (e) {}

      const params = new URLSearchParams();
      if (selectedDate && selectedDate !== 'ALL') params.append('date', selectedDate);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (currentUser?.id) params.append('userId', currentUser.id);
      if (currentUser?.organization_id || currentUser?.organizationId) {
        params.append('organizationId', currentUser.organization_id || currentUser.organizationId);
      }

      const res = await fetch(`${API_BASE_URL}/api/doctor/availability/overview?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
      }
    } catch (err) {
      console.error('Failed to load availability overview:', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  // 2. Fetch My Schedule Slots for Date
  const fetchMySlots = async () => {
    try {
      setSlotsLoading(true);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('date', selectedDate);
      if (selectedDoctorId && selectedDoctorId !== 'ALL') {
        params.append('doctor_id', selectedDoctorId);
      }

      const res = await fetch(`${API_BASE_URL}/api/doctor/availability/slots?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setSlotsData(data);
        if (!selectedDoctorId && data.doctor?.doctor_profile_id) {
          setSelectedDoctorId(data.doctor.doctor_profile_id);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor slots:', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Load data depending on active tab
  useEffect(() => {
    fetchOverview();
  }, [selectedDate, searchQuery]);

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMySlots();
    }
  }, [activeTab, selectedDate, selectedDoctorId]);

  // Handle Manual Slot Block / Unblock Toggle
  const handleToggleSlotBlock = async (slot) => {
    try {
      setTogglingSlot(slot.slot_id);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/doctor/availability/slots/toggle-block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          date: selectedDate,
          start_time: slot.start_time,
          end_time: slot.end_time,
          reason: slot.is_available ? 'Blocked by Doctor' : '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update slot');

      showToast(data.message || (data.is_blocked ? 'Slot blocked' : 'Slot unblocked'));
      // Refresh current slots
      await fetchMySlots();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTogglingSlot(null);
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

  const weekdaysList = [
    { key: 1, name: 'Monday', short: 'Mon' },
    { key: 2, name: 'Tuesday', short: 'Tue' },
    { key: 3, name: 'Wednesday', short: 'Wed' },
    { key: 4, name: 'Thursday', short: 'Thu' },
    { key: 5, name: 'Friday', short: 'Fri' },
    { key: 6, name: 'Saturday', short: 'Sat' },
    { key: 0, name: 'Sunday', short: 'Sun' },
  ];

  return (
    <>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold shadow-xl animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* Top Header */}
        <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-[#071224]/60 backdrop-blur-sm sticky top-0 z-10 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Heading and small para */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
                Availability
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                Manage consultation hours, weekly shift timings, and clinic duty schedules across your practice.
              </p>
            </div>

            {/* Top Right: Add Schedule Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/availability/new')}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] flex-shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Schedule</span>
              </button>
            </div>
          </div>

          {/* Row below: Tabs on left, Search & Date picker on right */}
          <div className="pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Left: Switch Tabs (All doctors vs My schedule) */}
            <div className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-[#101927] text-teal-600 dark:text-teal-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All doctors
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'my'
                    ? 'bg-white dark:bg-[#101927] text-teal-600 dark:text-teal-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                My schedule
              </button>
            </div>

            {/* Right: Search Input & Date Picker Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              
              {/* Search input (primarily for All doctors or slot search) */}
              {activeTab === 'all' && (
                <div className="relative min-w-[200px] sm:min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search doctor or specialty..."
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
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Date dropdown (CustomCalendarPicker) to select date */}
              <div className="w-auto min-w-[160px]">
                <CustomCalendarPicker
                  selectedDate={selectedDate}
                  onChange={(newDate) => {
                    if (newDate && newDate !== 'ALL') {
                      setSelectedDate(newDate);
                    }
                  }}
                  className="w-full"
                />
              </div>

            </div>

          </div>

        </header>

        {/* ========================================================
            TAB 1: ALL DOCTORS TABLE (NO CARDS - 8 COLUMNS: DOCTOR + 7 WEEKDAYS)
           ======================================================== */}
        {activeTab === 'all' && (
          <div className="p-6 lg:px-8 space-y-4">
            
            {overviewLoading ? (
              <div className="w-full py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-serif">Calculating weekly doctor availability...</p>
              </div>
            ) : !overviewData || overviewData.doctors?.length === 0 ? (
              <AvailabilityEmptyState
                activeTab="all"
                searchQuery={searchQuery}
                dateFilter={selectedDate}
                onAddSchedule={() => navigate('/availability/new')}
                onResetFilters={() => { setSearchQuery(''); setSelectedDate(todayStr); }}
              />
            ) : (
              <div className="space-y-3">
                {/* Week reference banner */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span>
                    Showing weekly availability schedule for week of{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {overviewData.week_start} to {overviewData.week_end}
                    </strong>
                  </span>
                  <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-medium">
                    {overviewData.doctors.length} doctors found
                  </span>
                </div>

                {/* Table Container (8 Columns) */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#101927] shadow-sm overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[880px]">
                    
                    {/* Table Header: Doctor + 7 weekdays */}
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                        <th className="py-3.5 px-4 sticky left-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm z-10 min-w-[200px]">
                          Doctor
                        </th>
                        {weekdaysList.map((wd) => {
                          const dateForDay = overviewData.week_days?.find(d => d.day_of_week === wd.key)?.date;
                          const formattedDayNum = dateForDay ? new Date(dateForDay).getDate() : '';
                          return (
                            <th key={wd.key} className="py-3.5 px-3 text-center min-w-[105px]">
                              <span className="block font-bold text-slate-700 dark:text-slate-200">
                                {wd.name}
                              </span>
                              {formattedDayNum && (
                                <span className="text-[10px] text-slate-400 font-mono font-normal">
                                  {formattedDayNum} {new Date(dateForDay).toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    {/* Table Body: List of doctors */}
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                      {overviewData.doctors.map((doc) => (
                        <tr
                          key={doc.doctor_profile_id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Column 1: Doctor Info */}
                          <td className="py-3.5 px-4 sticky left-0 bg-white dark:bg-[#101927] group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 transition-colors z-10 border-r border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm border border-teal-500/20">
                                {doc.avatar_url ? (
                                  <img src={doc.avatar_url} alt={doc.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  doc.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="truncate">
                                <h4 className="font-semibold text-slate-900 dark:text-white font-serif truncate flex items-center gap-1.5">
                                  <span>{doc.name}</span>
                                </h4>
                                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">
                                  {doc.specialty} • {doc.qualification}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                  {doc.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Columns 2 to 8: Monday to Sunday */}
                          {weekdaysList.map((wd) => {
                            const dayStat = doc.days?.[wd.key];
                            if (!dayStat || !dayStat.is_active || dayStat.total_slots === 0) {
                              return (
                                <td key={wd.key} className="py-3.5 px-2 text-center">
                                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-[10px] font-medium">
                                    Off
                                  </span>
                                </td>
                              );
                            }

                            if (dayStat.is_holiday) {
                              return (
                                <td key={wd.key} className="py-3.5 px-2 text-center">
                                  <span
                                    title={dayStat.holiday_title || 'Hospital Holiday'}
                                    className="inline-block px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800/50"
                                  >
                                    Holiday
                                  </span>
                                </td>
                              );
                            }

                            if (dayStat.is_leave) {
                              return (
                                <td key={wd.key} className="py-3.5 px-2 text-center">
                                  <span
                                    className="inline-block px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800/50"
                                  >
                                    On Leave
                                  </span>
                                </td>
                              );
                            }

                            const hasBookings = dayStat.booked_slots > 0;
                            const isFullyBooked = dayStat.available_slots === 0;

                            return (
                              <td key={wd.key} className="py-3.5 px-2 text-center">
                                <div
                                  onClick={() => {
                                    setSelectedDoctorId(doc.doctor_profile_id);
                                    if (dayStat.date) setSelectedDate(dayStat.date);
                                    setActiveTab('my');
                                  }}
                                  className="cursor-pointer group/cell inline-flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all hover:scale-105 shadow-2xs hover:shadow-md"
                                  style={{ minWidth: '85px' }}
                                >
                                  {/* Available / Total Slots Pill */}
                                  <div
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                                      isFullyBooked
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                        : hasBookings
                                        ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200 border border-teal-200 dark:border-teal-800'
                                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    }`}
                                  >
                                    <span>{dayStat.available_slots}</span>
                                    <span className="opacity-70 font-normal"> / {dayStat.total_slots}</span>
                                  </div>

                                  {/* Sub-label */}
                                  <span className="text-[9px] font-mono mt-0.5 text-slate-400 group-hover/cell:text-teal-600 transition-colors">
                                    {isFullyBooked ? 'Full' : hasBookings ? `${dayStat.booked_slots} booked` : 'available'}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            TAB 2: MY SCHEDULE (SLOTS CREATED BY DOCTOR & REAL-TIME BLOCKED/AVAILABLE STATUS)
           ======================================================== */}
        {activeTab === 'my' && (
          <div className="p-6 lg:px-8 space-y-6">
            
            {slotsLoading ? (
              <div className="w-full py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-serif">Loading consultation slots for {selectedDate}...</p>
              </div>
            ) : !slotsData ? (
              <AvailabilityEmptyState
                activeTab="my"
                searchQuery=""
                dateFilter={selectedDate}
                onAddSchedule={() => navigate('/availability/new')}
                onResetFilters={() => setSelectedDate(todayStr)}
              />
            ) : (
              <div className="space-y-6">

                {/* Top Info Bar for Selected Date */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 font-bold font-serif text-base shadow-sm">
                      {slotsData.doctor?.full_name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold font-serif text-[#0B192C] dark:text-white">
                          {slotsData.doctor?.full_name || 'Dr. Sagar Sharma'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-[10px] font-semibold border border-teal-200 dark:border-teal-800/60">
                          {slotsData.doctor?.specialty || 'General Physician'}
                        </span>
                        {overviewData?.doctors && overviewData.doctors.length > 1 && (
                          <CustomDropdown
                            value={selectedDoctorId || slotsData.doctor?.doctor_profile_id || ''}
                            onChange={(val) => setSelectedDoctorId(val)}
                            className="min-w-[140px]"
                            radiusClass="rounded-lg"
                            triggerClassName="py-1 px-2.5 text-[11px]"
                            options={overviewData.doctors.map((d) => ({
                              value: d.doctor_profile_id,
                              label: `View: ${d.name}`,
                            }))}
                          />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-teal-500" />
                        <span>Schedule for <strong className="text-slate-800 dark:text-slate-200 font-medium">{slotsData.day_name}, {slotsData.date}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-medium">Total Slots</span>
                      <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">{slotsData.summary?.total_slots || 0}</span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">Available</span>
                      <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">{slotsData.summary?.available_slots || 0}</span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center">
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 block font-medium">Booked</span>
                      <span className="text-sm font-bold font-mono text-teal-700 dark:text-teal-300">{slotsData.summary?.booked_slots || 0}</span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-medium">Blocked</span>
                      <span className="text-sm font-bold font-mono text-rose-700 dark:text-rose-300">{slotsData.summary?.blocked_slots || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Holiday or Leave Notice */}
                {slotsData.is_holiday && (
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-3">
                    <CalendarOff className="w-5 h-5 flex-shrink-0 text-indigo-600" />
                    <div>
                      <span className="font-bold">Hospital Holiday:</span> {slotsData.holiday_title}. Clinic closed on this date; all slots blocked.
                    </div>
                  </div>
                )}

                {slotsData.is_leave && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                    <div>
                      <span className="font-bold">Doctor on Leave:</span> {slotsData.leave_reason || 'Approved leave'}. Slots marked as unavailable.
                    </div>
                  </div>
                )}

                {/* Check if no shifts/schedules exist on this day */}
                {slotsData.shifts?.every(s => !s.is_active || s.slots.length === 0) ? (
                  <div className="p-10 rounded-2xl bg-white dark:bg-[#101927] border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-slate-800 dark:text-slate-200">
                      No Working Slots on {slotsData.day_name}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {slotsData.doctor?.full_name} does not have clinical hours configured for {slotsData.day_name}s.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/availability/new')}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Configure Schedule for {slotsData.day_name}</span>
                    </button>
                  </div>
                ) : (
                  // Shifts and Slot Grid
                  <div className="space-y-6">
                    {slotsData.shifts.map((shift) => {
                      if (!shift.is_active || shift.slots.length === 0) return null;

                      const isMorning = shift.shift_type === 'MORNING';

                      return (
                        <div
                          key={shift.shift_type}
                          className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4"
                        >
                          {/* Shift Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{isMorning ? '🌅' : '🌆'}</span>
                              <div>
                                <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                                  {shift.label}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {shift.slot_duration_minutes || 30} mins per consultation • {shift.slots.length} total slots
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>{shift.slots.filter(s => s.status === 'AVAILABLE').length} Available</span>
                              </span>
                              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-teal-500" />
                                <span>{shift.slots.filter(s => s.status === 'BOOKED').length} Booked</span>
                              </span>
                            </div>
                          </div>

                          {/* Lightweight Grid of Slots */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                            {shift.slots.map((slot) => {
                              const isAvail = slot.status === 'AVAILABLE';
                              const isBooked = slot.status === 'BOOKED';
                              const isBlocked = slot.status === 'BLOCKED';
                              const isToggling = togglingSlot === slot.slot_id;
                              const timeText = format12Hour(slot.start_time);

                              if (isBooked) {
                                return (
                                  <div
                                    key={slot.slot_id}
                                    title="Booked slot (Disabled)"
                                    className="py-2.5 px-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-850 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed flex items-center justify-between select-none"
                                  >
                                    <span className="font-sans text-xs font-semibold line-through">
                                      {timeText}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                      Booked
                                    </span>
                                  </div>
                                );
                              }

                              if (isBlocked) {
                                return (
                                  <div
                                    key={slot.slot_id}
                                    className="py-2.5 px-3 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between transition-all"
                                  >
                                    <span className="font-sans text-xs font-bold text-rose-800 dark:text-rose-200">
                                      {timeText}
                                    </span>
                                    {!slotsData.is_holiday && !slotsData.is_leave ? (
                                      <button
                                        type="button"
                                        disabled={isToggling}
                                        onClick={() => handleToggleSlotBlock(slot)}
                                        className="px-2 py-0.5 rounded-md bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 text-[10px] font-bold transition-all"
                                        title="Click to unblock slot"
                                      >
                                        {isToggling ? '...' : 'Blocked'}
                                      </button>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100/70 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                                        Blocked
                                      </span>
                                    )}
                                  </div>
                                );
                              }

                              // Available slot: ONLY the time, no "Available" text, no time icon, UI font family
                              return (
                                <button
                                  key={slot.slot_id}
                                  type="button"
                                  disabled={isToggling}
                                  onClick={() => handleToggleSlotBlock(slot)}
                                  title="Click to block slot"
                                  className="py-2.5 px-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#101927] hover:border-teal-500 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 text-center transition-all shadow-2xs group cursor-pointer"
                                >
                                  <span className="font-sans text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                    {isToggling ? '...' : timeText}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>
    </>
  );
}
