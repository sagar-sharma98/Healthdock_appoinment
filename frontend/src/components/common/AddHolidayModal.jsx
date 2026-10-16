import { API_BASE_URL } from '../../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Building2, Tag, FileText, CheckCircle2 } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export default function AddHolidayModal({
  isOpen,
  onClose,
  onHolidaySaved,
  initialData = null,
}) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [holidayType, setHolidayType] = useState('PUBLIC');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || initialData.start_date || '');
      setHolidayType(initialData.holiday_type || 'PUBLIC');
      setDescription(initialData.description || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setStartDate(today);
      setEndDate(today);
      setHolidayType('PUBLIC');
      setDescription('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Holiday title is required');
      return;
    }
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('End date cannot be earlier than start date');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const url = isEditing
        ? `${API_BASE_URL}/api/holidays/hospital/${initialData.id}`
        : `${API_BASE_URL}/api/holidays/hospital`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          start_date: startDate,
          end_date: endDate || startDate,
          holiday_type: holidayType,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save hospital holiday');
      }

      if (onHolidaySaved) {
        onHolidaySaved(data.holiday, isEditing);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0E1624] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                {isEditing ? 'Edit Hospital Holiday' : 'Add Hospital Holiday'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure clinic-wide closures and official medical holidays
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Holiday Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Holiday Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Republic Day, Diwali Festival, Annual Maintenance"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Holiday Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Holiday Category
            </label>
            <CustomDropdown
              value={holidayType}
              onChange={(val) => setHolidayType(val)}
              options={[
                { value: 'NATIONAL', label: 'National Holiday (Government declared)' },
                { value: 'FESTIVAL', label: 'Religious / Cultural Festival' },
                { value: 'PUBLIC', label: 'Public Gazette Holiday' },
                { value: 'CLINIC_CLOSURE', label: 'Clinic Maintenance / Sterilization Closure' },
                { value: 'EMERGENCY', label: 'Emergency / Ad-hoc Closure' },
              ]}
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || endDate < e.target.value) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Description / Notice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Public Notice (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Outpatient clinic closed. Emergency emergency triage unit will remain on standby."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-xs font-medium text-white bg-teal-500 hover:bg-teal-600 shadow-md shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Create Holiday'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
