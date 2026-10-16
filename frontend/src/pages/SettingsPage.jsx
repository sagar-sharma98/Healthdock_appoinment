import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  ShieldCheck,
  CreditCard,
  Key,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { doctor, triggerToast } = useApp();

  const [activeTab, setActiveTab] = useState('general');
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [clinicName, setClinicName] = useState('HealthDock Specialty Clinic');
  const [supportEmail, setSupportEmail] = useState('contact@healthdock.in');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Plot 42, Health Street, Sector 18, Medical Enclave, Delhi NCR');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST +5:30)');

  // Notification settings
  const [enableWhatsapp, setEnableWhatsapp] = useState(true);
  const [enableSms, setEnableSms] = useState(true);
  const [enableDoctorDigest, setEnableDoctorDigest] = useState(true);

  // Payment settings
  const [upiId, setUpiId] = useState('healthdock@okhdfcbank');
  const [allowPayAtClinic, setAllowPayAtClinic] = useState(true);
  const [allowOnlineUpi, setAllowOnlineUpi] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    if (triggerToast) {
      triggerToast('Settings Saved', 'Practice configuration updated successfully.', 'success');
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white">
              Practice Settings
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Clinic Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your clinic identity, notification triggers, and payment configurations.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-xs font-semibold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Changes Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'general', label: 'Clinic Profile', icon: Building2 },
          { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
          { id: 'payments', label: 'Payments & UPI', icon: CreditCard },
          { id: 'dpdp', label: 'Privacy & DPDP Act', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Clinic Profile */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3">
            Clinic Details & Identification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Clinic / Practice Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Support / Helpline Phone
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Official Clinic Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Standard Timezone
              </label>
              <input
                type="text"
                value={timezone}
                disabled
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Clinic Physical Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>
      )}

      {/* Tab 2: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3">
            Patient Notification Channels
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Instant WhatsApp Passes
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Send confirmed token, doctor timings, and live tracking pass via WhatsApp.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableWhatsapp}
                onChange={(e) => setEnableWhatsapp(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  SMS Fallback
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deliver SMS if the patient does not have WhatsApp active on their mobile number.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableSms}
                onChange={(e) => setEnableSms(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Daily Morning Schedule Digest
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Email doctors a daily schedule briefing at 8:00 AM with booked appointments.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableDoctorDigest}
                onChange={(e) => setEnableDoctorDigest(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3">
            Payment Collection Methods
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Clinic UPI ID (for Direct QR Payments)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pay at Reception (Cash / POS)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Allow patients to confirm token online and settle consultation fee at the clinic desk.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowPayAtClinic}
                onChange={(e) => setAllowPayAtClinic(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Online Instant UPI Payment
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Display dynamic UPI QR code on step 7 of booking for contactless fee collection.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowOnlineUpi}
                onChange={(e) => setAllowOnlineUpi(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: DPDP Compliance */}
      {activeTab === 'dpdp' && (
        <div className="bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <ShieldCheck className="w-5 h-5 text-teal-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              India DPDP Act 2026 Compliance Standard
            </h2>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            HealthDock automatically enforces digital consent logging for every patient appointment.
            Patients are presented with clear, plain-language consent notices before booking confirmation,
            and all records are cryptographically timestamped in your PostgreSQL cloud database.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Active Protections:</p>
            <p>✓ Granular consent for appointment notifications vs promotional updates</p>
            <p>✓ Patient right to modify communication preferences at any time</p>
            <p>✓ Zero 3rd-party data sharing or competing medical advertisements</p>
          </div>
        </div>
      )}
    </div>
  );
}
