import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  icon: Icon,
  className = '',
  triggerClassName = '',
  radiusClass = 'rounded-xl',
  activeColor = '#0d9488', // defaults to HealthDock teal
  disabled = false,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options to { value, label, sublabel, icon }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt.id,
        label: opt.label ?? opt.name ?? String(opt.value),
        sublabel: opt.sublabel ?? opt.description ?? '',
        icon: opt.icon,
      };
    }
    return {
      value: opt,
      label: String(opt),
      sublabel: '',
    };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={
          isOpen
            ? {
                borderColor: activeColor,
                boxShadow: `0 0 0 3px ${activeColor}25`,
              }
            : {}
        }
        className={`w-full py-2.5 px-3.5 ${radiusClass} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-left flex items-center justify-between gap-2.5 transition-all shadow-xs hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 truncate">
          {Icon && (
            <Icon
              className="w-4 h-4 flex-shrink-0 transition-colors"
              style={isOpen ? { color: activeColor } : { color: '#94a3b8' }}
            />
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 flex-shrink-0 text-slate-400" />
          )}
          <span
            className={`truncate font-medium ${
              selectedOption
                ? 'text-slate-800 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={isOpen ? { color: activeColor } : {}}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-1.5 z-50 p-1.5 ${radiusClass} border border-slate-200/90 dark:border-slate-700/90 bg-white/95 dark:bg-[#0E1624]/95 backdrop-blur-xl shadow-2xl shadow-black/25 dark:shadow-black/50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="py-3 px-3 text-center text-xs text-slate-400">
              No options available
            </div>
          ) : (
            <div className="space-y-0.5">
              {normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${activeColor}15`,
                            color: activeColor,
                          }
                        : {}
                    }
                    className={`px-3 py-2 ${radiusClass} text-xs font-medium cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      {opt.icon && <opt.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: activeColor }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
