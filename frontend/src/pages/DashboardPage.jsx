import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  Share2,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Video,
  ChevronRight,
  ArrowUpRight,
  XCircle,
  Repeat,
  DollarSign,
  AlertCircle,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CustomDropdown from '../components/common/CustomDropdown';
import CustomAreaChart from '../components/dashboard/CustomAreaChart';
import CustomBarChart from '../components/dashboard/CustomBarChart';
import ConsultationModeCard from '../components/dashboard/ConsultationModeCard';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { doctor, triggerToast } = useApp();

  const [range, setRange] = useState('14'); // '7' | '14' | '30'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState({
    totalBookings: 0,
    cancellations: 0,
    reschedules: 0,
    todayBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalVisits: 0,
    uniqueVisitors: 0,
  });

  const [dailyTrend, setDailyTrend] = useState([]);
  const [hourlyDistribution, setHourlyDistribution] = useState([]);
  const [consultationModes, setConsultationModes] = useState({
    inPerson: 0,
    video: 0,
    inPersonPercent: 0,
    videoPercent: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);

  const [userProfile, setUserProfile] = useState({
    name: doctor?.name || 'Dr. Sagar Sharma',
    email: doctor?.email || 'sagarsharma9882@gmail.com',
    slug: doctor?.bookingSlug || 'sagar-sharma',
  });

  // Fetch real analytics data from backend
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError('');
      const token = localStorage.getItem('healthdock_token');
      const savedUser = localStorage.getItem('healthdock_user');

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

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/doctor/dashboard-stats?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load dashboard statistics');
      }

      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
        setDailyTrend(data.dailyTrend || []);
        setHourlyDistribution(data.hourlyDistribution || []);
        setConsultationModes(
          data.consultationModes || { inPerson: 0, video: 0, inPersonPercent: 0, videoPercent: 0 }
        );
        setRecentAppointments(data.recentAppointments || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true).then(() => {
      triggerToast('Analytics Updated', 'Synced latest booking data from server.', 'info');
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${userProfile.slug}`;
    navigator.clipboard.writeText(url);
    triggerToast('Copied to clipboard!', `Patient booking URL: ${url}`, 'success');
  };

  const rangeOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '14', label: 'Last 14 Days' },
    { value: '30', label: 'Last 30 Days' },
  ];

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#071224] text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Top Header Bar */}
      <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0B192C]/70 backdrop-blur-md sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
              Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Welcome back, <strong className="text-slate-700 dark:text-slate-200 font-medium">{userProfile.name}</strong> • Real-time patient appointment metrics
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time Range Filter Custom Dropdown */}
          <div className="w-36">
            <CustomDropdown
              value={range}
              onChange={(val) => setRange(val)}
              options={rangeOptions}
              radiusClass="rounded-xl"
              triggerClassName="py-2 text-xs"
            />
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh statistics"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101927] text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-400 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-500' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="p-6 lg:px-8 space-y-6 flex-1">
        
        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. TOP 4 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Card 1: Today's OPD Queue */}
          <div className="bg-white dark:bg-[#0E1624] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-500/40 transition-colors relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Today's Schedule</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-[#0B192C] dark:text-white">
                {stats.todayBookings}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">appointments</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-medium">
                Active Queue
              </span>
              <span className="text-slate-400">for today's clinic</span>
            </div>
          </div>

          {/* Card 2: Total Confirmed Appointments */}
          <div className="bg-white dark:bg-[#0E1624] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-500/40 transition-colors group">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Total Bookings</span>
              <TrendingUp className="w-4 h-4 text-teal-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-[#0B192C] dark:text-white">
                {stats.totalBookings}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">total confirmed</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <span>Revenue:</span>
              <strong className="text-slate-700 dark:text-slate-200 font-semibold font-mono">
                ₹{Number(stats.totalRevenue).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Card 3: Completed Consultations */}
          <div className="bg-white dark:bg-[#0E1624] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-500/40 transition-colors group">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Completed OPD</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-[#0B192C] dark:text-white">
                {stats.completedBookings}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">sessions</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              <span>Consultations marked complete</span>
            </div>
          </div>

          {/* Card 4: Cancellations & Reschedules */}
          <div className="bg-white dark:bg-[#0E1624] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-500/40 transition-colors group">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Cancellations</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-rose-600 dark:text-rose-400">
                {stats.cancellations}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                ({stats.reschedules} rescheduled)
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              <span>Patient cancel rate tracked</span>
            </div>
          </div>

        </div>

        {/* 2. MAIN ANALYTICS SECTION: TWO COLUMNS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: PRIMARY CHARTS (8 cols on xl) */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Chart Card 1: Appointment Volume Trend (Custom SVG Area Chart) */}
            <div className="bg-white dark:bg-[#0E1624] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#0B192C] dark:text-white">
                    Appointment Booking Trend
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Daily booking volume across the last {range} days
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-[11px] font-medium">Confirmed Bookings</span>
                  </div>
                </div>
              </div>

              {/* Custom SVG Area Chart Component */}
              <div className="pt-2">
                <CustomAreaChart
                  data={dailyTrend}
                  height={220}
                  accentColor="#0d9488"
                  emptyText="No bookings recorded in this period yet"
                />
              </div>
            </div>

            {/* Chart Card 2: Peak Consultation Rush Hours (Custom SVG Bar Chart) */}
            <div className="bg-white dark:bg-[#0E1624] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#0B192C] dark:text-white">
                    Peak Consultation Rush Hours
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hourly slot distribution from 9:00 AM to 7:00 PM
                  </p>
                </div>
                
                <span className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10px] font-medium border border-sky-200 dark:border-sky-800/60 w-fit">
                  Blue dot indicates peak hour
                </span>
              </div>

              {/* Custom SVG Bar Chart Component */}
              <div className="pt-2">
                <CustomBarChart
                  data={hourlyDistribution}
                  height={180}
                  accentColor="#0d9488"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: DISTRIBUTION, LIVE QUEUE & PRACTICE INFO (4 cols on xl) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Card 1: Consultation Mode Breakdown */}
            <div className="bg-white dark:bg-[#0E1624] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold font-serif text-[#0B192C] dark:text-white">
                  Consultation Mode
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  In-Person Clinic visits vs Online Video consultations
                </p>
              </div>

              <ConsultationModeCard
                inPerson={consultationModes.inPerson}
                video={consultationModes.video}
                inPersonPercent={consultationModes.inPersonPercent}
                videoPercent={consultationModes.videoPercent}
              />
            </div>

            {/* Card 2: Live Appointment Queue Snapshot */}
            <div className="bg-white dark:bg-[#0E1624] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#0B192C] dark:text-white">
                    Live Patient Queue
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Latest scheduled consultations
                  </p>
                </div>
                <Link
                  to="/bookings"
                  className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {recentAppointments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="font-medium text-slate-600 dark:text-slate-300">No appointments scheduled</p>
                  <p className="text-[11px]">When patients book, they will appear here live.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentAppointments.slice(0, 4).map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Token Badge */}
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold font-mono text-xs flex-shrink-0">
                          #{apt.daily_token || '01'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {apt.patient_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            {apt.consultation_mode === 'ONLINE_VIDEO' ? (
                              <Video className="w-3 h-3 text-sky-500" />
                            ) : (
                              <Building2 className="w-3 h-3 text-teal-500" />
                            )}
                            <span>{apt.time || '10:00 AM'}</span>
                            <span>•</span>
                            <span>{apt.date}</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                        {apt.status || 'Confirmed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 3: Compliance Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-sky-500/10 border border-teal-500/20 space-y-2">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold font-serif">DPDP Act 2026 Guaranteed</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                All patient records and consent telemetry are end-to-end encrypted under India Digital Personal Data Protection standards.
              </p>
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}
