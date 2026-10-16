import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Clock,
  Calendar as CalendarIcon,
  Users,
  FileText,
  GitBranch,
  Settings,
  Moon,
  Sun,
  Cross,
  Sparkles,
  ChevronDown,
  CalendarOff,
  User,
  Mail,
  Phone,
  Shield,
  Stethoscope,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CustomDropdown from '../components/common/CustomDropdown';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { id: editUserId } = useParams();
  const isEditMode = Boolean(editUserId);

  const { theme, toggleTheme } = useApp();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [status, setStatus] = useState('ACTIVE'); // 'ACTIVE' | 'INACTIVE'
  const [specialty, setSpecialty] = useState('General Medicine');
  const [password, setPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sidebar profile
  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sagar Sharma',
    email: 'dr.sagar@healthdock.in',
  });

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

  // Fetch existing user data in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchUser = async () => {
      try {
        setInitialLoading(true);
        const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/doctor/users/${editUserId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          if (u) {
            setFullName(u.full_name || '');
            setEmail(u.email || '');
            setPhone(u.phone || '');
            setRole(u.role || 'DOCTOR');
            setStatus(u.status || 'ACTIVE');
            setSpecialty(u.specialty || 'General Medicine');
            // Password intentionally left empty for security and prefill rules
            setPassword('');
          }
        } else {
          setErrorMsg('Failed to load user details for editing.');
        }
      } catch (err) {
        console.error('Error loading user details:', err);
        setErrorMsg('Error connecting to user service.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUser();
  }, [editUserId, isEditMode]);

  // Sidebar navigation items
  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, link: '/dashboard' },
    { id: 'Bookings', icon: BookOpen, link: '/bookings' },
    { id: 'Availability', icon: Clock, link: '/availability' },
    { id: 'Holidays', icon: CalendarOff, link: '/holidays' },
    { id: 'Calendar', icon: CalendarIcon, link: '/dashboard' },
    { id: 'Contacts', icon: Users, link: '/dashboard' },
    { id: 'Pages', icon: FileText, link: '/pages' },
    { id: 'Users', icon: Users, link: '/users', active: true },
    { id: 'Workflows', icon: GitBranch, link: '/dashboard' },
    { id: 'Settings', icon: Settings, link: '/dashboard' },
  ];

  // 1. Status Dropdown Options
  const statusOptions = [
    { label: 'Active', value: 'ACTIVE', colorDot: 'bg-emerald-500' },
    { label: 'Inactive', value: 'INACTIVE', colorDot: 'bg-slate-400' },
  ];

  // 2. Clinic Role Dropdown Options
  const roleOptions = [
    { label: 'Consulting Doctor', value: 'DOCTOR', icon: Stethoscope },
    { label: 'Clinic Administrator', value: 'CLINIC_ADMIN', icon: Shield },
    { label: 'Receptionist / Front Desk', value: 'RECEPTIONIST', icon: Users },
    { label: 'Medical Staff / Nurse', value: 'STAFF', icon: Activity },
  ];

  // 3. Clinical Specialty Dropdown Options
  const specialtyOptions = [
    { label: 'General Medicine', value: 'General Medicine', icon: Stethoscope },
    { label: 'Cardiology', value: 'Cardiology', icon: Stethoscope },
    { label: 'Dermatology', value: 'Dermatology', icon: Stethoscope },
    { label: 'Pediatrics', value: 'Pediatrics', icon: Stethoscope },
    { label: 'Orthopedics', value: 'Orthopedics', icon: Stethoscope },
    { label: 'Gynecology & Obstetrics', value: 'Gynecology & Obstetrics', icon: Stethoscope },
    { label: 'Neurology', value: 'Neurology', icon: Stethoscope },
    { label: 'ENT (Otolaryngology)', value: 'ENT (Otolaryngology)', icon: Stethoscope },
    { label: 'Ophthalmology', value: 'Ophthalmology', icon: Stethoscope },
    { label: 'Dental Care', value: 'Dental Care', icon: Stethoscope },
    { label: 'Psychiatry', value: 'Psychiatry', icon: Stethoscope },
    { label: 'Physiotherapy', value: 'Physiotherapy', icon: Stethoscope },
    { label: 'General Surgery', value: 'General Surgery', icon: Stethoscope },
    { label: 'None / Administrative', value: 'None', icon: Stethoscope },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!fullName.trim()) {
      setErrorMsg('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid email address is required');
      return;
    }
    if (!isEditMode && (!password || password.length < 6)) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const url = isEditMode
        ? `${API_BASE_URL}/api/doctor/users/${editUserId}`
        : `${API_BASE_URL}/api/doctor/users`;

      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role,
        status,
        specialty: role === 'DOCTOR' || role === 'STAFF' ? specialty : null,
      };

      if (password && password.trim()) {
        payload.password = password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save user credentials');
      }

      setSuccessMsg(
        isEditMode
          ? 'User profile & password updated successfully!'
          : 'New user created and added to clinic successfully!'
      );

      setTimeout(() => {
        navigate('/users');
      }, 900);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto font-sans">
        
        {/* Top Header Bar */}
        <header className="p-6 lg:px-12 pb-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#071224]/60 backdrop-blur-md sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
              {isEditMode ? 'Edit User & Credentials' : 'Create User'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
              {isEditMode
                ? 'Update clinic role permissions, contact details, or reset authentication password.'
                : 'Configure new doctor or clinic staff credentials, specialization, and role permissions.'}
            </p>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || initialLoading}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-teal-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEditMode ? 'Save Changes' : 'Add User'}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Content Body: Open Canvas Layout (No heavy box containers) */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 lg:p-12 space-y-10">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {initialLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading user profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* SECTION 1: Personal & Contact Information */}
              <div className="space-y-4">
                <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    01. Personal & Contact Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Basic identification and communication details for practice notifications
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Sagar Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        disabled={isEditMode}
                        placeholder="e.g. sagar.doctor@healthdock.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    {isEditMode && (
                      <span className="text-[10px] text-slate-400">Email cannot be modified once registered</span>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Status Dropdown (CustomDropdown) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Account Status <span className="text-rose-500">*</span>
                    </label>
                    <CustomDropdown
                      value={status}
                      onChange={setStatus}
                      options={statusOptions}
                      placeholder="Select Status"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Role & Clinical Specialization */}
              <div className="space-y-4">
                <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    02. Clinic Role & Clinical Specialty
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select the role and medical specialization for appointment bookings and practice workflows
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Clinic Role Dropdown (CustomDropdown) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Clinic Role <span className="text-rose-500">*</span>
                    </label>
                    <CustomDropdown
                      value={role}
                      onChange={(newRole) => {
                        setRole(newRole);
                        if (newRole !== 'DOCTOR' && newRole !== 'STAFF') {
                          setSpecialty('None');
                        } else if (specialty === 'None') {
                          setSpecialty('General Medicine');
                        }
                      }}
                      options={roleOptions}
                      placeholder="Select Clinic Role"
                      icon={Shield}
                      className="w-full"
                    />
                    <span className="text-[10px] text-slate-400">
                      Determines scheduling permissions and practice console access
                    </span>
                  </div>

                  {/* Clinical Specialty Dropdown (CustomDropdown) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Clinical Specialty <span className="text-rose-500">*</span>
                    </label>
                    <CustomDropdown
                      value={specialty}
                      onChange={setSpecialty}
                      options={specialtyOptions}
                      placeholder="Select Clinical Specialty"
                      icon={Stethoscope}
                      className="w-full"
                    />
                    <span className="text-[10px] text-slate-400">
                      Displayed on doctor cards, patient booking pages, and prescriptions
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Password & Authentication Credentials */}
              <div className="space-y-4">
                <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    03. Security & Access Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isEditMode
                      ? 'Set a new password to reset credentials, or leave blank to keep unchanged.'
                      : 'Set an initial secure access password for this clinic member.'}
                  </p>
                </div>

                <div className="max-w-md space-y-1.5 pt-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isEditMode ? 'New Password' : 'Password'}{' '}
                    {!isEditMode && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={
                        isEditMode
                          ? 'Enter new password to reset...'
                          : 'Minimum 6 characters...'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {isEditMode ? (
                    <span className="text-[10px] text-slate-400">
                      Leave blank if you do not want to alter this user's current password
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      User can log in using their email and this password
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-teal-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{isEditMode ? 'Update User' : 'Add User'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </main>
  );
}
