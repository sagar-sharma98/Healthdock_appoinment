import React from 'react';
import { CalendarX2, SearchX, CalendarPlus } from 'lucide-react';

export default function EmptyState({
  type = 'no-data', // 'no-data' | 'no-search-results'
  searchQuery = '',
  onCreateBooking,
  bookingSlug = 'dr-sagar-sharma',
  onResetFilters,
}) {
  const isSearchEmpty = type === 'no-search-results' || (searchQuery && searchQuery.trim().length > 0);

  return (
    <div className="w-full bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
      
      {/* Icon with glowing teal ring */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-sm shadow-teal-500/10">
          {isSearchEmpty ? (
            <SearchX className="w-8 h-8 stroke-[1.75]" />
          ) : (
            <CalendarX2 className="w-8 h-8 stroke-[1.75]" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
          <CalendarPlus className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Contextual Title & Description */}
      <div className="max-w-md space-y-1.5">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0B192C] dark:text-white tracking-tight">
          {isSearchEmpty 
            ? 'No Bookings Match Your Search' 
            : 'No Patient Bookings Yet'}
        </h3>
        
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
          {isSearchEmpty ? (
            <span>
              We couldn't find any appointments matching <span className="font-semibold text-slate-700 dark:text-slate-200">"{searchQuery}"</span> or the selected filters.
            </span>
          ) : (
            <span>
              Your clinic calendar is currently clear. Once patients book via your link or you register a walk-in, their appointment tokens and details will appear here.
            </span>
          )}
        </p>
      </div>

      {/* Reset action only shown when filtered by search/status */}
      {isSearchEmpty && onResetFilters && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/40 shadow-sm transition-all"
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}
