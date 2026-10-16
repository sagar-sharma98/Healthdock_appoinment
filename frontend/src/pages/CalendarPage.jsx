import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  Share2,
  Bell,
  SlidersHorizontal,
} from 'lucide-react';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState('October 2026');
  const [viewMode, setViewMode] = useState('Month'); // 'Day' | 'Week' | 'Month'

  // Sample calendar days mockup
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
              Interactive Timeline
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual multi-doctor appointment calendar and Google Calendar synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/bookings"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-teal-500" />
            <span>Today's Bookings</span>
          </Link>
          <Link
            to="/availability"
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Manage Shift Hours</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feature Notification Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/25">
            <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Calendar & Schedule Sync is in Active Rollout!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
              You can currently manage and view all confirmed patient visits under{' '}
              <Link to="/bookings" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2">
                Bookings
              </Link>{' '}
              and set doctor working shifts in{' '}
              <Link to="/availability" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2">
                Availability
              </Link>.
              Full visual two-way calendar drag & drop sync is being finalized.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
          <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            Preview Mode
          </span>
        </div>
      </div>

      {/* Calendar Controls & View */}
      <div className="bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-3 text-slate-800 dark:text-slate-100">
                {currentMonth}
              </span>
              <button
                type="button"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline px-2"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              {['Day', 'Week', 'Month'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

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

        {/* Calendar Grid Preview */}
        <div className="grid grid-cols-7 gap-2">
          {/* Days Mockup */}
          {days.map((day) => {
            const isToday = day === 16;
            const hasSlots = day >= 14 && day <= 24;
            return (
              <div
                key={day}
                className={`min-h-[75px] md:min-h-[90px] p-2 rounded-xl border transition-all text-left flex flex-col justify-between ${
                  isToday
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-500/10 shadow-sm'
                    : 'border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-teal-500 text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>

                {hasSlots && (
                  <div className="space-y-1 mt-1">
                    <div className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 truncate">
                      Morning (9:00 - 13:00)
                    </div>
                    {day % 2 === 0 && (
                      <div className="px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-[10px] font-medium text-blue-700 dark:text-blue-300 truncate">
                        Evening (17:00 - 20:00)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Highlights & Upcoming Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Multi-Doctor Shift Overlay
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            See all associate doctors and specialists on one unified timeline with color-coded appointment statuses.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            2-Way Google & Outlook Sync
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Avoid double bookings automatically by blocking personal calendar events on doctor booking slots.
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
    </div>
  );
}
