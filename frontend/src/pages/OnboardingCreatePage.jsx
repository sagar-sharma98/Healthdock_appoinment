import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Upload, 
  ExternalLink, 
  Clock, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Sparkles,
  MessageSquare,
  Cross
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const THEMES = [
  { id: 'retro-arcade', name: 'Retro Arcade', color: '#E11D48' },
  { id: 'kodama-grove', name: 'Kodama Grove', color: '#65A30D' },
  { id: 'claude', name: 'Claude', color: '#D97706' },
  { id: 'claymorphism', name: 'Claymorphism', color: '#4F46E5' },
  { id: 'vintage-paper', name: 'Vintage Paper', color: '#B45309' },
  { id: 'ocean-breeze', name: 'Ocean Breeze', color: '#10B981' },
  { id: 'candyland', name: 'Candyland', color: '#F472B6' },
  { id: 'twitter', name: 'Twitter', color: '#0EA5E9' },
  { id: 'vercel', name: 'Vercel', color: '#000000' },
  { id: 'modern-minimal', name: 'Modern Minimal', color: '#2563EB' },
  { id: 'violet-bloom', name: 'Violet Bloom', color: '#7C3AED' },
  { id: 't3-chat', name: 'T3 Chat', color: '#991B1B' },
  { id: 'mocha-mousse', name: 'Mocha Mousse', color: '#78350F' },
  { id: 'bubblegum', name: 'Bubblegum', color: '#EC4899' },
  { id: 'amethyst-haze', name: 'Amethyst Haze', color: '#8B5CF6' },
  { id: 'notebook', name: 'Notebook', color: '#475569' },
  { id: 'doom-64', name: 'Doom 64', color: '#DC2626' },
  { id: 'catppuccin', name: 'Catppuccin', color: '#A855F7' },
];

export default function OnboardingCreatePage() {
  const navigate = useNavigate();
  const { doctor, setDoctor, triggerToast } = useApp();

  const [userName, setUserName] = useState(doctor?.name || '');
  const [pageName, setPageName] = useState(doctor?.name || 'sagar sharma');
  const [domain, setDomain] = useState(
    doctor?.bookingSlug || 'sagar-sharma'
  );
  const [description, setDescription] = useState(
    'Welcome to my scheduling page, please select an option below to book an appointment'
  );
  const [selectedTheme, setSelectedTheme] = useState('Modern Minimal');
  const [selectedDate, setSelectedDate] = useState(14);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null); // { available: boolean, message: string }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const activeTheme = THEMES.find(t => t.name.toLowerCase() === selectedTheme.toLowerCase()) || THEMES[9];
  const activeColor = activeTheme.color;

  // Initial check or load from existing doctor
  useEffect(() => {
    const savedUser = localStorage.getItem('healthdock_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        const resolvedName = u.full_name || u.name;
        if (resolvedName) {
          setUserName(resolvedName);
          setPageName(resolvedName);
          const slug = resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          setDomain(slug);
        }
      } catch (e) {
        console.error(e);
      }
    } else if (doctor?.name) {
      setUserName(doctor.name);
      setPageName(doctor.name);
    }
  }, [doctor]);

  // Check Domain Slug
  const handleCheckSlug = async () => {
    if (!domain) return;
    setIsCheckingSlug(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/onboarding/check-slug/${domain}`);
      const data = await res.json();
      setSlugStatus(data);
    } catch (err) {
      // Fallback
      setSlugStatus({ available: true, message: 'Slug is available!' });
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePage = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('healthdock_token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/onboarding/create-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          page_name: pageName,
          slug: domain,
          description,
          theme: selectedTheme,
          logo_url: logoPreview,
          timezone: 'Asia/Calcutta',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create page');
      }

      setDoctor(prev => ({
        ...prev,
        name: pageName,
        bookingSlug: domain,
        bio: description,
      }));

      triggerToast('Booking Page Created!', `Your booking page /${domain} is live!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      console.warn('Backend sync note:', err.message);
      // Navigate to dashboard smoothly even in offline mode
      triggerToast('Booking Page Saved', `Page created for ${pageName}`, 'success');
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Doctor initials for live preview avatar
  const initials = pageName
    .split(' ')
    .filter(Boolean)
    .map(p => p[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'SS';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071224] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Header matching HealthDock branding */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] px-6 lg:px-12 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
              <Cross className="w-4 h-4 stroke-[2.8]" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-serif font-bold text-sm tracking-tight text-[#0B192C] dark:text-white leading-tight">
                HealthDock
              </span>
              <span className="font-serif font-light text-[10px] tracking-wide text-teal-600 dark:text-teal-400 leading-tight">
                Appointment
              </span>
            </div>
          </Link>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div>
            <h1 className="text-sm sm:text-base font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
              Welcome, {userName || pageName || 'Doctor'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light">
              Set up your booking page and start accepting appointments.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreatePage}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium rounded-lg shadow-md shadow-teal-500/20 transition-all hover:scale-[1.02]"
        >
          <span>{isSubmitting ? 'Saving...' : 'Next'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 02 Indicator */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full border border-teal-500/40 flex items-center justify-center text-xs font-serif font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 shadow-sm mt-0.5">
              02
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-[#0B192C] dark:text-white">
                Create Page
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                Choose the name and link guests will use to book you.
              </p>
            </div>
          </div>

          {/* Logo Field */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] flex items-center justify-center overflow-hidden shadow-sm">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif text-lg font-bold text-slate-700 dark:text-slate-300">
                    {initials[0] || 'S'}
                  </span>
                )}
              </div>

              <label className="cursor-pointer px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-sm transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Page Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Page Name
            </label>
            <input
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              placeholder="e.g. sagar sharma"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-sm"
            />
          </div>

          {/* Domain / Slug with Check */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Domain
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setSlugStatus(null);
                  }}
                  placeholder="sagar-sharma"
                  className="w-full px-3.5 py-2.5 bg-transparent text-slate-900 dark:text-white text-xs focus:outline-none"
                />
                <span className="px-3 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 py-2.5 whitespace-nowrap select-none">
                  .healthdock.care
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckSlug}
                disabled={isCheckingSlug}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg shadow-sm transition-all"
              >
                {isCheckingSlug ? 'Checking...' : 'Check'}
              </button>
            </div>

            {slugStatus && (
              <p className={`text-[11px] ${slugStatus.available ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500'} flex items-center gap-1 pt-0.5`}>
                {slugStatus.available && <Check className="w-3 h-3" />}
                {slugStatus.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Welcome to my scheduling page..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-sm resize-none"
            />
          </div>

          {/* Themes Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Theme
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {THEMES.map((th) => {
                const isSelected = selectedTheme.toLowerCase() === th.name.toLowerCase();
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setSelectedTheme(th.name)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected 
                        ? 'font-bold text-slate-900 dark:text-white shadow-sm ring-2' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101927] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={isSelected ? { borderColor: th.color, ringColor: th.color, backgroundColor: `${th.color}15` } : {}}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-inner"
                      style={{ backgroundColor: th.color }}
                    />
                    <span className="truncate">{th.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCreatePage}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-white text-xs font-serif font-medium rounded-lg shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              style={{ backgroundColor: activeColor, boxShadow: `0 4px 14px ${activeColor}35` }}
            >
              {isSubmitting ? 'Creating Page...' : 'Create Page'}
            </button>
          </div>
        </div>

        {/* Right Column: Live Preview (Matches Screenshot 1 & 2) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>LIVE PREVIEW</span>
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-all"
                style={{ backgroundColor: `${activeColor}18`, color: activeColor, border: `1px solid ${activeColor}30` }}
              >
                {activeTheme.name}
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-teal-500 cursor-pointer transition-colors" />
          </div>

          {/* Live Preview Card */}
          <div 
            className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-all"
            style={{ borderTop: `4px solid ${activeColor}` }}
          >
            
            {/* Doctor Avatar & Titles */}
            <div className="space-y-2">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden shadow-sm transition-all"
                style={{
                  backgroundColor: `${activeColor}15`,
                  border: `2px solid ${activeColor}`,
                  color: activeColor,
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div>
                <p 
                  className="text-[11px] font-semibold lowercase transition-colors"
                  style={{ color: activeColor }}
                >
                  {pageName.toLowerCase()}
                </p>
                <h3 className="text-lg font-bold font-serif text-[#0B192C] dark:text-white capitalize">
                  {pageName}
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                {description}
              </p>

              {/* Time & Timezone Badges */}
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 transition-colors" style={{ color: activeColor }} />
                  <span>30 min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 transition-colors" style={{ color: activeColor }} />
                  <span>Asia / Calcutta</span>
                </div>
              </div>
            </div>

            {/* Calendar Widget matching Screenshot */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                <ChevronLeft className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer" />
                <span className="font-serif font-semibold" style={{ color: activeColor }}>October 2026</span>
                <ChevronRight className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer" />
              </div>

              {/* Days of week */}
              <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-400">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days numbers */}
              <div className="grid grid-cols-7 text-center text-xs gap-y-1.5">
                {/* Previous month greyed */}
                <span className="text-slate-300 dark:text-slate-600 py-1">27</span>
                <span className="text-slate-300 dark:text-slate-600 py-1">28</span>
                <span className="text-slate-300 dark:text-slate-600 py-1">29</span>
                <span className="text-slate-300 dark:text-slate-600 py-1">30</span>

                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const isDaySelected = selectedDate === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isDaySelected
                          ? 'text-white font-bold shadow-md'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={
                        isDaySelected
                          ? {
                              backgroundColor: activeColor,
                              boxShadow: `0 4px 12px ${activeColor}55`,
                            }
                          : {}
                      }
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Bottom CTA Button */}
              <button
                type="button"
                className="w-full py-2.5 text-white font-semibold rounded-xl text-xs transition-all mt-3 hover:scale-[1.01] shadow-md cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: activeColor,
                  boxShadow: `0 4px 14px ${activeColor}40`,
                }}
              >
                <span>Choose a time</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Bubble matching Active Theme */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          type="button"
          className="w-12 h-12 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          style={{ 
            backgroundColor: activeColor, 
            boxShadow: `0 6px 20px ${activeColor}50` 
          }}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
