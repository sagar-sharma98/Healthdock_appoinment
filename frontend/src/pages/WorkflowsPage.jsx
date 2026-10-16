import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  MessageSquare,
  Clock,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Plus,
} from 'lucide-react';

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState('All');

  const workflows = [
    {
      id: 'wf-1',
      title: 'Instant WhatsApp Booking Confirmation',
      desc: 'Dispatches confirmed token number, clinic address, and digital appointment pass to the patient as soon as booking is completed.',
      trigger: 'On Appointment Confirmed',
      channel: 'WhatsApp Cloud API',
      enabled: true,
      category: 'Booking',
    },
    {
      id: 'wf-2',
      title: '2-Hour Advance Slot Reminder',
      desc: 'Sends automated reminder alert with one-tap Google Maps directions and token check-in instructions.',
      trigger: '2 Hours Before Appointment',
      channel: 'WhatsApp + SMS Fallback',
      enabled: true,
      category: 'Reminders',
    },
    {
      id: 'wf-3',
      title: 'OPD Queue Delay Broadcast',
      desc: 'When an emergency case causes a doctor to run behind, automatically broadcasts delay notices to subsequent patients in line.',
      trigger: 'Triggered by Reception / Doctor',
      channel: 'WhatsApp Live Queue',
      enabled: true,
      category: 'Queue',
    },
    {
      id: 'wf-4',
      title: 'Post-Consultation Prescription & Feedback',
      desc: 'Transmits digital PDF prescription and invites the patient to leave a 5-star Google review for the clinic.',
      trigger: 'Status Marked Completed',
      channel: 'WhatsApp + Email',
      enabled: false,
      category: 'Follow-up',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white">
              Automated Workflows
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Automation Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure automated WhatsApp notifications, queue delay alerts, and patient follow-up pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/bookings"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-teal-500" />
            <span>View Bookings</span>
          </Link>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Rule</span>
          </button>
        </div>
      </div>

      {/* Hero Notice Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/25">
            <GitBranch className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Default WhatsApp Automation is Active
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              HealthDock automatically triggers instant WhatsApp booking passes and token details whenever a patient schedules online.
              Advanced conditional branching and custom SMS gateways will be editable in the upcoming automation update.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 self-end md:self-auto flex-shrink-0">
          Standard Triggers: On
        </span>
      </div>

      {/* Workflows List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Pre-configured Clinical Triggers ({workflows.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {wf.title}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {wf.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
                    {wf.desc}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                    <span>Trigger: <strong className="text-slate-600 dark:text-slate-300">{wf.trigger}</strong></span>
                    <span>•</span>
                    <span>Channel: <strong className="text-teal-600 dark:text-teal-400">{wf.channel}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    wf.enabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {wf.enabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Note */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-500" />
          <span>All patient communications strictly adhere to <strong>India DPDP Act 2026</strong> opt-in consent protocols.</span>
        </div>
        <Link to="/settings" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
          View Consent Settings &rarr;
        </Link>
      </div>
    </div>
  );
}
