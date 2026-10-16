import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
  ArrowRight,
  Lock,
  MessageSquare,
  FileText,
  Moon,
  Sun,
  Cross,
  Send,
  Check,
  ExternalLink,
  X,
} from 'lucide-react';

import CustomCalendarPicker from '../components/common/CustomCalendarPicker';
import CustomDropdown from '../components/common/CustomDropdown';
import { getTheme } from '../utils/themeConstants';

export default function PublicBookingPage() {
  const { slug } = useParams();

  // Dark mode for patient booking page
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', isDark);

    return () => {
      // Restore dashboard theme when leaving public booking page
      const savedTheme = localStorage.getItem('healthdock_theme') || 'light';
      const shouldBeDark = savedTheme === 'dark';
      document.documentElement.classList.toggle('dark', shouldBeDark);
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.body.classList.toggle('dark', shouldBeDark);
    };
  }, [theme]);

  // Page data & loading state
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState('');

  // Sync color mode from booking page configuration
  useEffect(() => {
    const mode = pageData?.page?.color_mode;
    if (mode === 'Dark') {
      setTheme('dark');
    } else if (mode === 'System') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      // Default to Light theme for patient booking
      setTheme('light');
    }
  }, [pageData]);

  const pageTheme = getTheme(pageData?.page?.theme || 'Modern Minimal');

  // Current Step: 1 to 7, plus 'CONFIRMED'
  // Step 1: Doctor info & welcome
  // Step 2: Mobile & OTP
  // Step 3: Visit type & branch
  // Step 4: Pick date & slot
  // Step 5: Patient details (Myself / Family)
  // Step 6: Privacy & Consent
  // Step 7: Payment
  // Step 8: Confirmed Appointment & Consent Settings
  const [step, setStep] = useState(1);

  // Form State
  // Step 2: Contact & OTP
  const [bookerName, setBookerName] = useState('');
  const [bookerPhone, setBookerPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpHint, setOtpHint] = useState('');

  // Step 3: Visit mode & branch
  const [consultationMode, setConsultationMode] = useState('IN_PERSON');
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Step 4: Date & Slot
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedShift, setSelectedShift] = useState('MORNING');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotBlockReason, setSlotBlockReason] = useState('');

  // Step 5: Patient Details
  const [bookingFor, setBookingFor] = useState('MYSELF'); // 'MYSELF' or 'FAMILY_MEMBER'
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [familyRelation, setFamilyRelation] = useState('Parent');
  const [consultationReason, setConsultationReason] = useState('');

  // Step 6: Privacy & Consent
  const [dpdpConsentAgreed, setDpdpConsentAgreed] = useState(true);
  const [optionalEducationalAgreed, setOptionalEducationalAgreed] = useState(false);
  const [commPrefs, setCommPrefs] = useState({
    confirmations: true,
    reminders: true,
    rescheduling: true,
    education: false,
    promotions: false,
  });
  const [privacyPolicyModalOpen, setPrivacyPolicyModalOpen] = useState(false);

  // Step 7: Payment
  const [paymentMethod, setPaymentMethod] = useState('PAY_AT_CLINIC'); // 'PAY_AT_CLINIC' or 'ONLINE_UPI_QR'
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Step 8: Confirmation & Stored Consent Records
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [liveWhatsappToggle, setLiveWhatsappToggle] = useState(true);
  const [marketingConsentActive, setMarketingConsentActive] = useState(false);
  const [updatingConsent, setUpdatingConsent] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Load public booking page data
  useEffect(() => {
    async function fetchPage() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE_URL}/api/public/booking/${slug}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load booking page');
        }
        setPageData(data);
        if (data.branches && data.branches.length > 0) {
          setSelectedBranch(data.branches[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      fetchPage();
    }
  }, [slug]);

  // Fetch slots whenever date or shift changes in Step 4
  useEffect(() => {
    async function loadSlots() {
      if (!slug || !selectedDate) return;
      try {
        setSlotsLoading(true);
        setSlotBlockReason('');
        setSelectedSlot(null);
        const res = await fetch(
          `${API_BASE_URL}/api/public/booking/${slug}/slots?date=${selectedDate}&shift=${selectedShift}`
        );
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.is_blocked) {
            setSlotBlockReason(data.block_reason || 'Doctor unavailable on this date');
            setSlots([]);
          } else {
            setSlots(data.slots || []);
          }
        } else {
          setSlots([]);
        }
      } catch (e) {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    if (step === 4) {
      loadSlots();
    }
  }, [slug, selectedDate, selectedShift, step]);

  // Handlers for OTP
  const handleSendOtp = async () => {
    setOtpError('');
    if (!bookerPhone || bookerPhone.trim().length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    try {
      setOtpSending(true);
      const res = await fetch(`${API_BASE_URL}/api/public/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: bookerPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true);
      setOtpHint(`Demo OTP: ${data.dev_otp}`);
      setOtpCode(data.dev_otp || '');
    } catch (e) {
      setOtpError(e.message);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtpAndNext = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!bookerName.trim()) {
      setOtpError('Please enter your full name');
      return;
    }

    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Please enter the verification OTP');
      return;
    }

    try {
      setOtpVerifying(true);
      const res = await fetch(`${API_BASE_URL}/api/public/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: bookerPhone, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      setOtpVerified(true);
      setStep(3); // Proceed to visit type & branch
    } catch (e) {
      setOtpError(e.message);
    } finally {
      setOtpVerifying(false);
    }
  };

  // Submit Booking
  const handleFinalBookingSubmit = async () => {
    try {
      setIsSubmittingBooking(true);
      setError('');

      const payload = {
        booker_name: bookerName.trim(),
        booker_phone: bookerPhone.trim(),
        booking_for: bookingFor,
        patient_name: bookingFor === 'FAMILY_MEMBER' ? patientName.trim() : bookerName.trim(),
        patient_age: patientAge ? parseInt(patientAge, 10) : null,
        family_relation: bookingFor === 'FAMILY_MEMBER' ? familyRelation : null,
        reason: consultationReason.trim() || 'General consultation',
        consultation_mode: consultationMode,
        branch_name: selectedBranch ? selectedBranch.name : 'Main Clinic - Sector 18',
        appointment_date: selectedDate,
        start_time: selectedSlot.start_time,
        payment_method: paymentMethod,
        whatsapp_updates_enabled: commPrefs.confirmations || commPrefs.reminders,
        consent_agreed: dpdpConsentAgreed,
        marketing_consent: optionalEducationalAgreed,
        comm_prefs: commPrefs,
      };

      const res = await fetch(`${API_BASE_URL}/api/public/booking/${slug}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete appointment booking');
      }

      setConfirmedBooking(data.appointment);
      setLiveWhatsappToggle(data.appointment.whatsapp_updates_enabled);
      setMarketingConsentActive(Boolean(optionalEducationalAgreed));
      setStep(8); // Confirmation step
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Immediate toggle of Marketing Consent preference on confirmed page
  const handleToggleMarketingPreference = async (targetVal) => {
    if (!confirmedBooking) return;
    try {
      setUpdatingConsent(true);
      const res = await fetch(`${API_BASE_URL}/api/public/appointments/${confirmedBooking.id}/consent-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketing_consent: targetVal,
          consent_type: 'EDUCATIONAL_MARKETING',
          is_granted: targetVal,
        }),
      });
      if (res.ok) {
        setMarketingConsentActive(targetVal);
        showToast(targetVal ? 'Educational & marketing updates enabled!' : 'Marketing consent withdrawn.');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to update consent preferences');
    } finally {
      setUpdatingConsent(false);
    }
  };

  // Calculate reminder date text (24h before appointment, e.g. "29 Sep")
  const getReminderDateText = () => {
    if (!confirmedBooking?.appointment_date) return '24 hours prior';
    try {
      const aptDate = new Date(confirmedBooking.appointment_date);
      aptDate.setDate(aptDate.getDate() - 1);
      return aptDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '24 hours prior';
    }
  };

  // Immediate toggle of WhatsApp & Consent settings on confirmed page
  const handleToggleWhatsappPreference = async () => {
    if (!confirmedBooking) return;
    const nextVal = !liveWhatsappToggle;
    setLiveWhatsappToggle(nextVal);
    try {
      setUpdatingConsent(true);
      const res = await fetch(`${API_BASE_URL}/api/public/appointments/${confirmedBooking.id}/consent-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_updates_enabled: nextVal,
          consent_type: 'WHATSAPP_NOTIFICATION',
          is_granted: nextVal,
        }),
      });
      if (res.ok) {
        showToast(nextVal ? 'WhatsApp notifications enabled!' : 'WhatsApp notifications disabled.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingConsent(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#071224] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-serif text-slate-600 dark:text-slate-300">Loading booking schedule...</p>
      </div>
    );
  }

  if (error && !pageData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#071224] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-[#0B192C] dark:text-white mb-2">Booking Page Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6">{error}</p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md shadow-teal-500/20 transition-all"
        >
          Return to HealthDock
        </Link>
      </div>
    );
  }

  const { doctor, page, branches = [] } = pageData;

  // Dynamic Corner Radius Classes across all elements
  const getRadiusClass = (type = 'card') => {
    const radius = page?.corner_radius || 'Rounded';
    if (radius === 'Sharp') {
      return 'rounded-none';
    }
    if (radius === 'Pill') {
      if (type === 'button') return 'rounded-full';
      if (type === 'input') return 'rounded-full px-5';
      if (type === 'textarea') return 'rounded-2xl';
      if (type === 'sm') return 'rounded-full';
      if (type === 'box') return 'rounded-2xl';
      return 'rounded-3xl'; // card
    }
    // Rounded (default)
    if (type === 'button') return 'rounded-xl';
    if (type === 'input') return 'rounded-xl';
    if (type === 'textarea') return 'rounded-xl';
    if (type === 'sm') return 'rounded-xl';
    if (type === 'box') return 'rounded-2xl';
    return 'rounded-3xl'; // card
  };

  // Button background style (solid vs gradient)
  const getBtnBgStyle = () => {
    if (page?.button_style === 'Gradient') {
      return {
        background: `linear-gradient(135deg, ${pageTheme.primary}, ${pageTheme.hover || pageTheme.primary})`,
        color: '#ffffff',
      };
    }
    return {
      backgroundColor: pageTheme.primary,
      color: '#ffffff',
    };
  };

  // Card surface finish
  const getCardFinishClass = () => {
    if (page?.card_finish === 'Glassmorphic') {
      return 'backdrop-blur-xl bg-white/85 dark:bg-[#101927]/85 border border-white/60 dark:border-slate-800/80 shadow-2xl';
    }
    return 'bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 shadow-xl';
  };

  const isSplitLayout = page?.layout_style === 'SPLIT_2_COL' && step === 1;

  return (
    <div 
      className="min-h-screen text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between selection:bg-teal-500 selection:text-white transition-all duration-300"
      style={{
        backgroundColor: theme === 'dark' ? '#071224' : '#F8FAFC',
        background:
          page?.bg_style === 'Mesh Gradient'
            ? `radial-gradient(circle at 50% 18%, ${pageTheme.primary}22, ${theme === 'dark' ? '#071224' : '#F8FAFC'} 70%)`
            : page?.bg_style === 'Dot Grid'
            ? `${theme === 'dark' ? '#071224' : '#F8FAFC'} radial-gradient(${theme === 'dark' ? '#334155' : '#cbd5e1'} 1px, transparent 1px)`
            : (theme === 'dark' ? '#071224' : '#F8FAFC'),
        backgroundSize: page?.bg_style === 'Dot Grid' ? '20px 20px' : undefined,
      }}
    >
      {/* Dynamic Theme Styles for Inputs, Checkboxes & Elements */}
      <style>{`
        .theme-input {
          transition: all 0.2s ease;
        }
        .theme-input:focus, .theme-input:focus-within {
          border-color: ${pageTheme.primary} !important;
          box-shadow: 0 0 0 3px ${pageTheme.primary}28 !important;
          outline: none !important;
        }
        .theme-accent {
          accent-color: ${pageTheme.primary} !important;
        }
      `}</style>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div 
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 ${getRadiusClass('box')} text-white text-xs font-semibold shadow-xl animate-in slide-in-from-bottom-2 duration-150`}
          style={{ backgroundColor: pageTheme.primary }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}



      {/* Main Booking Container */}
      <main className={`flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center transition-all duration-200 ${
        isSplitLayout ? 'max-w-4xl' : 'max-w-2xl'
      }`}>

        {/* ========================================================
            STEP 1: DOCTOR INFO & WELCOME (INITIAL LANDING)
           ======================================================== */}
        {step === 1 && (
          <div className={`overflow-hidden ${getRadiusClass('card')} ${getCardFinishClass()} animate-in fade-in zoom-in-95 duration-200`}>
            
            {/* Cover Banner if configured */}
            {page.cover_banner_url && (
              <div className="w-full h-32 sm:h-44 overflow-hidden relative">
                <img src={page.cover_banner_url} alt="Clinic Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            )}

            <div className={`p-6 sm:p-8 ${
              isSplitLayout ? 'grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left' : 'text-center space-y-6'
            }`}>
              
              {/* Left Column in Split / Top in Centered */}
              <div className={isSplitLayout ? 'md:col-span-7 space-y-5' : 'space-y-6'}>
                
                {/* Doctor Picture / Logo with custom logo_shape */}
                <div className={`flex flex-col ${isSplitLayout ? 'items-start' : 'items-center'} ${page.cover_banner_url ? '-mt-16 sm:-mt-20 relative z-10' : ''}`}>
                  <div className="relative">
                    {(() => {
                      const logoShape = page.logo_shape || 'Rounded';
                      let shapeClasses = 'rounded-full aspect-square w-24 h-24 sm:w-28 sm:h-28';
                      if (logoShape === 'Square') shapeClasses = 'rounded-none aspect-square w-24 h-24 sm:w-28 sm:h-28';
                      else if (logoShape === 'Circle') shapeClasses = 'rounded-full aspect-square w-24 h-24 sm:w-28 sm:h-28';
                      else if (logoShape === 'Rectangle') shapeClasses = 'rounded-2xl aspect-[16/9] w-36 h-24 sm:w-44 sm:h-28';
                      else shapeClasses = 'rounded-3xl aspect-square w-24 h-24 sm:w-28 sm:h-28';

                      const displayImg = page.logo_url || doctor.avatar_url;

                      return (
                        <div 
                          className={`border-4 flex items-center justify-center font-serif font-bold text-3xl shadow-xl overflow-hidden ${shapeClasses}`}
                          style={{ 
                            backgroundColor: `${pageTheme.primary}15`, 
                            borderColor: `${pageTheme.primary}40`, 
                            color: pageTheme.primary 
                          }}
                        >
                          {displayImg ? (
                            <img src={displayImg} alt={doctor.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{doctor.name?.charAt(0)?.toUpperCase() || 'D'}</span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#101927] flex items-center justify-center text-white" title="Doctor Available">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  {/* Name & Specialty */}
                  <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#0B192C] dark:text-white mt-4 tracking-tight">
                    {page.page_name || doctor.name}
                  </h1>
                  <p className="text-xs font-semibold tracking-wide mt-1 uppercase" style={{ color: pageTheme.primary }}>
                    {doctor.specialty} • {doctor.qualification}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {doctor.experience_years}+ years clinical experience • {page.organization_name}
                  </p>
                </div>

                {/* Welcome message from backend description */}
                <div className={`p-4 ${getRadiusClass('box')} bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 ${isSplitLayout ? 'text-left' : 'text-center'}`}>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-serif leading-relaxed italic">
                    "{page.description || 'Welcome to the appointment, please book your appointment.'}"
                  </p>
                </div>

              </div>

              {/* Right Column in Split / Bottom in Centered */}
              <div className={isSplitLayout ? 'md:col-span-5 space-y-5 md:border-l md:border-slate-200/60 dark:md:border-slate-800/60 md:pl-8' : 'space-y-6'}>
                
                {/* Quick Consultation highlights */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className={`p-3.5 ${getRadiusClass('box')} border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 flex items-center gap-2.5`}>
                    <Clock className="w-4 h-4 flex-shrink-0" style={{ color: pageTheme.primary }} />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Consultation Fee</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">₹{doctor.consultation_fee}</span>
                    </div>
                  </div>
                  <div className={`p-3.5 ${getRadiusClass('box')} border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 flex items-center gap-2.5`}>
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: pageTheme.primary }} />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Data Protection</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">DPDP 2026 Safe</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: Book Now */}
                <button
                  type="button"
                  id="btn-book-now"
                  onClick={() => setStep(2)}
                  style={getBtnBgStyle()}
                  className={`w-full py-4 px-6 ${getRadiusClass('button')} active:scale-[0.99] text-white text-sm font-semibold shadow-xl flex items-center justify-center gap-2 transition-all hover:opacity-95`}
                >
                  <span>Book Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: MOBILE NUMBER & OTP VERIFICATION (ON SAME PAGE)
           ======================================================== */}
        {step === 2 && (
          <div className={`${getRadiusClass('card')} ${getCardFinishClass()} p-6 sm:p-8 space-y-6 animate-in fade-in duration-200`}>
            
            {/* Header with Back button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Doctor Info</span>
              </button>
              <span className="text-[11px] font-mono font-semibold" style={{ color: pageTheme.primary }}>Step 1 of 5</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                Enter your details to proceed
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We'll verify your mobile number to send confirmed booking tokens & digital prescriptions.
              </p>
            </div>

            {otpError && (
              <div className={`p-3 ${getRadiusClass('box')} bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndNext} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={bookerName}
                    onChange={(e) => setBookerName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 ${getRadiusClass('input')} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 theme-input`}
                  />
                </div>
              </div>

              {/* Mobile Number & Send OTP Button on Same Page */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="98765 43210"
                      value={bookerPhone}
                      onChange={(e) => setBookerPhone(e.target.value.replace(/\D/g, ''))}
                      className={`w-full pl-12 pr-4 py-2.5 ${getRadiusClass('input')} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 theme-input font-mono`}
                    />
                  </div>
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending || bookerPhone.length < 10}
                      className={`px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold ${getRadiusClass('button')} border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 flex items-center gap-1.5`}
                    >
                      {otpSending ? <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: pageTheme.primary }} /> : <Send className="w-3.5 h-3.5" />}
                      <span>Get OTP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* OTP Field appears on the same form once button is clicked */}
              {otpSent && (
                <div 
                  className={`p-4 ${getRadiusClass('box')} border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200`}
                  style={{
                    backgroundColor: `${pageTheme.primary}12`,
                    borderColor: `${pageTheme.primary}35`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold" style={{ color: pageTheme.primary }}>
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{ color: pageTheme.primary }}
                      className="text-[11px] hover:underline font-semibold"
                    >
                      Resend OTP
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{
                      borderColor: `${pageTheme.primary}50`,
                      color: pageTheme.primary,
                    }}
                    className={`w-full tracking-widest text-center py-2.5 ${getRadiusClass('input')} border bg-white dark:bg-slate-900 text-sm font-bold font-mono theme-input`}
                  />
                  {otpHint && (
                    <p className="text-[10px] text-center font-medium" style={{ color: pageTheme.primary }}>
                      {otpHint} (Auto-filled for demonstration)
                    </p>
                  )}
                </div>
              )}

              {/* Next Button */}
              <button
                type="submit"
                id="btn-otp-next"
                disabled={otpVerifying || (otpSent && !otpCode)}
                style={getBtnBgStyle()}
                className={`w-full py-3 px-6 ${getRadiusClass('button')} active:scale-[0.99] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 hover:opacity-95`}
              >
                <span>{otpSent ? (otpVerifying ? 'Verifying...' : 'Next') : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================
            STEP 3: CONSULTATION MODE & BRANCH
           ======================================================== */}
        {step === 3 && (
          <div className={`${getRadiusClass('card')} ${getCardFinishClass()} p-6 sm:p-8 space-y-6 animate-in fade-in duration-200`}>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-mono font-semibold" style={{ color: pageTheme.primary }}>Step 2 of 5</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                How would you like to consult?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose between visiting the clinic in person or connecting via secure online video.
              </p>
            </div>

            {/* In-Person vs Online Video */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div
                onClick={() => setConsultationMode('IN_PERSON')}
                style={
                  consultationMode === 'IN_PERSON'
                    ? {
                        borderColor: pageTheme.primary,
                        backgroundColor: `${pageTheme.primary}10`,
                        boxShadow: `0 4px 16px ${pageTheme.primary}18`,
                      }
                    : {}
                }
                className={`p-4 ${getRadiusClass('box')} border-2 cursor-pointer transition-all ${
                  consultationMode === 'IN_PERSON'
                    ? 'text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div 
                  className={`w-10 h-10 ${getRadiusClass('sm')} flex items-center justify-center mb-3 transition-colors ${
                    consultationMode === 'IN_PERSON'
                      ? ''
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  style={
                    consultationMode === 'IN_PERSON'
                      ? {
                          backgroundColor: `${pageTheme.primary}20`,
                          color: pageTheme.primary,
                        }
                      : {}
                  }
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white">In-Person Visit</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Physical clinic consultation with token queue at reception.
                </p>
              </div>

              <div
                onClick={() => setConsultationMode('ONLINE_VIDEO')}
                style={
                  consultationMode === 'ONLINE_VIDEO'
                    ? {
                        borderColor: pageTheme.primary,
                        backgroundColor: `${pageTheme.primary}10`,
                        boxShadow: `0 4px 16px ${pageTheme.primary}18`,
                      }
                    : {}
                }
                className={`p-4 ${getRadiusClass('box')} border-2 cursor-pointer transition-all ${
                  consultationMode === 'ONLINE_VIDEO'
                    ? 'text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div 
                  className={`w-10 h-10 ${getRadiusClass('sm')} flex items-center justify-center mb-3 transition-colors ${
                    consultationMode === 'ONLINE_VIDEO'
                      ? ''
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  style={
                    consultationMode === 'ONLINE_VIDEO'
                      ? {
                          backgroundColor: `${pageTheme.primary}20`,
                          color: pageTheme.primary,
                        }
                      : {}
                  }
                >
                  <Video className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white">Online Video Call</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Connect via encrypted HD video link sent to your mobile.
                </p>
              </div>
            </div>

            {/* Select Branch */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Clinic Branch <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBranch(b)}
                    style={
                      selectedBranch?.id === b.id
                        ? {
                            borderColor: pageTheme.primary,
                            backgroundColor: `${pageTheme.primary}08`,
                          }
                        : {}
                    }
                    className={`p-3.5 ${getRadiusClass('box')} border cursor-pointer transition-all flex items-start gap-3 ${
                      selectedBranch?.id === b.id
                        ? 'text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <MapPin 
                      className="w-4 h-4 mt-0.5 flex-shrink-0" 
                      style={selectedBranch?.id === b.id ? { color: pageTheme.primary } : { color: '#94a3b8' }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{b.name}</span>
                        {selectedBranch?.id === b.id && (
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pageTheme.primary }} />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{b.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory DPDP Act 2026 short text in the bottom */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                🔒 <span className="font-semibold" style={{ color: pageTheme.primary }}>100% DPDP Act 2026 Privacy Guaranteed.</span> Your medical data is never shared with third-party advertisers.
              </p>
            </div>

            {/* Next Button */}
            <button
              type="button"
              id="btn-branch-next"
              onClick={() => setStep(4)}
              style={getBtnBgStyle()}
              className={`w-full py-3 px-6 ${getRadiusClass('button')} text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all hover:opacity-95`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================
            STEP 4: PICK DATE & SLOT
           ======================================================== */}
        {step === 4 && (
          <div className={`${getRadiusClass('card')} ${getCardFinishClass()} p-6 sm:p-8 space-y-6 animate-in fade-in duration-200`}>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-mono font-semibold" style={{ color: pageTheme.primary }}>Step 3 of 5</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                Pick a Date & Time Slot
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose your preferred consultation date, then select morning or evening shift.
              </p>
            </div>

            {/* Date Picker using CustomCalendarPicker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Date <span className="text-rose-500">*</span>
              </label>
              <CustomCalendarPicker
                selectedDate={selectedDate}
                primaryColor={pageTheme.primary}
                cornerRadius={page?.corner_radius || 'Rounded'}
                onChange={(newDate) => {
                  if (newDate && newDate !== 'ALL') {
                    setSelectedDate(newDate);
                  }
                }}
                className="w-full"
              />
            </div>

            {/* Shift Selector: Morning Shift vs Evening Shift */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Shift
              </label>
              <div className={`grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 ${getRadiusClass('box')} border border-slate-200 dark:border-slate-700`}>
                <button
                  type="button"
                  onClick={() => setSelectedShift('MORNING')}
                  style={selectedShift === 'MORNING' ? { color: pageTheme.primary } : {}}
                  className={`py-2 px-3 ${getRadiusClass('sm')} text-xs font-semibold transition-all ${
                    selectedShift === 'MORNING'
                      ? 'bg-white dark:bg-[#101927] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🌅 Morning (9 AM – 1 PM)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShift('EVENING')}
                  style={selectedShift === 'EVENING' ? { color: pageTheme.primary } : {}}
                  className={`py-2 px-3 ${getRadiusClass('sm')} text-xs font-semibold transition-all ${
                    selectedShift === 'EVENING'
                      ? 'bg-white dark:bg-[#101927] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🌆 Evening (2 PM – 6 PM)
                </button>
              </div>
            </div>

            {/* Available Slots Grid */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Available Time Slots
              </label>

              {slotsLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: pageTheme.primary }} />
                  <span className="text-xs">Fetching real-time slots...</span>
                </div>
              ) : slotBlockReason ? (
                <div className={`p-4 ${getRadiusClass('box')} bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs text-center space-y-1`}>
                  <p className="font-semibold">{slotBlockReason}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Please choose another date or switch shift.</p>
                </div>
              ) : slots.length === 0 ? (
                <div className={`py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 ${getRadiusClass('box')}`}>
                  No slots configured for this shift.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((s) => {
                    const isSelected = selectedSlot?.start_time === s.start_time;
                    const isBooked = !s.is_available;
                    const startTimeOnly = s.short_label || s.start_time;

                    return (
                      <button
                        key={s.start_time}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setSelectedSlot(s)}
                        style={
                          isSelected
                            ? (page?.button_style === 'Gradient'
                                ? getBtnBgStyle()
                                : { backgroundColor: pageTheme.primary, color: '#ffffff', borderColor: pageTheme.primary })
                            : {}
                        }
                        className={`py-2.5 px-2 text-xs ${getRadiusClass('sm')} font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isBooked
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800/60 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'font-bold shadow-md scale-[1.02]'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <span className={`font-mono text-xs ${isBooked ? 'line-through' : ''}`}>
                          {startTimeOnly}
                        </span>
                        {isBooked && (
                          <span className="text-[9px] font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                            Booked
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              type="button"
              id="btn-slot-next"
              disabled={!selectedSlot}
              onClick={() => setStep(5)}
              style={getBtnBgStyle()}
              className={`w-full py-3 px-6 ${getRadiusClass('button')} text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-95`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================
            STEP 5: PATIENT DETAILS PAGE (MYSELF / FAMILY MEMBER)
           ======================================================== */}
        {step === 5 && (
          <div className={`${getRadiusClass('card')} ${getCardFinishClass()} p-6 sm:p-8 space-y-6 animate-in fade-in duration-200`}>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-mono font-semibold" style={{ color: pageTheme.primary }}>Step 4 of 5</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                Patient Consultation Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Who is this medical consultation appointment for?
              </p>
            </div>

            {/* Pre-filled Booker field */}
            <div className={`p-3.5 ${getRadiusClass('box')} bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs`}>
              <div className="flex items-center gap-2.5">
                <div 
                  className={`w-7 h-7 ${getRadiusClass('sm')} flex items-center justify-center font-bold`}
                  style={{ backgroundColor: `${pageTheme.primary}18`, color: pageTheme.primary }}
                >
                  {bookerName.charAt(0) || 'U'}
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">{bookerName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">+91 {bookerPhone}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 ${getRadiusClass('sm')} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800`}>
                Verified Booker
              </span>
            </div>

            {/* Two Switch Tabs: Myself vs Family Member */}
            <div className="space-y-4 pt-1">
              <div className={`grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 ${getRadiusClass('box')} border border-slate-200 dark:border-slate-700`}>
                <button
                  type="button"
                  onClick={() => setBookingFor('MYSELF')}
                  style={bookingFor === 'MYSELF' ? { color: pageTheme.primary } : {}}
                  className={`py-2 px-3 ${getRadiusClass('sm')} text-xs font-semibold transition-all ${
                    bookingFor === 'MYSELF'
                      ? 'bg-white dark:bg-[#101927] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  👤 Myself
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFor('FAMILY_MEMBER')}
                  style={bookingFor === 'FAMILY_MEMBER' ? { color: pageTheme.primary } : {}}
                  className={`py-2 px-3 ${getRadiusClass('sm')} text-xs font-semibold transition-all ${
                    bookingFor === 'FAMILY_MEMBER'
                      ? 'bg-white dark:bg-[#101927] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  👨‍👩‍👧 Family Member
                </button>
              </div>

              {/* Tab 1: Myself */}
              {bookingFor === 'MYSELF' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Age <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 29"
                      min={1}
                      max={120}
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className={`w-full px-4 py-2.5 ${getRadiusClass('input')} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 theme-input`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Reason for Consultation / Symptoms
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe health concerns, symptoms, or reason for appointment..."
                      value={consultationReason}
                      onChange={(e) => setConsultationReason(e.target.value)}
                      className={`w-full px-4 py-2.5 ${getRadiusClass('textarea')} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 theme-input`}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Family Member */}
              {bookingFor === 'FAMILY_MEMBER' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Family Member's Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Verma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className={`w-full px-4 py-2.5 ${getRadiusClass('input')} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 theme-input`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Patient Age <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 58"
                        min={1}
                        max={120}
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className={`w-full px-4 py-2.5 ${getRadiusClass('input')} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 theme-input`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Relationship <span className="text-rose-500">*</span>
                      </label>
                      <CustomDropdown
                        value={familyRelation}
                        onChange={(val) => setFamilyRelation(val)}
                        radiusClass={getRadiusClass('input')}
                        activeColor={pageTheme.primary}
                        options={[
                          { value: 'Parent', label: 'Parent (Father / Mother)' },
                          { value: 'Spouse', label: 'Spouse (Husband / Wife)' },
                          { value: 'Child', label: 'Child (Son / Daughter)' },
                          { value: 'Sibling', label: 'Sibling (Brother / Sister)' },
                          { value: 'Other', label: 'Other Family Member' },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Reason for Consultation / Symptoms
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe health concerns, symptoms, or reason for appointment..."
                      value={consultationReason}
                      onChange={(e) => setConsultationReason(e.target.value)}
                      className={`w-full px-4 py-2.5 ${getRadiusClass('textarea')} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 theme-input`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Button text: Next: Privacy & Consent */}
            <button
              type="button"
              id="btn-patient-next"
              disabled={bookingFor === 'FAMILY_MEMBER' && (!patientName.trim() || !patientAge)}
              onClick={() => setStep(6)}
              style={getBtnBgStyle()}
              className={`w-full py-3 px-6 ${getRadiusClass('button')} text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-95`}
            >
              <span>Next: Privacy & Consent</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================
            STEP 6: PRIVACY & CONSENT
           ======================================================== */}
        {step === 6 && (
          <div className={`${getRadiusClass('card')} ${getCardFinishClass()} p-6 sm:p-8 space-y-6 animate-in fade-in duration-200`}>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-mono font-semibold" style={{ color: pageTheme.primary }}>Step 5 of 5</span>
            </div>

            {/* 1. Clinic Privacy Notice (v1.0) Card */}
            <div className={`p-5 ${getRadiusClass('box')} border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shadow-sm space-y-3.5`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: pageTheme.primary }} />
                  <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                    Clinic Privacy Notice (v1.0)
                  </h3>
                </div>
                <span 
                  className={`px-2.5 py-0.5 ${getRadiusClass('sm')} text-[10px] font-semibold border`}
                  style={{ backgroundColor: `${pageTheme.primary}15`, color: pageTheme.primary, borderColor: `${pageTheme.primary}35` }}
                >
                  DPDP Notice
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">What personal information is being collected:</span>{' '}
                    Name, mobile number (+91), age, gender, appointment preferences, and clinical complaints.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Why it is being collected:</span>{' '}
                    For scheduling, OPD queue management, clinical consultation, and GST tax invoicing.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">How it will be used:</span>{' '}
                    Stored securely inside Indian cloud servers (AWS Mumbai); never sold or shared with commercial aggregators.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Who may have access to it:</span>{' '}
                    Treating doctor ({doctor?.name || 'Dr. Sagar Sharma'}), clinic front desk, and authorized nursing staff.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">How you can withdraw consent:</span>{' '}
                    You may modify or withdraw optional communications at any time via the patient dashboard or clinic desk.
                  </div>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setPrivacyPolicyModalOpen(true)}
                  style={{ color: pageTheme.primary }}
                  className="font-semibold text-xs inline-flex items-center gap-1 hover:underline transition-colors"
                >
                  <span>View full Clinic Privacy Policy</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Mandatory Consent Checkbox Card */}
            <label
              style={
                dpdpConsentAgreed
                  ? { borderColor: pageTheme.primary, backgroundColor: `${pageTheme.primary}08` }
                  : {}
              }
              className={`block p-4 ${getRadiusClass('box')} border-2 cursor-pointer transition-all ${
                dpdpConsentAgreed
                  ? ''
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={dpdpConsentAgreed}
                  onChange={(e) => setDpdpConsentAgreed(e.target.checked)}
                  style={{ accentColor: pageTheme.primary }}
                  className="mt-0.5 w-4 h-4 rounded cursor-pointer flex-shrink-0"
                />
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white">
                    I agree to the processing of my personal information
                  </span>{' '}
                  for the purpose of scheduling and managing my appointment, as described in the Privacy Notice.{' '}
                  <span className="text-rose-500 font-bold">*</span>
                </p>
              </div>
            </label>

            {/* 3. Optional Educational Consent Checkbox Card */}
            <label
              style={
                optionalEducationalAgreed
                  ? { borderColor: `${pageTheme.primary}80`, backgroundColor: `${pageTheme.primary}08` }
                  : {}
              }
              className={`block p-4 ${getRadiusClass('box')} border cursor-pointer transition-all ${
                optionalEducationalAgreed
                  ? ''
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={optionalEducationalAgreed}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setOptionalEducationalAgreed(val);
                    setCommPrefs((prev) => ({
                      ...prev,
                      education: val,
                      promotions: val,
                    }));
                  }}
                  style={{ accentColor: pageTheme.primary }}
                  className="mt-0.5 w-4 h-4 rounded cursor-pointer flex-shrink-0"
                />
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white">Optional:</span>{' '}
                  I would like to receive health-related information, educational material and updates from the clinic through WhatsApp/email.
                </p>
              </div>
            </label>

            {/* 4. Communication Preferences Card */}
            <div className={`p-5 ${getRadiusClass('box')} border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h4 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                  Communication Preferences
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">WhatsApp & SMS</span>
              </div>

              <div className="space-y-2">
                {/* 1. Appointment confirmations (Essential, checked, locked) */}
                <div className={`p-3 ${getRadiusClass('sm')} bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between`}>
                  <label className="flex items-center gap-2.5 cursor-not-allowed opacity-90 select-none">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      style={{ accentColor: pageTheme.primary }}
                      className="w-4 h-4 rounded cursor-not-allowed"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Appointment confirmations
                    </span>
                  </label>
                  <span 
                    className={`px-2.5 py-0.5 ${getRadiusClass('sm')} text-[10px] font-bold border`}
                    style={{ backgroundColor: `${pageTheme.primary}15`, color: pageTheme.primary, borderColor: `${pageTheme.primary}35` }}
                  >
                    Essential
                  </span>
                </div>

                {/* 2. Appointment reminders (checked by default, 24h / 2h) */}
                <div className={`p-3 ${getRadiusClass('sm')} bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between`}>
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                    <input
                      type="checkbox"
                      checked={commPrefs.reminders}
                      onChange={(e) => setCommPrefs((prev) => ({ ...prev, reminders: e.target.checked }))}
                      style={{ accentColor: pageTheme.primary }}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Appointment reminders
                    </span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    24h / 2h
                  </span>
                </div>

                {/* 3. Cancellation/rescheduling notifications (checked by default, Instant) */}
                <div className={`p-3 ${getRadiusClass('sm')} bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between`}>
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                    <input
                      type="checkbox"
                      checked={commPrefs.rescheduling}
                      onChange={(e) => setCommPrefs((prev) => ({ ...prev, rescheduling: e.target.checked }))}
                      style={{ accentColor: pageTheme.primary }}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Cancellation/rescheduling notifications
                    </span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Instant
                  </span>
                </div>

                {/* 4. Health education and newsletters (optional) */}
                <div className={`p-3 ${getRadiusClass('sm')} bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between`}>
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                    <input
                      type="checkbox"
                      checked={commPrefs.education}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCommPrefs((prev) => ({ ...prev, education: checked }));
                        if (checked) setOptionalEducationalAgreed(true);
                      }}
                      style={{ accentColor: pageTheme.primary }}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Health education and newsletters
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Optional
                  </span>
                </div>

                {/* 5. Promotional communications (optional) */}
                <div className={`p-3 ${getRadiusClass('sm')} bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between`}>
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                    <input
                      type="checkbox"
                      checked={commPrefs.promotions}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCommPrefs((prev) => ({ ...prev, promotions: checked }));
                        if (checked) setOptionalEducationalAgreed(true);
                      }}
                      style={{ accentColor: pageTheme.primary }}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Promotional communications
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Optional
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: Proceed to Payment */}
            <button
              type="button"
              id="btn-consent-next"
              disabled={!dpdpConsentAgreed}
              onClick={() => setStep(7)}
              style={getBtnBgStyle()}
              className={`w-full py-3.5 px-6 ${getRadiusClass('button')} active:scale-[0.99] text-white text-xs font-semibold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-95`}
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================
            STEP 7: PAYMENT DETAILS & METHOD
           ======================================================== */}
        {step === 7 && (
          <div className={`${getRadiusClass('card')} ${getCardFinishClass()} p-6 sm:p-8 space-y-6 animate-in fade-in duration-200`}>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(6)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-mono font-semibold" style={{ color: pageTheme.primary }}>Final Step</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                Review & Confirm Booking
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review appointment details and select payment method to finalize booking.
              </p>
            </div>

            {/* Booking Summary Card */}
            <div className={`p-4 ${getRadiusClass('box')} bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Doctor</span>
                <span className="font-semibold text-slate-900 dark:text-white">{doctor.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Patient</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {bookingFor === 'FAMILY_MEMBER' ? `${patientName} (${familyRelation})` : bookerName}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Date & Slot</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {selectedDate} at {selectedSlot?.short_label || selectedSlot?.label || selectedSlot?.start_time}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Consultation Type</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {consultationMode === 'IN_PERSON' ? 'In-Person Visit' : 'Online Video Call'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-200">Total Consultation Fee</span>
                <span className="font-mono text-base" style={{ color: pageTheme.primary }}>₹{doctor.consultation_fee}</span>
              </div>
            </div>

            {/* Two Payment Options: UPI/QR vs Pay at Clinic Reception */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Payment Method
              </label>

              <div
                onClick={() => setPaymentMethod('ONLINE_UPI_QR')}
                style={
                  paymentMethod === 'ONLINE_UPI_QR'
                    ? { borderColor: pageTheme.primary, backgroundColor: `${pageTheme.primary}10` }
                    : {}
                }
                className={`p-3.5 ${getRadiusClass('box')} border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'ONLINE_UPI_QR'
                    ? ''
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-8 h-8 ${getRadiusClass('sm')} flex items-center justify-center`}
                    style={{ backgroundColor: `${pageTheme.primary}18`, color: pageTheme.primary }}
                  >
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-white">UPI / Instant QR Code</h5>
                    <p className="text-[10px] text-slate-400">GPay, PhonePe, Paytm, or Cards (Razorpay)</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono" style={{ color: pageTheme.primary }}>₹{doctor.consultation_fee}</span>
              </div>

              <div
                onClick={() => setPaymentMethod('PAY_AT_CLINIC')}
                style={
                  paymentMethod === 'PAY_AT_CLINIC'
                    ? { borderColor: pageTheme.primary, backgroundColor: `${pageTheme.primary}10` }
                    : {}
                }
                className={`p-3.5 ${getRadiusClass('box')} border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'PAY_AT_CLINIC'
                    ? ''
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-8 h-8 ${getRadiusClass('sm')} flex items-center justify-center`}
                    style={{ backgroundColor: `${pageTheme.primary}18`, color: pageTheme.primary }}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-white">Pay at Clinic Reception</h5>
                    <p className="text-[10px] text-slate-400">Pay cash or card when arriving at the clinic counter</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 ${getRadiusClass('sm')} bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium`}>
                  On Arrival
                </span>
              </div>
            </div>

            {/* Confirm Appointment Button */}
            <button
              type="button"
              id="btn-confirm-appointment"
              disabled={isSubmittingBooking}
              onClick={handleFinalBookingSubmit}
              style={getBtnBgStyle()}
              className={`w-full py-3.5 px-6 ${getRadiusClass('button')} active:scale-[0.99] text-white text-xs font-semibold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-95`}
            >
              {isSubmittingBooking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Confirming Appointment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Book Appointment</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================
            STEP 8: CONFIRMATION DISPLAY & STORED CONSENT RECORDS
           ======================================================== */}
        {step === 8 && confirmedBooking && (
          <div className={`${getRadiusClass('card')} ${getCardFinishClass()} p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200`}>
            
            {/* Top Confirmed Icon & Message */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${pageTheme.primary}18`, color: pageTheme.primary }}
              >
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0B192C] dark:text-white">
                Appointment Successfully Booked!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Your consultation token is confirmed and recorded in the clinic system.
              </p>
            </div>

            {/* Token Badge Card with dynamic Theme Gradient */}
            <div 
              className={`p-5 ${getRadiusClass('box')} text-white shadow-xl relative overflow-hidden`}
              style={{ background: `linear-gradient(135deg, ${pageTheme.primary}, ${pageTheme.hover || pageTheme.primary})` }}
            >
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-80 block">
                    DAILY QUEUE TOKEN
                  </span>
                  <span className="text-4xl font-extrabold font-mono tracking-tight block mt-0.5">
                    {confirmedBooking.daily_token || '#01'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-80 block">
                    BOOKING REF
                  </span>
                  <span className="text-sm font-bold font-mono block">
                    {confirmedBooking.booking_reference}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs relative z-10">
                <div>
                  <span className="text-[10px] opacity-75 block">Doctor</span>
                  <span className="font-semibold">{confirmedBooking.doctor_name || doctor.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] opacity-75 block">Date & Time</span>
                  <span className="font-semibold font-mono">
                    {confirmedBooking.formatted_date || confirmedBooking.appointment_date?.slice(0, 10)} at {confirmedBooking.start_time?.slice(0, 5)}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. WhatsApp Pass Sent Notification Banner */}
            <div 
              className={`p-4 ${getRadiusClass('box')} border flex items-start gap-3 shadow-sm`}
              style={{ backgroundColor: `${pageTheme.primary}10`, borderColor: `${pageTheme.primary}30` }}
            >
              <div 
                className={`w-8 h-8 ${getRadiusClass('sm')} flex items-center justify-center flex-shrink-0 mt-0.5`}
                style={{ backgroundColor: `${pageTheme.primary}18`, color: pageTheme.primary }}
              >
                <MessageSquare className="w-4 h-4" />
              </div>
              <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-100">
                <span className="font-bold" style={{ color: pageTheme.primary }}>WhatsApp Pass Sent:</span>{' '}
                Digital pass & live queue tracking link dispatched to{' '}
                <span className="font-bold font-mono">
                  +91 {confirmedBooking.booker_phone || bookerPhone}
                </span>
                . A 24-hour reminder will be sent on {getReminderDateText()}.
              </p>
            </div>

            {/* 2. Stored Consent Records Card */}
            <div className={`p-5 ${getRadiusClass('box')} border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: pageTheme.primary }} />
                  <h4 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                    Stored Consent Records
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Notice v1.0</span>
              </div>

              <div className="space-y-2.5">
                {/* Row 1: Appointment Processing */}
                <div className={`p-3.5 ${getRadiusClass('sm')} bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between`}>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Appointment Processing
                  </span>
                  <span 
                    className={`px-2.5 py-0.5 ${getRadiusClass('sm')} text-[10px] font-bold border`}
                    style={{ backgroundColor: `${pageTheme.primary}18`, color: pageTheme.primary, borderColor: `${pageTheme.primary}40` }}
                  >
                    ACTIVE (v1.0)
                  </span>
                </div>

                {/* Row 2: 24h Reminders & Alerts */}
                <div className={`p-3.5 ${getRadiusClass('sm')} bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between`}>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    24h Reminders & Alerts
                  </span>
                  <span 
                    className={`px-2.5 py-0.5 ${getRadiusClass('sm')} text-[10px] font-bold border`}
                    style={{ backgroundColor: `${pageTheme.primary}18`, color: pageTheme.primary, borderColor: `${pageTheme.primary}40` }}
                  >
                    ACTIVE (v1.0)
                  </span>
                </div>

                {/* Row 3: Educational / Marketing */}
                <div className={`p-3.5 ${getRadiusClass('sm')} bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between`}>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Educational / Marketing
                  </span>
                  {marketingConsentActive ? (
                    <span 
                      className={`px-2.5 py-0.5 ${getRadiusClass('sm')} text-[10px] font-bold border`}
                      style={{ backgroundColor: `${pageTheme.primary}18`, color: pageTheme.primary, borderColor: `${pageTheme.primary}40` }}
                    >
                      OPT-IN
                    </span>
                  ) : (
                    <span className={`px-2.5 py-0.5 ${getRadiusClass('sm')} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700`}>
                      WITHDRAWN
                    </span>
                  )}
                </div>
              </div>

              {/* Withdraw Marketing Consent Button */}
              {marketingConsentActive ? (
                <button
                  type="button"
                  id="btn-withdraw-marketing"
                  onClick={() => handleToggleMarketingPreference(false)}
                  disabled={updatingConsent}
                  className={`w-full py-2.5 px-4 ${getRadiusClass('button')} border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all disabled:opacity-50 text-center`}
                >
                  {updatingConsent ? 'Updating...' : 'Withdraw Marketing Consent'}
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-optin-marketing"
                  onClick={() => handleToggleMarketingPreference(true)}
                  disabled={updatingConsent}
                  style={{ borderColor: `${pageTheme.primary}60`, color: pageTheme.primary, backgroundColor: `${pageTheme.primary}10` }}
                  className={`w-full py-2.5 px-4 ${getRadiusClass('button')} border hover:opacity-90 text-xs font-bold transition-all disabled:opacity-50 text-center`}
                >
                  {updatingConsent ? 'Updating...' : 'Opt Back In to Educational Updates'}
                </button>
              )}
            </div>

            {/* Actions: Book Another Appointment */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                id="btn-book-another"
                onClick={() => {
                  setStep(1);
                  setConfirmedBooking(null);
                  setSelectedSlot(null);
                  setPatientName('');
                  setPatientAge('');
                  setConsultationReason('');
                }}
                className={`flex-1 py-3 px-5 ${getRadiusClass('button')} bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0B192C] dark:text-white text-xs font-bold transition-all text-center shadow-sm`}
              >
                Book Another Appointment
              </button>
              <Link
                to="/"
                style={getBtnBgStyle()}
                className={`flex-1 py-3 px-5 ${getRadiusClass('button')} text-white text-xs font-semibold shadow-md transition-all text-center flex items-center justify-center`}
              >
                Done
              </Link>
            </div>
          </div>
        )}

      </main>

      {/* Full Clinic Privacy Policy Modal */}
      {privacyPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-500" />
                <h3 className="font-serif font-bold text-base text-[#0B192C] dark:text-white">
                  Clinic Privacy Policy (v1.0)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyPolicyModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-[11px] font-medium border border-teal-200 dark:border-teal-800/60">
                🔒 Compliant with the Digital Personal Data Protection Act (DPDP Act) 2026 of India.
              </div>

              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">1. Data Fiduciary & Treating Doctor</h5>
                <p>
                  Your healthcare data is managed by <strong>{doctor?.name || 'Dr. Sagar Sharma'}</strong> and <strong>{pageData?.page?.organization_name || 'HealthDock Medical Practice'}</strong>. We act as the Data Fiduciary under the provisions of the DPDP Act 2026.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">2. Purpose of Collection & Processing</h5>
                <p>
                  Personal and health information (including name, mobile number, age, gender, appointment preferences, and clinical complaints) is collected strictly for clinical diagnosis, issuing digital prescriptions, OPD queue sequencing, and mandatory GST invoicing.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">3. Storage & Security</h5>
                <p>
                  All patient records are encrypted at rest (AES-256) and in transit (TLS 1.3), hosted on secure Indian cloud infrastructure (AWS Mumbai Region). Your data is never sold, leased, or shared with third-party advertisers or commercial aggregators.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">4. Your DPDP Act Rights & Consent Withdrawal</h5>
                <p>
                  You hold the absolute right to review your stored records, request rectification of inaccuracies, and withdraw optional communication consents (e.g., educational updates or newsletters) at any time through the clinic desk or online interface.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPrivacyPolicyModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition-all text-center"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!page?.remove_branding && (
        <footer className="py-4 px-6 text-center text-[11px] text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80">
          Powered by <span className="font-serif font-bold text-slate-600 dark:text-slate-300">HealthDock</span> Independent Practice Infrastructure • 100% DPDP 2026 Compliant
        </footer>
      )}

    </div>
  );
}
