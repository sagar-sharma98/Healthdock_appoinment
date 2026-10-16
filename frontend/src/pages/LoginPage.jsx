import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setDoctor, triggerToast } = useApp();

  useEffect(() => {
    const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password');
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
        bookingSlug: data.bookingPage?.slug || prev.bookingSlug,
      }));

      triggerToast('Login Successful!', `Welcome back, ${data.user.full_name}!`, 'success');
      
      // Navigate to doctor dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message);
      triggerToast('Login Failed', err.message, 'error');
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
            Login
          </h2>
        </div>


        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3 text-xs">
          
          {/* Email */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Email
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

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <a href="#forgot" className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
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

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
            <label htmlFor="remember" className="text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              Keep me signed in on this device
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Submit: button text strictly "Login" */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 border border-transparent bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 text-xs hover:scale-[1.01]"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{loading ? 'Logging in...' : 'Login'}</span>
          </button>
        </form>

        {/* Switch to Signup: strictly "Signup" link */}
        <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Don't have an account? </span>
          <Link
            to="/signup"
            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Signup
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
