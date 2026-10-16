import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

export default function CustomCalendarPicker({
  selectedDate,
  onChange,
  className = '',
  primaryColor = null,
  cornerRadius = 'Rounded',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Default to October 2026 as per app context / current date
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 9, 1)); // October 2026

  const activeColor = primaryColor || '#14B8A6';

  const getRadius = (type = 'button') => {
    if (cornerRadius === 'Sharp') return 'rounded-none';
    if (cornerRadius === 'Pill') return type === 'button' ? 'rounded-full' : 'rounded-2xl';
    return type === 'button' ? 'rounded-xl' : 'rounded-2xl';
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate days for currentMonth
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Helper formatting
  const formatDateStr = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const todayStr = '2026-10-14';

  const getDisplayLabel = () => {
    if (!selectedDate || selectedDate === 'ALL') return 'All Dates';
    if (selectedDate === todayStr) return 'Today (Oct 14)';
    if (selectedDate === '2026-10-15') return 'Tomorrow (Oct 15)';
    return selectedDate;
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={
          isOpen
            ? { borderColor: activeColor, boxShadow: `0 0 0 3px ${activeColor}25` }
            : {}
        }
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 ${getRadius('button')} border text-xs font-medium transition-all shadow-sm ${
          isOpen
            ? 'bg-white dark:bg-[#101927] text-[#0B192C] dark:text-white'
            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-slate-700 dark:text-slate-200 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: activeColor }} />
          <span className="truncate">{getDisplayLabel()}</span>
        </div>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
          style={isOpen ? { color: activeColor } : {}}
        />
      </button>

      {/* Popover Calendar - Anchored to right edge so it opens inwards */}
      {isOpen && (
        <div className={`absolute right-0 mt-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0E1624] border border-slate-200 dark:border-slate-800 ${getRadius('popover')} shadow-2xl p-3.5 space-y-3 animate-in fade-in-50 zoom-in-95 duration-150`}>
          
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/80 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange('ALL');
                setIsOpen(false);
              }}
              style={
                !selectedDate || selectedDate === 'ALL'
                  ? { backgroundColor: `${activeColor}18`, color: activeColor }
                  : {}
              }
              className={`px-2 py-1 ${getRadius('button')} transition-colors ${
                !selectedDate || selectedDate === 'ALL'
                  ? 'font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setIsOpen(false);
              }}
              style={
                selectedDate === todayStr
                  ? { backgroundColor: `${activeColor}18`, color: activeColor }
                  : {}
              }
              className={`px-2 py-1 ${getRadius('button')} transition-colors ${
                selectedDate === todayStr
                  ? 'font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('2026-10-15');
                setIsOpen(false);
              }}
              style={
                selectedDate === '2026-10-15'
                  ? { backgroundColor: `${activeColor}18`, color: activeColor }
                  : {}
              }
              className={`px-2 py-1 ${getRadius('button')} transition-colors ${
                selectedDate === '2026-10-15'
                  ? 'font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Month Header */}
          <div className="flex items-center justify-between text-xs font-serif font-bold text-slate-900 dark:text-white px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-teal-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-teal-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-400">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 text-center text-xs gap-1">
            {/* Empty slots for first day offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <span key={`empty-${idx}`} className="py-1 text-slate-300 dark:text-slate-700 select-none">
                -
              </span>
            ))}

            {/* Days in Month */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = formatDateStr(year, month, dayNum);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    onChange(dateStr);
                    setIsOpen(false);
                  }}
                  style={
                    isSelected
                      ? { backgroundColor: activeColor, color: '#ffffff', borderColor: activeColor }
                      : isToday
                      ? { borderColor: `${activeColor}80`, color: activeColor }
                      : {}
                  }
                  className={`py-1 ${getRadius('button')} text-xs transition-all ${
                    isSelected
                      ? 'font-bold shadow-md scale-105'
                      : isToday
                      ? 'border font-semibold hover:opacity-80'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Clear Filter Footer */}
          {selectedDate && selectedDate !== 'ALL' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <button
                type="button"
                onClick={() => {
                  onChange('ALL');
                  setIsOpen(false);
                }}
                style={{ color: activeColor }}
                className="text-[11px] hover:underline font-medium"
              >
                Reset to all dates
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
