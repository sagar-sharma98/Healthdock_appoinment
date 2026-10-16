import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  Clock,
  Tv,
  MessageSquare,
  HelpCircle,
  X,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UpgradePage() {
  const { doctor, triggerToast } = useApp();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePlan, setActivePlan] = useState('Free Starter');

  const plans = [
    {
      id: 'starter',
      name: 'Free Starter',
      tag: 'Basic Setup',
      desc: 'Everything required to get your first clinical booking link live today.',
      priceMonthly: 0,
      priceYearly: 0,
      popular: false,
      isCurrent: activePlan === 'Free Starter',
      ctaText: 'Current Plan',
      features: [
        '1 Doctor booking page (/your-name)',
        'Up to 100 patient visits / month',
        'Standard booking link & QR scanner',
        'Morning & Evening shift scheduler',
        'Pay-at-clinic token confirmation',
        'Reception booking desk view',
      ],
      missing: [
        'Automated WhatsApp token passes',
        'Waiting room TV display',
        'Multi-doctor clinic staff accounts',
        'Custom clinic branding removal',
      ],
    },
    {
      id: 'pro',
      name: 'Professional Practice',
      tag: 'Most Popular',
      desc: 'Ideal for busy individual specialists who want zero missed appointments and fast queue check-in.',
      priceMonthly: 1499,
      priceYearly: 1199,
      popular: true,
      isCurrent: activePlan === 'Professional Practice',
      ctaText: 'Upgrade to Professional',
      features: [
        'Unlimited patient visits & tokens',
        'Instant WhatsApp booking pass with live directions',
        'Automated queue delay alerts to waiting patients',
        'Online contactless UPI QR payments',
        'Advanced page themes (Glassmorphic, Pill, Retro)',
        'Full DPDP Act 2026 digital consent logging',
        'Holiday & doctor leave scheduling engine',
        '0% booking commission (Keep 100% of fees)',
      ],
      missing: [
        'Waiting room TV token display screen',
        'Multiple associate doctor profiles',
      ],
    },
    {
      id: 'clinic',
      name: 'Multi-Doctor Clinic',
      tag: 'For Medical Centres',
      desc: 'For multi-speciality clinics, polyclinics, and diagnostic centres with shared front-desk staff.',
      priceMonthly: 3499,
      priceYearly: 2799,
      popular: false,
      isCurrent: activePlan === 'Multi-Doctor Clinic',
      ctaText: 'Upgrade Clinic Plan',
      features: [
        'Up to 10 Doctor & specialist accounts',
        'Waiting Room TV token display screen',
        'Multi-branch clinic locations management',
        'Shared receptionist dashboard with role permissions',
        'Automated daily schedule digest to doctors',
        'Priority 24/7 WhatsApp clinical support',
        'Dedicated onboarding & staff training session',
        'Custom domain setup (appointments.yourclinic.com)',
      ],
      missing: [],
    },
  ];

  const handleSelectPlan = (plan) => {
    if (plan.name === activePlan) return;
    setSelectedPlanModal(plan);
  };

  const handleConfirmUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setActivePlan(selectedPlanModal.name);
      if (triggerToast) {
        triggerToast('Plan Upgraded!', `Your practice has been upgraded to ${selectedPlanModal.name}.`, 'success');
      }
      setSelectedPlanModal(null);
    }, 1200);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>HealthDock Appointment Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-[#0B192C] dark:text-white tracking-tight">
          Simple, Transparent Clinical Pricing
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Zero per-patient commission cuts. You own 100% of your patient records and patient relationships.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="pt-3 flex items-center justify-center gap-3">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'bg-gradient-to-b from-teal-500/[0.08] to-white dark:to-[#101927] border-2 border-teal-500 shadow-xl shadow-teal-500/10'
                  : 'bg-white dark:bg-[#101927] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-teal-500 text-white text-[11px] font-bold tracking-wide shadow-md shadow-teal-500/25">
                  ★ MOST POPULAR
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 font-mono">
                    {plan.tag}
                  </span>
                  {plan.isCurrent && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Active Plan
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white mt-1">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                  {plan.desc}
                </p>

                {/* Price Display */}
                <div className="mt-5 pb-5 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-1.5">
                  {price === 0 ? (
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                        ₹{price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        / doctor / month
                      </span>
                    </>
                  )}
                </div>

                {/* Features List */}
                <div className="py-5 space-y-2.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    What is included:
                  </p>
                  <ul className="space-y-2 text-xs">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <Check className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.missing.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-400 dark:text-slate-600 line-through">
                        <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300 dark:text-slate-700" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={plan.isCurrent}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  plan.isCurrent
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/25 active:scale-98'
                    : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white active:scale-98'
                }`}
              >
                {plan.isCurrent ? 'Current Active Plan' : plan.ctaText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
        <div className="space-y-1">
          <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            0% Per-Booking Cut
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Never pay ₹200–₹400 aggregator commission cuts per patient.
          </p>
        </div>

        <div className="space-y-1">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            100% Patient Ownership
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Your patient phone numbers and records remain yours. We never show competitor ads.
          </p>
        </div>

        <div className="space-y-1">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-2">
            <CreditCard className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Cancel Anytime
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            No lock-in contracts. Switch between monthly or annual billing at any time.
          </p>
        </div>
      </div>

      {/* Upgrade Checkout Simulation Modal */}
      {selectedPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPlanModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#0E1624] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-left select-none space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPlanModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-[#0B192C] dark:text-white">
                  Confirm Plan Upgrade
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upgrading to {selectedPlanModal.name}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Plan:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPlanModal.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Billing Cycle:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[11px]">{billingCycle}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">Amount:</span>
                <span className="font-extrabold text-base text-teal-600 dark:text-teal-400 font-mono">
                  ₹{(billingCycle === 'yearly' ? selectedPlanModal.priceYearly : selectedPlanModal.priceMonthly).toLocaleString()} / mo
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Instant activation for doctor booking passes & unlimited visits.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlanModal(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmUpgrade}
                className="py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-xs font-semibold text-white shadow-md shadow-teal-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <span>Activating...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Confirm & Activate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
