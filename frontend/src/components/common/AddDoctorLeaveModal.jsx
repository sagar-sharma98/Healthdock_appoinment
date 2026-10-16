import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Stethoscope, User, Clock, CheckCircle2 } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export default function AddDoctorLeaveModal({
  isOpen,
  onClose,
  onLeaveSaved,
  doctors = [],
  initialData = null,
  currentDoctorId = null,
}) {
  const isEditing = Boolean(initialData);

  const [doctorId, setDoctorId] = useState('');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [session, setSession] = useState('FULL_DAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('APPROVED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setDoctorId(initialData.doctor_profile_id || '');
      setLeaveType(initialData.leave_type || 'CASUAL');
      setSession(initialData.session || 'FULL_DAY');
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || initialData.start_date || '');
      setReason(initialData.reason || '');
      setStatus(initialData.status || 'APPROVED');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDoctorId(currentDoctorId || (doctors.length > 0 ? doctors[0].doctor_profile_id : ''));
      setLeaveType('CASUAL');
      setSession('FULL_DAY');
      setStartDate(today);
      setEndDate(today);
      setReason('');
      setStatus('APPROVED');
    }
    setError('');
  }, [initialData, isOpen, doctors, currentDoctorId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!doctorId && doctors.length > 0) {
      setError('Please select a doctor');
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
        ? `http://localhost:5000/api/holidays/leaves/${initialData.id}`
        : 'http://localhost:5000/api/holidays/leaves';

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctor_profile_id: doctorId,
          start_date: startDate,
          end_date: endDate || startDate,
          leave_type: leaveType,
          session,
          reason: reason.trim(),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save doctor leave');
      }

      if (onLeaveSaved) {
        onLeaveSaved(data.leave, isEditing);
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
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                {isEditing ? 'Edit Doctor Leave' : 'Record Doctor Leave'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Block booking calendar and manage physician time-off
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

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Doctor <span className="text-rose-500">*</span>
            </label>
            <CustomDropdown
              value={doctorId}
              onChange={(val) => setDoctorId(val)}
              disabled={isEditing}
              options={
                doctors.length === 0
                  ? [{ value: '', label: 'Current Doctor' }]
                  : doctors.map((d) => ({
                      value: d.doctor_profile_id,
                      label: d.full_name,
                      sublabel: d.specialty || 'General Physician',
                    }))
              }
            />
          </div>

          {/* Leave Type & Session */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Leave Category
              </label>
              <CustomDropdown
                value={leaveType}
                onChange={(val) => setLeaveType(val)}
                options={[
                  { value: 'CASUAL', label: 'Casual Leave (CL)' },
                  { value: 'SICK', label: 'Medical / Sick Leave (ML)' },
                  { value: 'VACATION', label: 'Vacation / Annual Leave' },
                  { value: 'CONFERENCE', label: 'Medical Conference / CME' },
                  { value: 'EMERGENCY', label: 'Emergency Leave' },
                  { value: 'MATERNITY_PATERNITY', label: 'Maternity / Paternity' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Session
              </label>
              <CustomDropdown
                value={session}
                onChange={(val) => setSession(val)}
                options={[
                  { value: 'FULL_DAY', label: 'Full Day' },
                  { value: 'FIRST_HALF', label: 'First Half (Morning)' },
                  { value: 'SECOND_HALF', label: 'Second Half (Evening)' },
                ]}
              />
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Approval Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${status === 'APPROVED' ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                <input
                  type="radio"
                  name="leave_status"
                  value="APPROVED"
                  checked={status === 'APPROVED'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-teal-500 focus:ring-teal-500"
                />
                <span>Approved</span>
              </label>
              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${status === 'PENDING' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                <input
                  type="radio"
                  name="leave_status"
                  value="PENDING"
                  checked={status === 'PENDING'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span>Pending Review</span>
              </label>
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason / Medical Notice
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending National Paediatric Cardiology Symposium in New Delhi"
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
              <span>{isEditing ? 'Update Leave' : 'Confirm Leave'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
