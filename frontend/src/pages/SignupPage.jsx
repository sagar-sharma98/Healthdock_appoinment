import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { setDoctor, triggerToast } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          email,
          phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create doctor account');
      }

      // Store auth session
      if (data.token) {
        localStorage.setItem('healthdock_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('healthdock_user', JSON.stringify(data.user));
      }
      if (data.bookingPage) {
        localStorage.setItem('healthdock_page', JSON.stringify(data.bookingPage));
      }

      setDoctor(prev => ({
        ...prev,
        name: data.user.full_name,
        email: data.user.email,
        phone: data.user.phone,
        bookingSlug: data.bookingPage?.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      }));

      triggerToast('Doctor Account Created!', `Welcome Dr. ${name}! Proceeding to booking page setup.`, 'success');
      
      // Navigate to the next page: Onboarding Create Page (Screenshots 1 & 2)
      navigate('/onboarding');
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(err.message);
      triggerToast('Signup Notice', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout>
      <div className="space-y-5 animate-fade-in">
        
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#0B192C] dark:text-white tracking-tight">
            Create an account
          </h2>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-2.5 text-xs">
          
          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Your Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Dr. Sagar Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Your Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Your number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              New password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
            <label htmlFor="terms" className="text-slate-600 dark:text-slate-300 cursor-pointer select-none leading-relaxed">
              I agree to the <a href="#terms" className="text-teal-600 dark:text-teal-400 hover:underline">Terms of Service</a> & <a href="#dpdp" className="text-teal-600 dark:text-teal-400 hover:underline">DPDP 2026 Data Privacy Charter</a>.
            </label>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!acceptTerms || loading}
            className="w-full py-2.5 border border-transparent bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 text-xs hover:scale-[1.01]"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{loading ? 'Creating Doctor Account...' : 'Sign Up'}</span>
          </button>
        </form>

        {/* Switch to Login: strictly "Login" link */}
        <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
