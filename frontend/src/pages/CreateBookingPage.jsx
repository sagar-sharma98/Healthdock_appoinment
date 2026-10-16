import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  Video,
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Lock,
  Stethoscope,
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Calendar as CalendarIcon,
  GitBranch,
  Settings,
  CalendarOff,
  Sun,
  Moon,
  Users,
  Cross,
  QrCode,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CustomCalendarPicker from '../components/common/CustomCalendarPicker';
import CustomDropdown from '../components/common/CustomDropdown';

function format12Hour(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
}

export default function CreateBookingPage() {
  const navigate = useNavigate();
  const { doctor: contextDoctor, theme, toggleTheme } = useApp();

  // Current logged in user info
  const [userProfile, setUserProfile] = useState({
    name: contextDoctor?.name || 'sagar sharma',
    email: contextDoctor?.email || 'sagarsharma9882@gmail.com',
  });

  // Step state (1 to 7)
  const [step, setStep] = useState(1);

  // Doctors in the logged-in account
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Step 2: Patient Mobile & Verification
  const [bookerName, setBookerName] = useState('');
  const [bookerPhone, setBookerPhone] = useState('');
  const [bookerEmail, setBookerEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Step 3: Consultation Mode & Branch
  const [consultationMode, setConsultationMode] = useState('IN_PERSON'); // 'IN_PERSON' | 'ONLINE_VIDEO'
  const [selectedBranch, setSelectedBranch] = useState('Main Medical Campus, Sector 44');

  // Step 4: Date & Slot Selection
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedShift, setSelectedShift] = useState('MORNING');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotBlockReason, setSlotBlockReason] = useState(null);

  // Step 5: Patient Details
  const [bookingFor, setBookingFor] = useState('MYSELF'); // 'MYSELF' | 'FAMILY_MEMBER'
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('MALE');
  const [familyRelation, setFamilyRelation] = useState('Child');
  const [patientAddress, setPatientAddress] = useState('');
  const [consultationReason, setConsultationReason] = useState('');

  // Step 6: DPDP Consent & Communication preferences
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

  // Step 7: Payment Method
  const [paymentMethod, setPaymentMethod] = useState('PAY_AT_CLINIC'); // 'PAY_AT_CLINIC' | 'ONLINE_UPI_QR'

  // Step 8: Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load User Info
  useEffect(() => {
    const savedUser = localStorage.getItem('healthdock_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUserProfile((prev) => ({
          ...prev,
          name: u.full_name || prev.name,
          email: u.email || prev.email,
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 1. Fetch doctors belonging to the logged-in user account
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
        const userStr = localStorage.getItem('healthdock_user') || localStorage.getItem('user');
        let currentUser = null;
        try {
          currentUser = userStr ? JSON.parse(userStr) : null;
        } catch (e) {}

        const params = new URLSearchParams();
        if (currentUser?.id) params.append('userId', currentUser.id);
        if (currentUser?.organization_id || currentUser?.organizationId) {
          params.append('organizationId', currentUser.organization_id || currentUser.organizationId);
        }

        const res = await fetch(`${API_BASE_URL}/api/doctor/availability/overview?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.doctors && data.doctors.length > 0) {
            setDoctorsList(data.doctors);
            setSelectedDoctor(data.doctors[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load doctors list:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // 2. Fetch live slots whenever Selected Doctor, Date or Shift changes
  useEffect(() => {
    if (!selectedDoctor?.doctor_profile_id) return;

    const fetchDoctorSlots = async () => {
      try {
        setSlotsLoading(true);
        setSlotBlockReason(null);
        setSelectedSlot(null);

        const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
        const res = await fetch(
          `${API_BASE_URL}/api/doctor/availability/slots?doctorId=${selectedDoctor.doctor_profile_id}&date=${selectedDate}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.is_holiday) {
            setSlotBlockReason(`Hospital Holiday: ${data.holiday_title}`);
            setSlots([]);
            return;
          }
          if (data.is_leave) {
            setSlotBlockReason(`Doctor on Leave: ${data.leave_reason || 'Approved leave'}`);
            setSlots([]);
            return;
          }

          const shiftData = data.shifts?.find((s) => s.shift_type === selectedShift);
          if (shiftData && shiftData.is_active) {
            setSlots(shiftData.slots || []);
          } else {
            setSlotBlockReason(`No clinical hours configured for ${selectedShift.toLowerCase()} shift on this day.`);
            setSlots([]);
          }
        }
      } catch (err) {
        console.error('Error fetching doctor slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchDoctorSlots();
  }, [selectedDoctor, selectedDate, selectedShift]);

  // Handle Send OTP Simulation
  const handleSendOtp = () => {
    if (!bookerPhone || bookerPhone.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpError('');
    setOtpSent(true);
    setOtpCode('123456');
  };

  // Step 2 Validation & Proceed
  const handleStep2Next = (e) => {
    e.preventDefault();
    if (!bookerName.trim()) {
      setOtpError('Please enter patient/booker name');
      return;
    }
    if (!bookerPhone || bookerPhone.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpVerified(true);
    setOtpError('');
    setStep(3);
  };

  // Handle Final Booking Submission
  const handleConfirmBooking = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const finalPatientName =
        bookingFor === 'FAMILY_MEMBER' && patientName.trim() ? patientName.trim() : bookerName.trim();

      const res = await fetch(`${API_BASE_URL}/api/doctor/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctor_profile_id: selectedDoctor?.doctor_profile_id,
          doctorId: selectedDoctor?.doctor_profile_id,
          patient_name: finalPatientName,
          patient_phone: bookerPhone,
          patient_email: bookerEmail || null,
          appointment_date: selectedDate,
          start_time: selectedSlot ? `${selectedSlot.start_time}:00` : '10:00:00',
          consultation_mode: consultationMode,
          gender: patientGender,
          age: patientAge || null,
          service_name: `${consultationMode === 'IN_PERSON' ? 'In-Person Consultation' : 'Online Video Visit'} - ${selectedDoctor?.specialty || 'General'}`,
          consultation_fee: selectedDoctor?.consultation_fee || 1000.0,
          patient_notes: consultationReason ? `Reason: ${consultationReason}. Address: ${patientAddress}` : `Booked at reception for ${selectedBranch}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      setConfirmedBooking({
        reference: data.appointment.booking_reference,
        token: data.appointment.daily_token,
        doctor: selectedDoctor.name,
        patient: finalPatientName,
        phone: bookerPhone,
        date: selectedDate,
        time: selectedSlot?.short_label || format12Hour(selectedSlot?.start_time || '10:00:00'),
        mode: consultationMode,
        branch: selectedBranch,
        fee: selectedDoctor.consultation_fee || 1000,
        paymentMethod: paymentMethod,
      });

      setStep(8); // Step 8 = Confirmation view
    } catch (err) {
      setErrorMsg(err.message || 'Error creating appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exact project sidebar menu items
  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, link: '/dashboard' },
    { id: 'Bookings', icon: BookOpen, link: '/bookings', active: true },
    { id: 'Availability', icon: Clock, link: '/availability' },
    { id: 'Holidays', icon: CalendarOff, link: '/holidays' },
    { id: 'Calendar', icon: CalendarIcon, link: '/dashboard' },
    { id: 'Contacts', icon: Users, link: '/dashboard' },
    { id: 'Pages', icon: FileText, link: '/pages' },
    { id: 'Users', icon: Users, link: '/users' },
    { id: 'Workflows', icon: GitBranch, link: '/dashboard' },
    { id: 'Settings', icon: Settings, link: '/dashboard' },
  ];

  return (
    <>
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* Top Header */}
        <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-[#071224]/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="space-y-1">
            <h1 className="text-xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
              Create Booking
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
              Schedule patient appointments, assign live tokens, and choose consulting doctors.
            </p>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center space-y-6">

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================
              STEP 1: DOCTOR DROPDOWN & DOCTOR INFO CARD (MATCHING PATIENT BOOKING PAGE STEP 1)
             ======================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              
              {/* Doctor Dropdown Selector */}
              <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Select Consulting Doctor <span className="text-rose-500">*</span>
                </label>
                {loadingDoctors ? (
                  <div className="py-2 flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading doctors for your practice...</span>
                  </div>
                ) : (
                  <CustomDropdown
                    value={selectedDoctor?.doctor_profile_id || ''}
                    onChange={(val) => {
                      const doc = doctorsList.find((d) => d.doctor_profile_id === val);
                      if (doc) setSelectedDoctor(doc);
                    }}
                    options={doctorsList.map((d) => ({
                      value: d.doctor_profile_id,
                      label: d.name,
                      sublabel: `${d.specialty || 'General Physician'} • Fee: ₹${d.consultation_fee || 1000}`,
                    }))}
                    placeholder="Choose a doctor..."
                  />
                )}
              </div>

              {/* Patient Booking Page UI Card (Doctor Picture, Name, Specialty, Welcome Message) */}
              {selectedDoctor && (
                <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Doctor Picture in Top Middle */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-teal-500/20 bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 font-serif font-bold text-3xl shadow-lg shadow-teal-500/10 overflow-hidden">
                        {selectedDoctor.avatar_url ? (
                          <img src={selectedDoctor.avatar_url} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{selectedDoctor.name?.charAt(0)?.toUpperCase() || 'D'}</span>
                        )}
                      </div>
                      <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#101927] flex items-center justify-center text-white" title="Doctor Active">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    {/* Doctor Name & Specialty */}
                    <div className="mt-4 space-y-1">
                      <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0B192C] dark:text-white tracking-tight">
                        {selectedDoctor.name}
                      </h2>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="inline-block px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-medium text-xs border border-teal-200/60 dark:border-teal-800/40">
                          {selectedDoctor.specialty || 'General Physician'}
                        </span>
                        <span className="text-xs text-slate-400 font-serif">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Fee: <strong className="text-slate-800 dark:text-slate-200 font-mono">₹{selectedDoctor.consultation_fee || 1000}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Welcome Message (Matching patient booking page description) */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 max-w-lg mx-auto">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                      Welcome to my scheduling page, please select an option below to book an appointment.
                    </p>
                  </div>

                  {/* Book Now Button */}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <span>Proceed to Book Appointment</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                </div>
              )}

            </div>
          )}

          {/* ========================================================
              STEP 2: MOBILE NUMBER & PATIENT VERIFICATION (MATCHING PATIENT BOOKING PAGE STEP 2)
             ======================================================== */}
          {step === 2 && (
            <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 animate-in fade-in duration-200">
              
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
                <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">Step 2 of 6</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                  Enter Patient Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter mobile number to send confirmed booking tokens & digital prescriptions.
                </p>
              </div>

              {otpError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleStep2Next} className="space-y-4">
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                {/* Mobile Number with Send OTP / Quick Walk-In Button */}
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
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-sans"
                      />
                    </div>
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP Field (Appears when OTP sent) */}
                {otpSent && (
                  <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-teal-800 dark:text-teal-300">
                        Enter 6-Digit OTP
                      </label>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                        Demo Code: <strong>{otpCode}</strong>
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="e.g. rahul@gmail.com"
                      value={bookerEmail}
                      onChange={(e) => setBookerEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md shadow-teal-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ========================================================
              STEP 3: CONSULTATION MODE & BRANCH (MATCHING PATIENT BOOKING PAGE STEP 3)
             ======================================================== */}
          {step === 3 && (
            <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">Step 3 of 6</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                  Select Consultation Type
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose between an in-person clinic visit or a telehealth video consultation.
                </p>
              </div>

              {/* Consultation Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* In Person */}
                <div
                  onClick={() => setConsultationMode('IN_PERSON')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    consultationMode === 'IN_PERSON'
                      ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {consultationMode === 'IN_PERSON' && (
                      <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                      In-Person Visit
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Direct physical consultation at the clinic campus with printed prescriptions.
                    </p>
                  </div>
                </div>

                {/* Video Consultation */}
                <div
                  onClick={() => setConsultationMode('ONLINE_VIDEO')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    consultationMode === 'ONLINE_VIDEO'
                      ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Video className="w-5 h-5" />
                    </div>
                    {consultationMode === 'ONLINE_VIDEO' && (
                      <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                      Online Video Call
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Encrypted remote telehealth consultation with digital WhatsApp prescription.
                    </p>
                  </div>
                </div>

              </div>

              {/* Branch Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Branch <span className="text-rose-500">*</span>
                </label>
                <CustomDropdown
                  value={selectedBranch}
                  onChange={(val) => setSelectedBranch(val)}
                  icon={MapPin}
                  options={[
                    { value: 'Main Medical Campus, Sector 44', label: 'Main Medical Campus, Sector 44' },
                    { value: 'Central Practice Clinic, Branch 2', label: 'Central Practice Clinic, Branch 2' },
                  ]}
                />
              </div>

              {/* DPDP Act Guaranteed note */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>100% DPDP Act 2026 Privacy Guaranteed. Your medical data is never shared with third-party advertisers.</span>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full py-3 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md shadow-teal-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================
              STEP 4: PICK DATE & SLOT (MATCHING PATIENT BOOKING PAGE STEP 4)
             ======================================================== */}
          {step === 4 && (
            <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">Step 4 of 6</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                  Pick a Date & Time Slot
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Available consultation slots for <strong className="text-slate-800 dark:text-slate-200 font-medium">{selectedDoctor?.name}</strong>.
                </p>
              </div>

              {/* Date Picker using CustomCalendarPicker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Date <span className="text-rose-500">*</span>
                </label>
                <CustomCalendarPicker
                  selectedDate={selectedDate}
                  onChange={(newDate) => {
                    if (newDate && newDate !== 'ALL') setSelectedDate(newDate);
                  }}
                  className="w-full"
                />
              </div>

              {/* Shift Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Shift
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSelectedShift('MORNING')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      selectedShift === 'MORNING'
                        ? 'bg-white dark:bg-[#101927] text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    🌅 Morning (9 AM – 1 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShift('EVENING')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      selectedShift === 'EVENING'
                        ? 'bg-white dark:bg-[#101927] text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    🌆 Evening (2 PM – 6 PM)
                  </button>
                </div>
              </div>

              {/* Slots Grid */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Available Time Slots
                </label>

                {slotsLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Fetching real-time slots...</span>
                  </div>
                ) : slotBlockReason ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs text-center space-y-1">
                    <p className="font-semibold">{slotBlockReason}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Please choose another date or shift.</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No slots configured for this shift.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((s) => {
                      const isSelected = selectedSlot?.start_time === s.start_time;
                      const isBooked = !s.is_available;
                      const startTimeOnly = s.short_label || format12Hour(s.start_time);

                      return (
                        <button
                          key={s.start_time}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(s)}
                          className={`py-2.5 px-2 text-xs rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                            isBooked
                              ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800/60 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-teal-500 text-white font-bold shadow-md shadow-teal-500/25 ring-2 ring-teal-500 scale-[1.02]'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600'
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
                disabled={!selectedSlot}
                onClick={() => setStep(5)}
                className="w-full py-3 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md shadow-teal-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================
              STEP 5: PATIENT DETAILS PAGE (MATCHING PATIENT BOOKING PAGE STEP 5)
             ======================================================== */}
          {step === 5 && (
            <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">Step 5 of 6</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                  Patient Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Who is visiting the doctor for this consultation?
                </p>
              </div>

              {/* Myself vs Family Member Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBookingFor('MYSELF')}
                  className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    bookingFor === 'MYSELF'
                      ? 'bg-white dark:bg-[#101927] text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Myself ({bookerName})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFor('FAMILY_MEMBER')}
                  className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    bookingFor === 'FAMILY_MEMBER'
                      ? 'bg-white dark:bg-[#101927] text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Family Member
                </button>
              </div>

              {/* Family Member Inputs */}
              {bookingFor === 'FAMILY_MEMBER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Family Member's Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Relationship
                    </label>
                    <CustomDropdown
                      value={familyRelation}
                      onChange={(val) => setFamilyRelation(val)}
                      options={[
                        { value: 'Child', label: 'Child (Son / Daughter)' },
                        { value: 'Spouse', label: 'Spouse (Husband / Wife)' },
                        { value: 'Parent', label: 'Parent (Father / Mother)' },
                        { value: 'Sibling', label: 'Sibling (Brother / Sister)' },
                        { value: 'Other', label: 'Other Family Member' },
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Gender
                  </label>
                  <CustomDropdown
                    value={patientGender}
                    onChange={(val) => setPatientGender(val)}
                    options={[
                      { value: 'MALE', label: 'Male' },
                      { value: 'FEMALE', label: 'Female' },
                      { value: 'OTHER', label: 'Other' },
                    ]}
                  />
                </div>
              </div>

              {/* Symptoms / Reason for Visit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Symptoms / Reason for Visit (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Persistent cough, seasonal fever, quarterly medical checkup"
                  value={consultationReason}
                  onChange={(e) => setConsultationReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Next Button -> Proceed to Consent */}
              <button
                type="button"
                onClick={() => {
                  if (bookingFor === 'FAMILY_MEMBER' && !patientName.trim()) {
                    setErrorMsg('Please enter family member name');
                    return;
                  }
                  setErrorMsg('');
                  setStep(6);
                }}
                className="w-full py-3 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md shadow-teal-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Proceed to Consent</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================
              STEP 6: PRIVACY & DPDP CONSENT (MIRRORING PATIENT BOOKING)
             ======================================================== */}
          {step === 6 && (
            <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">Consent Step</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white">
                  Clinic Privacy Notice & Consent
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Required consent for processing patient health data under DPDP Act 2026.
                </p>
              </div>

              {/* 1. Clinic Privacy Notice (v1.0) Card */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                      Clinic Privacy Notice (v1.0)
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800/50">
                    DPDP Notice
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">What personal information is being collected:</span>{' '}
                      Name, mobile number (+91), age, gender, appointment preferences, and clinical complaints.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Why it is being collected:</span>{' '}
                      For scheduling, OPD queue management, clinical consultation, and GST tax invoicing.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">How it will be used:</span>{' '}
                      Stored securely inside Indian cloud servers (AWS Mumbai); never sold or shared with commercial aggregators.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Who may have access to it:</span>{' '}
                      Treating doctor ({selectedDoctor?.name || 'Dr. Sagar Sharma'}), clinic front desk, and authorized nursing staff.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
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
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View full Clinic Privacy Policy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2. Mandatory Consent Checkbox Card */}
              <label
                className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  dpdpConsentAgreed
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={dpdpConsentAgreed}
                    onChange={(e) => setDpdpConsentAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500/20 accent-teal-600 cursor-pointer flex-shrink-0"
                  />
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white">
                      I agree to the processing of patient personal and health information
                    </span>{' '}
                    for the purpose of scheduling and managing this appointment, as described in the Clinic Privacy Notice.{' '}
                    <span className="text-rose-500 font-bold">*</span>
                  </p>
                </div>
              </label>

              {/* 3. Optional Educational Consent Checkbox Card */}
              <label
                className={`block p-4 rounded-2xl border cursor-pointer transition-all ${
                  optionalEducationalAgreed
                    ? 'border-teal-400 bg-teal-50/20 dark:bg-teal-950/20'
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
                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500/20 accent-teal-600 cursor-pointer flex-shrink-0"
                  />
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white">Optional:</span>{' '}
                    Send health-related information, educational updates, and follow-up guidance through WhatsApp/SMS.
                  </p>
                </div>
              </label>

              {/* 4. Communication Preferences Card */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <h4 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
                    Communication Preferences
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">WhatsApp & SMS</span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-not-allowed opacity-90 select-none">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-not-allowed"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Appointment confirmations & Token pass
                      </span>
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                      Essential
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={commPrefs.reminders}
                        onChange={(e) => setCommPrefs((prev) => ({ ...prev, reminders: e.target.checked }))}
                        className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Appointment reminders
                      </span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      24h / 2h
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={commPrefs.rescheduling}
                        onChange={(e) => setCommPrefs((prev) => ({ ...prev, rescheduling: e.target.checked }))}
                        className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Cancellation/rescheduling notifications
                      </span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      Instant
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={commPrefs.education}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setCommPrefs((prev) => ({ ...prev, education: checked }));
                          if (checked) setOptionalEducationalAgreed(true);
                        }}
                        className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Health education and newsletters
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
                className="w-full py-3.5 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 active:scale-[0.99] text-white text-xs font-semibold shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================
              STEP 7: PAYMENT DETAILS & METHOD (MIRRORING PATIENT BOOKING)
             ======================================================== */}
          {step === 7 && (
            <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">Payment Step</span>
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
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Doctor</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-serif">{selectedDoctor?.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Patient</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {bookingFor === 'FAMILY_MEMBER' && patientName ? `${patientName} (${familyRelation})` : bookerName}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Date & Slot</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {selectedDate} at {selectedSlot?.short_label || format12Hour(selectedSlot?.start_time)}
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
                  <span className="text-teal-600 dark:text-teal-400 font-mono text-base">
                    ₹{selectedDoctor?.consultation_fee || 1000}
                  </span>
                </div>
              </div>

              {/* Two Payment Options: UPI/QR vs Pay at Clinic Reception */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Payment Method
                </label>

                <div
                  onClick={() => setPaymentMethod('ONLINE_UPI_QR')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'ONLINE_UPI_QR'
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-slate-900 dark:text-white">UPI / Instant QR Code</h5>
                      <p className="text-[10px] text-slate-400">GPay, PhonePe, Paytm, or Cards (Razorpay)</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">
                    ₹{selectedDoctor?.consultation_fee || 1000}
                  </span>
                </div>

                <div
                  onClick={() => setPaymentMethod('PAY_AT_CLINIC')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'PAY_AT_CLINIC'
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-slate-900 dark:text-white">Pay at Clinic Reception</h5>
                      <p className="text-[10px] text-slate-400">Pay cash or card when arriving at the clinic counter</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    On Arrival
                  </span>
                </div>
              </div>

              {/* Confirm Appointment Button */}
              <button
                type="button"
                id="btn-confirm-appointment"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="w-full py-3.5 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 active:scale-[0.99] text-white text-xs font-semibold shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
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
              STEP 8: CONFIRMATION SUCCESS VIEW
             ======================================================== */}
          {step === 8 && confirmedBooking && (
            <div className="bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6 text-center animate-in zoom-in-95 duration-200">
              
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold font-serif text-[#0B192C] dark:text-white">
                  Appointment Confirmed!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily patient token has been generated and booked successfully.
                </p>
              </div>

              {/* Big Token Number Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white max-w-sm mx-auto shadow-lg shadow-teal-500/25 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-85 block">
                  Daily Token Number
                </span>
                <span className="text-4xl font-extrabold font-sans tracking-tight block">
                  #{confirmedBooking.token}
                </span>
                <span className="text-xs font-mono opacity-90 block">
                  Ref: {confirmedBooking.reference}
                </span>
              </div>

              {/* Summary Details */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs max-w-md mx-auto text-left space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Doctor:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-serif">{confirmedBooking.doctor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{confirmedBooking.patient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Schedule:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 font-sans">
                    {confirmedBooking.date} at {confirmedBooking.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mode:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {confirmedBooking.mode === 'IN_PERSON' ? 'In-Person Clinic Visit' : 'Online Video Visit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment:</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    {confirmedBooking.paymentMethod === 'ONLINE_UPI_QR' ? 'UPI / Online' : 'Pay at Reception'} (₹{confirmedBooking.fee})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  View in Bookings Console
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setConfirmedBooking(null);
                    setBookerName('');
                    setBookerPhone('');
                    setBookerEmail('');
                    setPatientName('');
                    setSelectedSlot(null);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Create Another Booking
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Privacy Policy Modal */}
      {privacyPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#101927] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-serif font-bold text-base text-[#0B192C] dark:text-white">
                  Clinic Privacy Policy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyPolicyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 max-h-80 overflow-y-auto pr-1">
              <p>
                This Clinic operates in full compliance with the Digital Personal Data Protection (DPDP) Act, 2026.
              </p>
              <p>
                <strong>1. Data Fiduciary:</strong> HealthDock Clinical Network and the treating doctor are registered data fiduciaries.
              </p>
              <p>
                <strong>2. Data Retention:</strong> Medical records are retained in compliance with National Medical Commission guidelines (minimum 3 years).
              </p>
              <p>
                <strong>3. Grievance Redressal:</strong> Patients have the right to nominate representatives, access audit logs, or request data corrections by contacting the clinic front desk.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPrivacyPolicyModalOpen(false)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
