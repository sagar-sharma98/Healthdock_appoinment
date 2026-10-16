import { API_BASE_URL } from '../../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export default function EditPageModal({
  isOpen,
  onClose,
  page,
  onPageUpdated,
}) {
  const [pageName, setPageName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [slotDuration, setSlotDuration] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (page) {
      setPageName(page.page_name || '');
      setSlug(page.slug || '');
      setDescription(page.description || '');
      setSlotDuration(String(page.slot_duration_minutes || 30));
      setError('');
    }
  }, [page]);

  if (!isOpen || !page) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pageName.trim()) {
      setError('Page name is required');
      return;
    }
    if (!slug.trim()) {
      setError('URL slug is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/doctor/pages/${page.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          page_name: pageName.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
          slot_duration_minutes: parseInt(slotDuration, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update page');
      }

      if (onPageUpdated) {
        onPageUpdated(data.page);
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
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                Edit Booking Page
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Modify public title, URL address, and consultation settings
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
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:rose-900/50 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Page Name */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Page Name *
            </label>
            <input
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101927] text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
              required
            />
          </div>

          {/* URL Slug & Live Preview */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Booking Page URL Slug *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                /
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101927] text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Live link: <span className="text-teal-600 dark:text-teal-400">{window.location.origin}/{slug || 'your-slug'}</span>
            </p>
          </div>

          {/* Slot Duration */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Slot Duration
            </label>
            <CustomDropdown
              value={slotDuration}
              onChange={(val) => setSlotDuration(val)}
              options={[
                { value: '15', label: '15 minutes' },
                { value: '20', label: '20 minutes' },
                { value: '30', label: '30 minutes (Standard)' },
                { value: '45', label: '45 minutes' },
                { value: '60', label: '60 minutes' },
              ]}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Welcome Message / Instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101927] text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-serif font-medium shadow-md shadow-teal-500/20 transition-all hover:scale-[1.02]"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
