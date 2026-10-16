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
  Settings, 
  GitBranch, 
  Moon, 
  Sun,
  ChevronDown, 
  ChevronLeft,
  ChevronRight, 
  Search, 
  X, 
  Plus, 
  CheckCircle2, 
  Cross, 
  Sparkles, 
  HelpCircle, 
  Share2,
  Stethoscope,
  MoreVertical,
  Phone,
  Mail,
  User,
  CalendarOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CustomDropdown from '../components/common/CustomDropdown';
import CustomCalendarPicker from '../components/common/CustomCalendarPicker';
import EmptyState from '../components/common/EmptyState';

export default function BookingsPage() {
  const navigate = useNavigate();
  const { doctor, theme, toggleTheme, triggerToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [userProfile, setUserProfile] = useState({
    name: doctor?.name || 'sagar sharma',
    email: doctor?.email || 'sagarsharma9882@gmail.com',
    slug: doctor?.bookingSlug || 'sagar-sharma',
  });

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('healthdock_token');
    try {
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/doctor/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.appointments) {
          setAppointments(data.appointments);
        }
      }
    } catch (err) {
      console.log('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('healthdock_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUserProfile(prev => ({
          ...prev,
          name: u.full_name || prev.name,
          email: u.email || prev.email,
        }));
      } catch (e) {
        console.error(e);
      }
    }
    fetchAppointments();
  }, []);

  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, link: '/dashboard' },
    { id: 'Bookings', icon: BookOpen, link: '/bookings', active: true },
    { id: 'Availability', icon: Clock, link: '/availability' },
    { id: 'Holidays', icon: CalendarOff, link: '/holidays' },
    { id: 'Calendar', icon: CalendarIcon, link: '/dashboard' },
    { id: 'Contacts', icon: Users, link: '/dashboard' },
    { id: 'Pages', icon: FileText, link: '/pages' },
    { id: 'Users', icon: Users, link: '/users' },
    { id: 'Workflows', icon: GitBranch, link: '/dashboard' },
    { id: 'Settings', icon: Settings, link: '/dashboard' },
  ];

  // Options for Status Dropdown
  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Confirmed', value: 'CONFIRMED', colorDot: 'bg-teal-500' },
    { label: 'Waiting in Lounge', value: 'WAITING_IN_LOUNGE', colorDot: 'bg-amber-500' },
    { label: 'In Progress', value: 'IN_PROGRESS', colorDot: 'bg-blue-500' },
    { label: 'Completed', value: 'COMPLETED', colorDot: 'bg-emerald-600' },
    { label: 'Cancelled', value: 'CANCELLED', colorDot: 'bg-rose-500' },
    { label: 'Rescheduled', value: 'RESCHEDULED', colorDot: 'bg-purple-500' },
  ];

  // Options for Doctor Dropdown
  const doctorOptions = [
    { label: 'All Doctors', value: 'ALL' },
    { label: `Dr. ${userProfile.name}`, value: 'current-doctor' },
  ];

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = apt.patient_name?.toLowerCase().includes(q);
      const matchPhone = apt.patient_phone?.toLowerCase().includes(q);
      const matchToken = apt.daily_token?.toLowerCase().includes(q);
      const matchRef = apt.booking_reference?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchToken && !matchRef) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL' && apt.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (dateFilter && dateFilter !== 'ALL') {
      const aptDate = apt.appointment_date?.slice(0, 10);
      if (aptDate !== dateFilter) return false;
    }

    return true;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, doctorFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDoctorFilter('ALL');
    setDateFilter('ALL');
  };

  const handleBookingCreated = (newApt) => {
    setAppointments(prev => [newApt, ...prev]);
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* Top Header matching User Prompt */}
        <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-[#071224]/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
                Bookings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                Keep track of your clinical schedule, patient tokens, and consultation appointments across your practice.
              </p>
            </div>

            {/* Top Right "Create Booking" Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/bookings/new')}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] flex-shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Booking</span>
              </button>
            </div>

          </div>

          {/* Filters Bar: Search + Custom Dropdowns sized to their content */}
          <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            
            {/* 1. Search Field (flexible width) */}
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient name, phone, or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs shadow-sm"
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

            {/* Filter Dropdowns container with content-based widths */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              
              {/* 2. Custom Status Dropdown */}
              <div className="w-full sm:w-auto min-w-[155px]">
                <CustomDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  placeholder="All Statuses"
                  className="w-full"
                />
              </div>

              {/* 3. Custom Doctor Dropdown */}
              <div className="w-full sm:w-auto min-w-[165px]">
                <CustomDropdown
                  value={doctorFilter}
                  onChange={setDoctorFilter}
                  options={doctorOptions}
                  placeholder="All Doctors"
                  icon={User}
                  className="w-full"
                />
              </div>

              {/* 4. Custom Calendar Date Picker */}
              <div className="w-full sm:w-auto min-w-[150px]">
                <CustomCalendarPicker
                  selectedDate={dateFilter}
                  onChange={setDateFilter}
                  className="w-full"
                />
              </div>

            </div>

          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 lg:px-8 space-y-6">
          
          {/* Active Filter Pills (if any applied) */}
          {(searchQuery || statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px]">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-[11px]">
                  <span>"{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-[11px]">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter('ALL')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {dateFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-[11px]">
                  <span>Date: {dateFilter}</span>
                  <button onClick={() => setDateFilter('ALL')}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium ml-1"
              >
                Reset all
              </button>
            </div>
          )}

          {/* Bookings List or Custom Empty State */}
          {filteredAppointments.length === 0 ? (
            <EmptyState
              type={searchQuery || statusFilter !== 'ALL' || dateFilter !== 'ALL' ? 'no-search-results' : 'no-data'}
              searchQuery={searchQuery}
              onCreateBooking={() => navigate('/bookings/new')}
              bookingSlug={userProfile.slug}
              onResetFilters={handleResetFilters}
            />
          ) : (
            /* Render Clinical Bookings Table when appointments exist */
            <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm min-h-[500px] flex flex-col justify-between">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Token</th>
                      <th className="px-5 py-3.5">Patient Details</th>
                      <th className="px-5 py-3.5">Service</th>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedAppointments.map((apt) => (
                      <tr key={apt.id || apt.booking_reference} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                        
                        {/* Token */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold font-serif flex items-center justify-center text-xs shadow-sm">
                            #{apt.daily_token || '01'}
                          </span>
                        </td>

                        {/* Patient Name & Phone */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {apt.patient_name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{apt.patient_phone}</span>
                            </p>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {apt.service_name || 'General Consultation'}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {apt.appointment_date?.slice(0, 10) || 'Today'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {apt.start_time?.slice(0, 5) || '10:00 AM'}
                            </p>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            <span>{apt.status || 'Confirmed'}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-500/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredAppointments.length === 0 ? 0 : startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(startIndex + itemsPerPage, filteredAppointments.length)}</span> of{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredAppointments.length}</span> {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
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
            </div>
          )}

        </div>

      </main>
  );
}
