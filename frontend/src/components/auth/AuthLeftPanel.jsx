import React from 'react';
import { Cross, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0B192C] via-[#071224] to-[#132A4A] p-8 xl:p-12 text-white flex-col justify-between relative overflow-hidden h-screen max-h-screen font-serif">
      
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Logo */}
      <div className="relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 group-hover:scale-105 transition-transform">
            <Cross className="w-5 h-5 stroke-[2.8]" />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              HealthDock
            </span>
          </div>
        </Link>
      </div>

      {/* Middle Content: Elegantly filled and spaced across the left panel width (Zero Scroll) */}
      <div className="relative z-10 space-y-8 my-auto w-full max-w-2xl xl:max-w-3xl py-6">
        <div className="space-y-6">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[38px] xl:text-[46px] font-light italic tracking-normal leading-tight text-white/90 whitespace-nowrap -translate-y-6 sm:-translate-y-8">
            Effortless clinic appointments.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-serif leading-relaxed pt-2 max-w-2xl">
            Focus on patient care, not endless phone calls. Let your patients book visits in seconds, keep waiting rooms peaceful with live tokens, and send automated WhatsApp reminders.
          </p>
        </div>

        {/* 3 Human-written, Practical Highlights with comfortable width */}
        <div className="space-y-3 pt-2 text-sm sm:text-[15px] text-slate-300 font-serif font-light">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <span className="font-light text-slate-300">A dedicated booking link to easily share with patients</span>
          </div>

          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <span className="font-light text-slate-300">Live token numbers to prevent crowded waiting rooms</span>
          </div>

          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <span className="font-light text-slate-300">Instant WhatsApp confirmations and timely visit reminders</span>
          </div>
        </div>
      </div>

      {/* Bottom Privacy & Security Badge */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-white/10 font-serif">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict Patient Data Privacy (DPDP)</span>
        </div>
        <span>100% Confidential & Secure</span>
      </div>
    </div>
  );
}
