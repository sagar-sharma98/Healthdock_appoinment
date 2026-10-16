import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Copy,
  Check,
  Palette,
  FileText,
  Upload,
  Trash2,
  Sun,
  Moon,
  Laptop,
  Square,
  Circle,
  Clock,
  Video,
  Globe,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar as CalendarIcon,
  Columns,
  SquareDashedBottom,
  Sparkle,
  Image,
  Layers,
  Sliders,
  User,
  Phone,
  Building2,
  MapPin,
  CreditCard,
  QrCode,
  MessageSquare,
  Send,
  Lock,
  ArrowRight,
  Cross,
} from 'lucide-react';
import CustomDropdown from '../components/common/CustomDropdown';
import {
  THEMES,
  LOGO_SHAPES,
  COLOR_MODES,
  LAYOUT_STYLES,
  CORNER_RADII,
  BG_STYLES,
  CARD_FINISHES,
  BUTTON_STYLES,
  getTheme,
} from '../utils/themeConstants';

export default function EditBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Loading & feedback states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Accordion open/close states
  const [basicOpen, setBasicOpen] = useState(true);
  const [appearanceOpen, setAppearanceOpen] = useState(true);

  // Doctor & Host details
  const [doctorInfo, setDoctorInfo] = useState({
    name: 'Dr. Sagar Sharma',
    specialty: 'Senior Physician & Cardiologist',
    qualification: 'MBBS, MD',
    experience_years: 12,
    consultation_fee: 1000,
    organization_name: 'HealthDock Medical Center',
    avatar: '',
  });

  // Basic Form State
  const [pageName, setPageName] = useState('30 Minute Meeting');
  const [slug, setSlug] = useState('meeting');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState(
    'Welcome to my scheduling page. Please select a convenient date and time slot below to confirm your appointment.'
  );
  const [slotDuration, setSlotDuration] = useState('30');

  // Appearance Form State
  const [logoShape, setLogoShape] = useState('Rounded'); // 'Square', 'Circle', 'Rounded', 'Rectangle'
  const [colorMode, setColorMode] = useState('System'); // 'Light', 'Dark', 'System'
  const [selectedTheme, setSelectedTheme] = useState('Mocha Mousse');
  const [removeBranding, setRemoveBranding] = useState(false);

  // Advanced Appearance Form State
  const [layoutStyle, setLayoutStyle] = useState('SPLIT_2_COL'); // 'SPLIT_2_COL', 'CENTERED_CARD'
  const [cornerRadius, setCornerRadius] = useState('Rounded'); // 'Sharp', 'Rounded', 'Pill'
  const [bgStyle, setBgStyle] = useState('Mesh Gradient'); // 'Mesh Gradient', 'Dot Grid', 'Solid'
  const [cardFinish, setCardFinish] = useState('Glassmorphic'); // 'Glassmorphic', 'Solid Clean'
  const [coverBannerUrl, setCoverBannerUrl] = useState('');
  const [buttonStyle, setButtonStyle] = useState('Solid'); // 'Solid', 'Gradient'

  const logoFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo image must be smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('Cover banner image must be smaller than 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverBannerUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Fetch page details from API
  useEffect(() => {
    async function fetchPage() {
      try {
        setLoading(true);
        const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/doctor/pages/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error('Could not load booking page details');
        }

        const data = await res.json();
        const p = data.page;

        setPageName(p.page_name || '30 Minute Meeting');
        setSlug(p.slug || '');
        setLogoUrl(p.logo_url || '');
        setDescription(p.description || '');
        setSlotDuration(String(p.slot_duration_minutes || 30));
        setSelectedTheme(p.theme || 'Mocha Mousse');
        setLogoShape(p.logo_shape || 'Rounded');
        setColorMode(p.color_mode || 'System');
        setRemoveBranding(Boolean(p.remove_branding));

        // Advanced appearance
        setLayoutStyle(p.layout_style || 'SPLIT_2_COL');
        setCornerRadius(p.corner_radius || 'Rounded');
        setBgStyle(p.bg_style || 'Mesh Gradient');
        setCardFinish(p.card_finish || 'Glassmorphic');
        setCoverBannerUrl(p.cover_banner_url || '');
        setButtonStyle(p.button_style || 'Solid');

        setDoctorInfo({
          name: p.doctor_name || 'Dr. Sagar Sharma',
          specialty: p.specialty || 'General Practitioner',
          qualification: p.qualification || 'MBBS, MD',
          experience_years: p.experience_years || 12,
          consultation_fee: p.consultation_fee || 1000,
          organization_name: p.organization_name || 'HealthDock Medical Center',
          avatar: p.avatar_url || '',
        });
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error fetching page');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPage();
    }
  }, [id]);

  const activeThemeObj = getTheme(selectedTheme);

  // Determine effective preview color mode (Dark or Light)
  const isPreviewDark =
    colorMode === 'Dark' ||
    (colorMode === 'System' && document.documentElement.classList.contains('dark'));

  // Copy live public booking URL
  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Save changes to backend
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!pageName.trim()) {
      setError('Page name is required.');
      return;
    }
    if (!slug.trim()) {
      setError('URL slug is required.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/doctor/pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          page_name: pageName.trim(),
          slug: slug.trim().toLowerCase(),
          logo_url: logoUrl.trim(),
          description: description.trim(),
          slot_duration_minutes: parseInt(slotDuration, 10),
          theme: selectedTheme,
          logo_shape: logoShape,
          color_mode: colorMode,
          remove_branding: removeBranding,
          layout_style: layoutStyle,
          corner_radius: cornerRadius,
          bg_style: bgStyle,
          card_finish: cardFinish,
          cover_banner_url: coverBannerUrl.trim(),
          button_style: buttonStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update booking page');
      }

      setSuccessMsg('All customization changes and advanced appearance saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  // Calendar helper days for October 2026
  const calendarDays = [
    { day: 27, isCurrentMonth: false },
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 31, isCurrentMonth: true },
  ];

  // Helper for Logo Shape class matching PublicBookingPage
  const getLogoShapeClasses = () => {
    switch (logoShape) {
      case 'Square':
        return 'rounded-none aspect-square w-20 h-20 sm:w-24 sm:h-24';
      case 'Circle':
        return 'rounded-full aspect-square w-20 h-20 sm:w-24 sm:h-24';
      case 'Rectangle':
        return 'rounded-2xl aspect-[16/9] w-32 h-20 sm:w-36 sm:h-24';
      case 'Rounded':
      default:
        return 'rounded-3xl aspect-square w-20 h-20 sm:w-24 sm:h-24';
    }
  };

  // Dynamic Corner Radius Classes across all element types
  const getRadiusClass = (type = 'card') => {
    if (cornerRadius === 'Sharp') {
      return 'rounded-none';
    }
    if (cornerRadius === 'Pill') {
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

  // Card surface finish
  const getCardFinishClass = () => {
    if (cardFinish === 'Glassmorphic') {
      return isPreviewDark
        ? 'backdrop-blur-xl bg-[#101927]/85 border border-slate-800/80 shadow-2xl text-slate-100'
        : 'backdrop-blur-xl bg-white/85 border border-white/60 shadow-xl text-slate-800';
    }
    return isPreviewDark
      ? 'bg-[#101927] border border-slate-800 shadow-xl text-slate-100'
      : 'bg-white border border-slate-200/80 shadow-xl text-slate-800';
  };

  // Button background style (solid vs gradient)
  const getBtnBgStyle = () => {
    if (buttonStyle === 'Gradient') {
      return {
        background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.hover || activeThemeObj.primary})`,
        color: '#ffffff',
      };
    }
    return {
      backgroundColor: activeThemeObj.primary,
      color: '#ffffff',
    };
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC] dark:bg-[#071224]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-serif">Loading page customization...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#071224]">
      {/* Top Header Bar */}
      <header className="px-6 lg:px-8 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#071224]/80 backdrop-blur-md sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pages')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0E1624] text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:border-teal-500/40 transition-all shadow-sm"
            title="Back to Pages list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
                Edit Booking Page
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
              Customize title, booking URL, themes, banner, layout, and visual styling
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href={`${window.location.origin}/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0E1624] text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-400 transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all shadow-sm shadow-teal-600/30 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="mx-6 lg:mx-8 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mx-6 lg:mx-8 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="flex-1 p-6 lg:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================
            LEFT COLUMN: CUSTOMIZATION CONTROLS (Accordion / Cards)
           ======================================================== */}
        <div className="xl:col-span-6 space-y-6">

          {/* 1. BASIC ACCORDION */}
          <div className="bg-white dark:bg-[#0E1624] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setBasicOpen(prev => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold font-serif text-[#0B192C] dark:text-white">
                    Basic Settings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Page title, URL slug, logo and instructions
                  </p>
                </div>
              </div>
              <div className="text-slate-400">
                {basicOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {basicOpen && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 space-y-5">
                
                {/* Page Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Page Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="e.g. 30 Minute Meeting, Doctor Consultation"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#121C2D] text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>

                {/* URL Slug */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Booking Page URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#121C2D] focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                    <span className="px-3.5 py-2.5 text-xs font-mono text-slate-500 bg-slate-100/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 select-none flex items-center">
                      healthdock.in/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="custom-slug"
                      className="flex-1 px-3.5 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3.5 py-2.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center"
                      title="Copy URL"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Public URL: {window.location.origin}/{slug || 'your-slug'}
                  </p>
                </div>

                {/* Logo / Avatar File Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Logo / Avatar Image
                  </label>
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleLogoFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {logoUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-slate-50/60 dark:bg-[#121C2D]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 shadow-xs">
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Logo image loaded</p>
                          <p className="text-[11px] text-slate-400">Visible on patient booking page</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors border border-teal-200 dark:border-teal-900/60"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                          title="Remove logo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoFileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700/80 hover:border-teal-500 dark:hover:border-teal-400 rounded-xl p-5 flex items-center justify-center gap-3.5 bg-slate-50/40 dark:bg-[#121C2D]/50 hover:bg-slate-50 dark:hover:bg-[#121C2D] transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          Upload Logo / Avatar Image
                        </p>
                        <p className="text-[11px] text-slate-400">PNG, JPG, SVG or WebP up to 5MB</p>
                      </div>
                    </div>
                  )}
                  {/* Presets */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setLogoUrl('https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300')}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Dr. Photo
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={() => setLogoUrl('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300')}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Hospital Badge
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description & Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide instructions, preparation advice, or note for patients..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#121C2D] text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                  />
                </div>

              </div>
            )}
          </div>

          {/* 2. ADVANCED APPEARANCE ACCORDION */}
          <div className="bg-white dark:bg-[#0E1624] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setAppearanceOpen(prev => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Palette className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold font-serif text-[#0B192C] dark:text-white">
                    Appearance & Design
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Layout style, cover banner, corner radius, background, themes & branding
                  </p>
                </div>
              </div>
              <div className="text-slate-400">
                {appearanceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {appearanceOpen && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 space-y-6">

                {/* A. Layout Style (Split 2-Col vs Centered Card) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Page Layout Structure
                    </label>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono">
                      Desktop & Tablet
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    {LAYOUT_STYLES.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLayoutStyle(l.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          layoutStyle === l.id
                            ? 'border-teal-500 dark:border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 shadow-xs ring-1 ring-teal-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-[#121C2D] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Columns className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{l.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{l.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* B. Cover Banner Image File Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Clinic Header Cover Banner (Optional)
                  </label>
                  <input
                    type="file"
                    ref={bannerFileInputRef}
                    onChange={handleBannerFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {coverBannerUrl ? (
                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-700/90 overflow-hidden bg-slate-50/60 dark:bg-[#121C2D] shadow-xs">
                      <div className="h-20 w-full overflow-hidden relative">
                        <img src={coverBannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="text-xs font-medium text-white hover:text-teal-300 transition-colors"
                          >
                            Change
                          </button>
                          <span className="text-white/40">•</span>
                          <button
                            type="button"
                            onClick={() => setCoverBannerUrl('')}
                            className="text-xs font-medium text-rose-300 hover:text-rose-100 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700/80 hover:border-teal-500 dark:hover:border-teal-400 rounded-xl p-5 flex items-center justify-center gap-3.5 bg-slate-50/40 dark:bg-[#121C2D]/50 hover:bg-slate-50 dark:hover:bg-[#121C2D] transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          Upload Clinic Header Cover Banner
                        </p>
                        <p className="text-[11px] text-slate-400">Widescreen header (e.g. 1200x400) PNG, JPG</p>
                      </div>
                    </div>
                  )}
                  {/* Presets */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <span className="text-[11px] text-slate-400">Banner presets:</span>
                    <button
                      type="button"
                      onClick={() => setCoverBannerUrl('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop')}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Medical Facility
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={() => setCoverBannerUrl('https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop')}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Clinic Lounge
                    </button>
                  </div>
                </div>

                {/* C. Corner Radius & Button Fill Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Corner Radius */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Corner Radius (Shape)
                    </label>
                    <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-[#121C2D] gap-1">
                      {CORNER_RADII.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setCornerRadius(r.id)}
                          className={`flex-1 py-1.5 px-2 text-center text-xs font-medium rounded-lg transition-all ${
                            cornerRadius === r.id
                              ? 'bg-white dark:bg-[#0E1624] text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Fill Style */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Button Style
                    </label>
                    <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-[#121C2D] gap-1">
                      {BUTTON_STYLES.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setButtonStyle(b.id)}
                          className={`flex-1 py-1.5 px-2 text-center text-xs font-medium rounded-lg transition-all ${
                            buttonStyle === b.id
                              ? 'bg-white dark:bg-[#0E1624] text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* D. Page Background & Card Finish */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Background Style */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Background Style
                    </label>
                    <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-[#121C2D] gap-1">
                      {BG_STYLES.map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setBgStyle(bg.id)}
                          className={`flex-1 py-1.5 px-2 text-center text-[11px] font-medium rounded-lg transition-all ${
                            bgStyle === bg.id
                              ? 'bg-white dark:bg-[#0E1624] text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Finish */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Card Surface Finish
                    </label>
                    <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-[#121C2D] gap-1">
                      {CARD_FINISHES.map((cf) => (
                        <button
                          key={cf.id}
                          type="button"
                          onClick={() => setCardFinish(cf.id)}
                          className={`flex-1 py-1.5 px-2 text-center text-[11px] font-medium rounded-lg transition-all ${
                            cardFinish === cf.id
                              ? 'bg-white dark:bg-[#0E1624] text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {cf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1. Logo Shape */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Logo Shape
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    {/* Square */}
                    <button
                      type="button"
                      onClick={() => setLogoShape('Square')}
                      className={`flex flex-col items-center justify-center py-3 px-3 rounded-xl border transition-all ${
                        logoShape === 'Square'
                          ? 'border-teal-500 dark:border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121C2D] text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-6 h-6 border-2 border-current mb-1.5 rounded-none" />
                      <span className="text-xs font-medium">Square</span>
                    </button>

                    {/* Circle */}
                    <button
                      type="button"
                      onClick={() => setLogoShape('Circle')}
                      className={`flex flex-col items-center justify-center py-3 px-3 rounded-xl border transition-all ${
                        logoShape === 'Circle'
                          ? 'border-teal-500 dark:border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121C2D] text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-6 h-6 border-2 border-current mb-1.5 rounded-full" />
                      <span className="text-xs font-medium">Circle</span>
                    </button>

                    {/* Rounded */}
                    <button
                      type="button"
                      onClick={() => setLogoShape('Rounded')}
                      className={`flex flex-col items-center justify-center py-3 px-3 rounded-xl border transition-all ${
                        logoShape === 'Rounded'
                          ? 'border-teal-500 dark:border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121C2D] text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-6 h-6 border-2 border-current mb-1.5 rounded-lg" />
                      <span className="text-xs font-medium">Rounded</span>
                    </button>

                    {/* Rectangle */}
                    <button
                      type="button"
                      onClick={() => setLogoShape('Rectangle')}
                      className={`flex flex-col items-center justify-center py-3 px-3 rounded-xl border transition-all ${
                        logoShape === 'Rectangle'
                          ? 'border-teal-500 dark:border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121C2D] text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-8 h-5 border-2 border-current mb-1.5 rounded-md" />
                      <span className="text-xs font-medium">Rectangle</span>
                    </button>

                  </div>
                </div>

                {/* 2. Color Mode */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Color Mode
                  </label>
                  <div className="inline-flex p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121C2D] gap-1">
                    
                    <button
                      type="button"
                      onClick={() => setColorMode('Light')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        colorMode === 'Light'
                          ? 'bg-white dark:bg-[#0E1624] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setColorMode('Dark')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        colorMode === 'Dark'
                          ? 'bg-white dark:bg-[#0E1624] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setColorMode('System')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        colorMode === 'System'
                          ? 'bg-white dark:bg-[#0E1624] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5 text-teal-500" />
                      <span>System</span>
                    </button>

                  </div>
                </div>

                {/* 3. Theme Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Theme Palette
                    </label>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Active: <span className="text-slate-800 dark:text-white font-semibold">{selectedTheme}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {THEMES.map((th) => {
                      const isSelected = selectedTheme === th.id;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setSelectedTheme(th.id)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-teal-500 dark:border-teal-400 bg-teal-50/40 dark:bg-teal-950/30 shadow-xs ring-1 ring-teal-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121C2D] hover:border-slate-300'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] shadow-xs"
                            style={{ backgroundColor: th.primary }}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>

                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                            {th.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Remove Branding Toggle */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Remove Healthdock branding
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Hide "Powered by Healthdock" badge on patient booking pages
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRemoveBranding(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      removeBranding ? 'bg-teal-600 dark:bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        removeBranding ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* ========================================================
            RIGHT COLUMN: LIVE BOOKING PAGE PREVIEW (STEP 1 ONLY)
           ======================================================== */}
        <div className="xl:col-span-6 sticky top-24 space-y-3">
          
          {/* Preview Header: Meta info */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold font-serif text-slate-700 dark:text-slate-300">
                Live Interactive Preview
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {layoutStyle === 'SPLIT_2_COL' ? 'Split 2-Column' : 'Centered Card'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {cornerRadius} • {bgStyle}
            </span>
          </div>

          {/* Background Container Wrapper for Live Preview */}
          <div
            className={`w-full p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden transition-all duration-300 min-h-[520px] flex flex-col justify-between ${
              isPreviewDark ? 'bg-[#071224]' : 'bg-[#F8FAFC]'
            }`}
            style={{
              background:
                bgStyle === 'Mesh Gradient'
                  ? `radial-gradient(circle at 50% 18%, ${activeThemeObj.primary}22, ${isPreviewDark ? '#071224' : '#F8FAFC'} 70%)`
                  : bgStyle === 'Dot Grid'
                  ? `radial-gradient(${isPreviewDark ? '#334155' : '#cbd5e1'} 1px, transparent 1px)`
                  : undefined,
              backgroundSize: bgStyle === 'Dot Grid' ? '20px 20px' : undefined,
            }}
          >
            {/* Top Brand Navbar Mockup (matches PublicBookingPage header) */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0B192C]/70 backdrop-blur-md px-3.5 sm:px-4 py-2.5 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: activeThemeObj.primary }}
                >
                  <Cross className="w-3 h-3 stroke-[2.8]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-[11px] tracking-tight text-[#0B192C] dark:text-white leading-none">
                    {removeBranding ? (pageName || 'Online Scheduling') : 'HealthDock'}
                  </span>
                  <span 
                    className="text-[8px] font-sans leading-tight font-medium"
                    style={{ color: activeThemeObj.primary }}
                  >
                    {removeBranding ? 'Doctor Consultation' : 'Patient Booking'}
                  </span>
                </div>
              </div>

              {/* Security badge & Color mode indicator */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[9px] font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>DPDP Act 2026</span>
                </div>
                <div className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 text-[10px]">
                  {isPreviewDark ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3" />}
                </div>
              </div>
            </div>

            {/* Main Booking Container - Step 1 Only (Exact replica of PublicBookingPage) */}
            <div className={`w-full mx-auto my-auto transition-all duration-200 ${
              layoutStyle === 'SPLIT_2_COL' ? 'max-w-2xl' : 'max-w-md'
            }`}>
              <div className={`overflow-hidden ${getRadiusClass('card')} ${getCardFinishClass()} animate-in fade-in zoom-in-95 duration-200`}>
                
                {/* Cover Banner if configured */}
                {coverBannerUrl && (
                  <div className="w-full h-28 sm:h-36 overflow-hidden relative">
                    <img src={coverBannerUrl} alt="Clinic Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                )}

                <div className={`p-5 sm:p-7 ${
                  layoutStyle === 'SPLIT_2_COL' ? 'grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-left' : 'text-center space-y-5'
                }`}>
                  
                  {/* Left Column in Split / Top in Centered */}
                  <div className={layoutStyle === 'SPLIT_2_COL' ? 'md:col-span-7 space-y-4' : 'space-y-4'}>
                    
                    {/* Doctor Picture / Logo with custom logo_shape */}
                    <div className={`flex flex-col ${layoutStyle === 'SPLIT_2_COL' ? 'items-start' : 'items-center'} ${coverBannerUrl ? '-mt-12 sm:-mt-14 relative z-10' : ''}`}>
                      <div className="relative">
                        <div 
                          className={`border-4 flex items-center justify-center font-serif font-bold text-2xl shadow-xl overflow-hidden ${getLogoShapeClasses()}`}
                          style={{ 
                            backgroundColor: `${activeThemeObj.primary}15`, 
                            borderColor: `${activeThemeObj.primary}40`, 
                            color: activeThemeObj.primary 
                          }}
                        >
                          {logoUrl ? (
                            <img src={logoUrl} alt={doctorInfo.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{doctorInfo.name?.charAt(0)?.toUpperCase() || 'D'}</span>
                          )}
                        </div>
                        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#101927] flex items-center justify-center text-white" title="Doctor Available">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>

                      {/* Name & Specialty */}
                      <h1 className="text-lg sm:text-xl font-bold font-serif text-[#0B192C] dark:text-white mt-3 tracking-tight">
                        {pageName || doctorInfo.name}
                      </h1>
                      <p className="text-xs font-semibold tracking-wide mt-0.5 uppercase" style={{ color: activeThemeObj.primary }}>
                        {doctorInfo.specialty} • {doctorInfo.qualification}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {doctorInfo.experience_years}+ years clinical experience • {doctorInfo.organization_name}
                      </p>
                    </div>

                    {/* Welcome message from backend description */}
                    <div className={`p-3.5 ${getRadiusClass('box')} bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 ${layoutStyle === 'SPLIT_2_COL' ? 'text-left' : 'text-center'}`}>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-serif leading-relaxed italic">
                        "{description || 'Welcome to the appointment, please book your appointment.'}"
                      </p>
                    </div>

                  </div>

                  {/* Right Column in Split / Bottom in Centered */}
                  <div className={layoutStyle === 'SPLIT_2_COL' ? 'md:col-span-5 space-y-4 md:border-l md:border-slate-200/60 dark:md:border-slate-800/60 md:pl-6' : 'space-y-4'}>
                    
                    {/* Quick Consultation highlights */}
                    <div className="grid grid-cols-2 gap-2.5 text-left">
                      <div className={`p-3 ${getRadiusClass('box')} border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 flex items-center gap-2`}>
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: activeThemeObj.primary }} />
                        <div>
                          <span className="text-[10px] text-slate-400 block">Consultation Fee</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">₹{doctorInfo.consultation_fee}</span>
                        </div>
                      </div>
                      <div className={`p-3 ${getRadiusClass('box')} border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 flex items-center gap-2`}>
                        <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: activeThemeObj.primary }} />
                        <div>
                          <span className="text-[10px] text-slate-400 block">Data Protection</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">DPDP 2026 Safe</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Action Button: Book Appointment */}
                    <button
                      type="button"
                      id="btn-book-now"
                      style={getBtnBgStyle()}
                      className={`w-full py-3.5 px-5 ${getRadiusClass('button')} active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-xl flex items-center justify-center gap-2 transition-all hover:opacity-95`}
                    >
                      <span>Book Appointment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Bottom branding footer */}
            {!removeBranding && (
              <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <Sparkles className="w-3 h-3 text-teal-500" />
                <span>Powered by <strong className="font-semibold text-slate-600 dark:text-slate-300">Healthdock</strong> • Independent Medical Software</span>
              </div>
            )}

          </div>

        </div>

      </div>

    </main>
  );
}
