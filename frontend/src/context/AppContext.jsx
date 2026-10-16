import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_DOCTOR, 
  INITIAL_SERVICES, 
  INITIAL_APPOINTMENTS, 
  INITIAL_TEAM, 
  INITIAL_SCHEDULE 
} from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation: 'marketing' | 'auth' | 'onboarding' | 'dashboard' | 'patient-booking'
  const [currentView, setCurrentView] = useState('marketing');
  
  // Dashboard Sub-navigation: 'appointments' | 'team' | 'availability' | 'settings' | 'docs'
  const [dashboardTab, setDashboardTab] = useState('appointments');

  // Theme: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('healthdock_theme') || 'light';
  });

  // Doctor / Organization state
  const [doctor, setDoctor] = useState(INITIAL_DOCTOR);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);

  // Active doctor slug being viewed by patient (defaults to current doctor)
  const [activeBookingSlug, setActiveBookingSlug] = useState(INITIAL_DOCTOR.bookingSlug);

  // Realtime Live Toast alert for doctor cockpit
  const [liveToast, setLiveToast] = useState(null);

  // Onboarding wizard active step: 1, 2, or 3
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Manage dark theme on <html> root
  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('healthdock_theme', theme);
    localStorage.removeItem('theme'); // Clean up any old fragmented keys
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const triggerToast = (title, message, type = 'success') => {
    setLiveToast({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setLiveToast(null);
    }, 6000);
  };

  // Add new appointment from patient booking flow
  const bookAppointment = (bookingData) => {
    const tokenNumber = String(appointments.length + 4).padStart(2, '0');
    const newAppointment = {
      id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      token: tokenNumber,
      patientName: bookingData.patientName,
      patientPhone: bookingData.patientPhone,
      patientEmail: bookingData.patientEmail,
      service: bookingData.serviceName,
      type: bookingData.serviceType,
      date: bookingData.date,
      time: bookingData.time,
      status: 'Confirmed',
      notes: bookingData.notes || 'Booked via patient direct link',
      amount: bookingData.price,
      paid: true,
      bookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAppointments(prev => [newAppointment, ...prev]);

    // Live alert on doctor dashboard
    triggerToast(
      '🔔 New Patient Booking!',
      `${newAppointment.patientName} booked ${newAppointment.service} for ${newAppointment.time} (Token #${tokenNumber})`,
      'success'
    );

    return newAppointment;
  };

  // Update appointment status
  const updateAppointmentStatus = (id, newStatus) => {
    setAppointments(prev => 
      prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
    triggerToast('Status Updated', `Appointment ${id} marked as ${newStatus}`, 'info');
  };

  // Add another doctor/user with their own booking slug
  const addUserToTeam = (newMember) => {
    const slug = newMember.bookingSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const createdMember = {
      id: `usr-${Date.now()}`,
      name: newMember.name,
      role: newMember.role || 'Associate Doctor',
      specialty: newMember.specialty || 'General OPD',
      email: newMember.email,
      phone: newMember.phone || '+91 98000 00000',
      bookingSlug: slug,
      status: 'Active',
      appointmentsCount: 0,
      avatar: newMember.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=240&auto=format&fit=crop&q=80',
    };

    setTeam(prev => [...prev, createdMember]);
    triggerToast('Team Member Created', `${createdMember.name} added with booking link /${slug}`, 'success');
  };

  // Complete onboarding
  const completeOnboarding = (profileData) => {
    setDoctor(prev => ({
      ...prev,
      ...profileData,
      onboardingCompleted: true,
    }));
    setCurrentView('dashboard');
    triggerToast('Welcome to HealthDock!', 'Your clinical profile and booking link are now live.', 'success');
  };

  const openBookingFor = (slug) => {
    setActiveBookingSlug(slug);
    setCurrentView('patient-booking');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        dashboardTab,
        setDashboardTab,
        theme,
        toggleTheme,
        doctor,
        setDoctor,
        services,
        appointments,
        team,
        schedule,
        setSchedule,
        activeBookingSlug,
        setActiveBookingSlug,
        openBookingFor,
        bookAppointment,
        updateAppointmentStatus,
        addUserToTeam,
        completeOnboarding,
        liveToast,
        setLiveToast,
        triggerToast,
        onboardingStep,
        setOnboardingStep,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
