import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight,
  CheckCircle2, 
  ShieldCheck, 
  QrCode,
  MessageSquare, 
  Tv, 
  Zap,
  Cross,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

import { PILLARS, COMPARISONS, PRICING_PLANS } from '../data/marketingData';

export default function MarketingPage() {
  const { doctor } = useApp();

  // Typewriter states for first two lines
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [typingLine, setTypingLine] = useState(1);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Section scroll animation states
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef(null);

  const [qrVisible, setQrVisible] = useState(false);
  const qrRef = useRef(null);

  const [pricingVisible, setPricingVisible] = useState(false);
  const pricingRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('landing-page-snap');
    return () => {
      document.documentElement.classList.remove('landing-page-snap');
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === featuresRef.current) {
              setFeaturesVisible(true);
            }
            if (entry.target === qrRef.current) {
              setQrVisible(true);
            }
            if (entry.target === pricingRef.current) {
              setPricingVisible(true);
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (qrRef.current) observer.observe(qrRef.current);
    if (pricingRef.current) observer.observe(pricingRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const text1 = "Effortless clinic appointments";
    const text2 = "directly with your patients";
    let i = 0;
    let j = 0;
    let timer2;

    const timer1 = setInterval(() => {
      if (i < text1.length) {
        setLine1(text1.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer1);
        setTypingLine(2);
        setTimeout(() => {
          timer2 = setInterval(() => {
            if (j < text2.length) {
              setLine2(text2.substring(0, j + 1));
              j++;
            } else {
              clearInterval(timer2);
              setIsTypingComplete(true);
            }
          }, 45);
        }, 180);
      }
    }, 45);

    return () => {
      clearInterval(timer1);
      if (timer2) clearInterval(timer2);
    };
  }, []);

  return (
    <div className="relative w-full">
      
      {/* Section 1: Hero Section */}
      <section className="landing-section-snap h-screen w-full bg-gradient-to-b from-[#0B192C] via-[#071224] to-[#0B192C] text-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 pt-[88px] sm:pt-24 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-7 relative z-10 my-auto">
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl xl:text-[66px] font-normal not-italic tracking-tight leading-[1.2] text-white">
            <span className="block md:whitespace-nowrap min-h-[1.25em]">
              {line1}
            </span>
            <span className="text-teal-400 font-serif italic font-light text-3xl sm:text-4xl lg:text-5xl xl:text-6xl block pt-4 sm:pt-5 min-h-[1.25em]">
              {line2}
            </span>
          </h1>

          <p className={`text-base sm:text-xl text-slate-300 font-serif leading-relaxed max-w-2xl mx-auto pt-2 transition-all duration-700 ease-out ${
            isTypingComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>
            A simple, direct booking system for independent doctors and clinics. Share your personal booking link, keep your waiting room peaceful with live token queues, and send instant WhatsApp confirmations—completely commission-free.
          </p>

          <div className={`pt-2 flex items-center justify-center text-xs sm:text-sm text-slate-400 font-serif font-light transition-all duration-700 delay-200 ease-out ${
            isTypingComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>
            <span>Trusted by independent doctors and clinics across India</span>
          </div>
        </div>
      </section>

      {/* Section 2: Features / 4 Core Pillars */}
      <section 
        id="features" 
        ref={featuresRef}
        className="landing-section-snap h-screen w-full bg-slate-50 dark:bg-[#071224] text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 pt-[88px] sm:pt-24 pb-6 border-t border-slate-200/50 dark:border-white/10 relative overflow-hidden"
      >
        <div className="max-w-5xl mx-auto w-full space-y-8 lg:space-y-9 my-auto">
          <div className="text-center max-w-4xl mx-auto space-y-3">
            {/* The 4 Core Pillars with horizontal accent lines spanning to edges */}
            <div className="-translate-y-9 sm:-translate-y-11 mb-2 sm:mb-3">
              <div className={`flex items-center gap-4 w-full transition-all duration-700 ease-out ${
                featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <div className="flex-1 h-px bg-teal-500/30 dark:bg-teal-500/40" />
                <span className="text-xs sm:text-sm font-serif font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/80 px-4 py-1 rounded-full border border-teal-500/30 whitespace-nowrap">
                  The 4 Core Pillars
                </span>
                <div className="flex-1 h-px bg-teal-500/30 dark:bg-teal-500/40" />
              </div>
            </div>

            <div className={`space-y-2 transition-all duration-700 delay-150 ease-out ${
              featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal not-italic text-[#0B192C] dark:text-white tracking-tight md:whitespace-nowrap">
                Operating System for Independent Practices
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-serif leading-relaxed tracking-wide inline-block">
                Direct patient bookings, calm waiting rooms, zero commissions.
              </p>
            </div>
          </div>

          {/* 2 by 2 Text-Only Layout with Balanced Typographic Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16 gap-y-6 lg:gap-y-7">
            {PILLARS.map((p, idx) => {
              const isLeft = idx % 2 === 0;
              const delayClass = idx < 2 ? 'delay-500' : 'delay-700';
              const slideClass = isLeft 
                ? (featuresVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12')
                : (featuresVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12');

              return (
                <div 
                  key={idx} 
                  className={`space-y-1.5 border-l-2 border-teal-500/40 pl-5 transition-all duration-700 ease-out ${delayClass} ${slideClass}`}
                >
                  <h3 className="font-serif text-lg sm:text-xl font-normal text-[#0B192C] dark:text-white tracking-tight">
                    {p.title}
                  </h3>
                  <p className="font-serif text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Universal Doctor QR & Direct URL */}
      <section 
        id="doctor-qr" 
        ref={qrRef}
        className="landing-section-snap h-screen w-full bg-gradient-to-br from-[#0B192C] via-[#071224] to-[#132A4A] text-white flex flex-col justify-center items-center px-6 lg:px-16 pt-[88px] sm:pt-24 pb-6 border-t border-white/10 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
          
          {/* Left Column: Line-by-line highlights with balanced hierarchy */}
          <div className={`lg:col-span-7 space-y-5 sm:space-y-6 transition-all duration-700 ease-out ${
            qrVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
          }`}>
            
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[33px] xl:text-[36px] font-normal not-italic text-white tracking-tight leading-tight lg:whitespace-nowrap">
              Direct Booking Link & QR for Your Clinic
            </h2>
            
            <p className="text-sm sm:text-[15px] text-slate-300 font-serif leading-relaxed font-light max-w-xl">
              Print your QR on prescriptions, display it at reception, or share your booking link on WhatsApp. Patients book confirmed visits in 20 seconds—without downloading any app.
            </p>

            {/* Line by line points */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="font-serif text-sm sm:text-[15px] text-slate-200 font-normal">Zero app downloads for patients</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="font-serif text-sm sm:text-[15px] text-slate-200 font-normal">Instant sync into doctor dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="font-serif text-sm sm:text-[15px] text-slate-200 font-normal">Personal link like healthdock.care/{doctor.bookingSlug}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="font-serif text-sm sm:text-[15px] text-slate-200 font-normal">Dedicated booking link for each doctor</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/signup"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-serif font-normal text-xs sm:text-sm rounded-xl shadow-lg transition-all inline-flex items-center gap-2 hover:scale-[1.02]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Smartphone Mockup perfectly sized for the viewport */}
          <div className={`lg:col-span-5 flex justify-center items-center ${
            qrVisible ? 'anim-phone-scale-up' : 'opacity-0'
          }`}>
            <div className="relative w-[280px] sm:w-[300px] h-[510px] bg-slate-950 rounded-[44px] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.12)] border-2 border-slate-700/60 ring-1 ring-white/10 flex flex-col">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-teal-500/80 animate-pulse" />
              </div>

              {/* Inner Booking Screen */}
              <div className="w-full h-full bg-[#0B192C] rounded-[34px] overflow-hidden flex flex-col pt-7 px-4 pb-3 border border-white/5 relative">
                
                {/* Screen Clinic Header */}
                <div className="border-b border-white/10 pb-2.5 pt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-xs">
                      HD
                    </div>
                    <div>
                      <h4 className="text-xs font-normal text-white font-serif leading-tight">
                        {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                      </h4>
                      <p className="text-[10px] text-teal-400 font-sans">{doctor.specialty} • Open</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    Live
                  </span>
                </div>

                {/* Booking Pass Card with Embedded Scanner QR */}
                <div className="my-auto py-2 space-y-2.5">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center text-center space-y-1.5 backdrop-blur-sm shadow-inner">
                    <div className="flex items-center gap-1.5 text-[10px] font-normal text-teal-300 font-serif">
                      <QrCode className="w-3 h-3 text-teal-400" />
                      <span>Instant Booking Pass</span>
                    </div>

                    <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-md flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://healthdock.care/${doctor.bookingSlug}`)}`} 
                        alt="Doctor QR Code" 
                        className="w-full h-full object-contain" 
                      />
                    </div>

                    <p className="text-[10px] font-mono font-bold text-teal-300 tracking-tight">
                      healthdock.care/{doctor.bookingSlug}
                    </p>
                  </div>

                  {/* Slot Selection Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-300 font-serif font-normal">
                      <span>Available Slots Today</span>
                      <span className="text-teal-400 font-normal">Token #14</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="py-1.5 px-1.5 rounded-lg text-center text-[10px] font-normal bg-white/5 border border-white/10 text-slate-300">
                        05:30 PM
                      </div>
                      <div className="py-1.5 px-1.5 rounded-lg text-center text-[10px] font-normal bg-teal-500 text-white shadow-sm border border-teal-400">
                        05:45 PM
                      </div>
                      <div className="py-1.5 px-1.5 rounded-lg text-center text-[10px] font-normal bg-white/5 border border-white/10 text-slate-300">
                        06:00 PM
                      </div>
                    </div>
                  </div>

                  {/* Action Button inside Phone */}
                  <div className="w-full py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-serif font-normal text-[11px] rounded-xl shadow-md flex items-center justify-center gap-1.5">
                    <span>Confirm Slot & Token</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="w-20 h-1 bg-white/20 rounded-full mx-auto mt-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Why Doctors Switch / Comparison */}
      <section 
        id="comparison" 
        className="landing-section-snap h-screen w-full bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 pt-[88px] sm:pt-24 pb-6 border-t border-slate-200/50 dark:border-white/10 relative overflow-hidden"
      >
        <div className="max-w-6xl xl:max-w-7xl mx-auto w-full space-y-7 sm:space-y-8 my-auto">
          <div className="text-center max-w-4xl mx-auto space-y-3">
            {/* Why Doctors Switch with horizontal accent lines like The 4 Core Pillars */}
            <div className="flex items-center gap-4 w-full -translate-y-6 sm:-translate-y-8 mb-2 sm:mb-3">
              <div className="flex-1 h-px bg-teal-500/30 dark:bg-teal-500/40" />
              <span className="text-xs sm:text-sm font-serif font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/80 px-4 py-1 rounded-full border border-teal-500/30 whitespace-nowrap">
                Why Doctors Switch
              </span>
              <div className="flex-1 h-px bg-teal-500/30 dark:bg-teal-500/40" />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal not-italic text-[#0B192C] dark:text-white tracking-tight md:whitespace-nowrap">
              Marketplace Aggregators vs HealthDock
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-serif leading-relaxed font-light">
              Protect your clinical brand, patient loyalty, and consultation revenue.
            </p>
          </div>

          <div className="overflow-x-auto pt-1 sm:pt-2">
            <table className="w-full text-left border-collapse bg-white dark:bg-[#101927] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm shadow-sm font-serif">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                  <th className="p-4 sm:p-5 font-serif font-normal text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Feature</th>
                  <th className="p-4 sm:p-5 font-serif font-normal text-xs text-rose-500 uppercase tracking-wider whitespace-nowrap">Marketplace Aggregators</th>
                  <th className="p-4 sm:p-5 font-serif font-normal text-xs text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50/50 dark:bg-teal-950/20 whitespace-nowrap">
                    HealthDock Platform
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {COMPARISONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 sm:p-5 font-serif font-normal text-slate-800 dark:text-slate-100 whitespace-nowrap">{row.feature}</td>
                    <td className="p-4 sm:p-5 font-serif font-light text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.aggregator}</td>
                    <td className="p-4 sm:p-5 font-serif font-normal text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-950/10 whitespace-nowrap">
                      {row.healthdock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Transparent Pricing */}
      <section 
        id="pricing" 
        ref={pricingRef}
        className="landing-section-snap h-screen w-full bg-white dark:bg-[#071224] text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 pt-[88px] sm:pt-24 pb-6 border-t border-slate-200/60 dark:border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(20,184,166,0.06),rgba(255,255,255,0))] pointer-events-none" />

        {/* Pricing Content */}
        <div className="max-w-6xl xl:max-w-7xl mx-auto w-full space-y-5 sm:space-y-6 relative z-10 my-auto">
          <div className="text-center max-w-4xl mx-auto space-y-3">
            {/* Simple, Transparent Pricing badge with horizontal lines */}
            <div className="flex items-center gap-4 w-full -translate-y-3 sm:-translate-y-4 mb-1 sm:mb-2">
              <div className="flex-1 h-px bg-teal-500/30 dark:bg-teal-500/40" />
              <span className="text-xs sm:text-sm font-serif font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/80 px-4 py-1 rounded-full border border-teal-500/30 whitespace-nowrap">
                Simple, Transparent Pricing
              </span>
              <div className="flex-1 h-px bg-teal-500/30 dark:bg-teal-500/40" />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal not-italic text-[#0B192C] dark:text-white tracking-tight md:whitespace-nowrap">
              Fair, Flat Pricing for Your Medical Practice
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-serif leading-relaxed font-light">
              Pay a simple monthly fee for your clinic software. Keep 100% of your patient consultation fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 pt-1 [perspective:1200px]">
            {PRICING_PLANS.map((plan, idx) => {
              const flipClass = idx === 0 
                ? 'anim-card-flip-1' 
                : idx === 1 
                  ? 'anim-card-flip-2' 
                  : 'anim-card-flip-3';

              return (
                <div 
                  key={idx} 
                  className={`${
                    plan.popular 
                      ? 'bg-white dark:bg-[#101927] border-2 border-teal-500 shadow-xl relative ring-4 ring-teal-500/10' 
                      : 'bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-white/10 shadow-sm'
                  } p-5 sm:p-6 rounded-2xl space-y-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    pricingVisible ? flipClass : 'opacity-0'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-serif font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      Most Popular
                    </div>
                  )}
                  <div className="space-y-3">
                    <span className={`text-[11px] font-serif font-bold uppercase tracking-wider ${plan.popular ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {plan.tag}
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-normal text-[#0B192C] dark:text-white">{plan.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-serif font-light">{plan.desc}</p>
                    <div className="pt-1">
                      <span className="text-2xl sm:text-3xl font-serif font-normal text-[#0B192C] dark:text-white">{plan.price}</span>
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-serif font-light">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 pt-1 font-serif font-light">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/signup"
                      className={`w-full py-2.5 text-center font-serif font-normal text-xs sm:text-sm rounded-xl transition-all block ${
                        plan.popular 
                          ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:scale-[1.01]' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {plan.btnText}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6: Dedicated Footer Section */}
      <section 
        id="footer" 
        className="landing-section-snap h-screen w-full bg-[#0B192C] text-white flex flex-col justify-between items-center px-6 sm:px-10 lg:px-16 xl:px-20 pt-[88px] sm:pt-24 pb-6 border-t border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(20,184,166,0.1),rgba(255,255,255,0))] pointer-events-none" />

        {/* Full-width distributed main content */}
        <div className="w-full max-w-[1536px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-24 items-center relative z-10 my-auto py-6">
          
          {/* Brand Info (Spans 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="w-9 h-9 rounded-md bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 flex-shrink-0">
                <Cross className="w-4.5 h-4.5 stroke-[2.8]" />
              </div>
              <h3 className="font-serif font-normal not-italic text-white tracking-tight whitespace-nowrap flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl lg:text-4xl">HealthDock</span>
                <span className="text-sm sm:text-base lg:text-lg font-light text-slate-300">Appointment</span>
              </h3>
            </div>

            <p className="font-serif text-xs sm:text-sm text-slate-300 font-light leading-[2] sm:leading-[2.2] tracking-wide max-w-lg">
              Independent OPD appointment software, live waiting room queue engine, and DPDP 2026 compliance hub for modern Indian healthcare practices.
            </p>

            {/* 4 Social Icons Horizontally */}
            <div className="flex items-center gap-2.5 pt-1">
              <a 
                href="#facebook" 
                aria-label="Facebook" 
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 flex items-center justify-center transition-all hover:scale-105"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a 
                href="#linkedin" 
                aria-label="LinkedIn" 
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 flex items-center justify-center transition-all hover:scale-105"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a 
                href="#instagram" 
                aria-label="Instagram" 
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 flex items-center justify-center transition-all hover:scale-105"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a 
                href="#twitter" 
                aria-label="Twitter" 
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 flex items-center justify-center transition-all hover:scale-105"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>

            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-serif font-normal shadow-sm">
                <span>🇮🇳 100% In-Country Data Residency</span>
              </div>
            </div>
          </div>

          {/* Navigation & Contact Columns: 2 by 2 Layout (Spans 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-10 lg:gap-x-14 gap-y-7 lg:gap-y-8 pt-2">
            
            {/* Top Left: Product */}
            <div className="space-y-3">
              <h4 className="font-serif text-base sm:text-lg font-normal text-white tracking-tight pb-2 border-b border-white/10">
                Product
              </h4>
              <ul className="space-y-2.5 font-serif text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                <li><a href="#features" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">Features Showcase</a></li>
                <li><a href="#doctor-qr" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">Doctor QR Booking</a></li>
                <li><a href="#features" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">WhatsApp Automation</a></li>
                <li><span className="text-slate-400">Integrations Hub</span></li>
              </ul>
            </div>

            {/* Top Right: Solutions */}
            <div className="space-y-3">
              <h4 className="font-serif text-base sm:text-lg font-normal text-white tracking-tight pb-2 border-b border-white/10">
                Solutions
              </h4>
              <ul className="space-y-2.5 font-serif text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                <li><a href="#pricing" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">Pricing & Plans</a></li>
                <li><a href="#pricing" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">Hospital Enterprise</a></li>
                <li><span className="text-slate-400">Specialty Practices</span></li>
                <li><Link to="/login" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">Doctor Dashboard</Link></li>
              </ul>
            </div>

            {/* Bottom Left: Contact Us */}
            <div className="space-y-3">
              <h4 className="font-serif text-base sm:text-lg font-normal text-white tracking-tight pb-2 border-b border-white/10">
                Contact Us
              </h4>
              <ul className="space-y-2.5 font-serif text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                <li>
                  <span className="text-slate-300">Rosedale, New Town, Kolkata - 700156</span>
                </li>
                <li>
                  <a href="tel:9875587234" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">
                    9875587234
                  </a>
                </li>
              </ul>
            </div>

            {/* Bottom Right: Support */}
            <div className="space-y-3">
              <h4 className="font-serif text-base sm:text-lg font-normal text-white tracking-tight pb-2 border-b border-white/10">
                Support
              </h4>
              <ul className="space-y-2.5 font-serif text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                <li>
                  <a href="mailto:info@healthdock.org" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">
                    info@healthdock.org
                  </a>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-teal-300 hover:translate-x-1 transition-all inline-block">
                    Live Walkthrough
                  </Link>
                </li>
                <li>
                  <span className="text-slate-400">DPDP 2026 Helpdesk</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Full-width Bottom Bar */}
        <div className="w-full max-w-[1536px] mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 font-serif font-light text-xs text-slate-400">
          <div>
            © 2026 HealthDock Technologies Pvt Ltd. All rights reserved. Built for Indian Healthcare.
          </div>
          <div>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
          </div>
        </div>
      </section>
    </div>
  );
}
