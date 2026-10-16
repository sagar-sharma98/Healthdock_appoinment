import React from 'react';
import { Clock, CalendarX, Plus, SearchX, Sparkles } from 'lucide-react';

export default function AvailabilityEmptyState({
  activeTab = 'all', // 'all' | 'my'
  searchQuery = '',
  dateFilter = 'ALL',
  onAddSchedule,
  onResetFilters,
}) {
  const isFiltered = Boolean(searchQuery.trim() || (dateFilter && dateFilter !== 'ALL'));

  return (
    <div className="w-full bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
      
      {/* Icon with glowing teal ring */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-sm shadow-teal-500/10">
          {isFiltered ? (
            <SearchX className="w-8 h-8 stroke-[1.75]" />
          ) : (
            <Clock className="w-8 h-8 stroke-[1.75]" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Contextual Title & Description */}
      <div className="max-w-md space-y-1.5">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0B192C] dark:text-white tracking-tight">
          {isFiltered
            ? 'No Schedules Match Your Search'
            : activeTab === 'my'
            ? 'No Schedule Configured Yet'
            : 'No Doctor Schedules Available'}
        </h3>
        
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
          {isFiltered ? (
            <span>
              We couldn't find any availability records matching{' '}
              {searchQuery && <span className="font-semibold text-slate-700 dark:text-slate-200">"{searchQuery}"</span>}
              {searchQuery && dateFilter !== 'ALL' && ' and '}
              {dateFilter !== 'ALL' && <span className="font-semibold text-slate-700 dark:text-slate-200">date "{dateFilter}"</span>}.
            </span>
          ) : activeTab === 'my' ? (
            <span>
              You haven't defined your personal consultation hours or duty shifts yet. Click <span className="font-medium text-teal-600 dark:text-teal-400">"Add Schedule"</span> above to set your weekly working slots and patient capacity.
            </span>
          ) : (
            <span>
              There are currently no active duty shifts or consultation schedules published across the clinic. Add doctor availability to unlock automated appointment slot booking.
            </span>
          )}
        </p>
      </div>

      {/* Actions */}
      {isFiltered ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/40 shadow-sm transition-all"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        onAddSchedule && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onAddSchedule}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium shadow-md shadow-teal-500/20 inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Your First Schedule</span>
            </button>
          </div>
        )
      )}
    </div>
  );
}
