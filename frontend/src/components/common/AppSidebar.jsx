import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
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
  CalendarOff,
  ChevronDown,
  LogOut,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AppSidebar({ isMobile = false, isMobileOpen = false, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, doctor, triggerToast } = useApp();

  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sagar Sharma',
    email: 'dr.sagar@healthdock.in',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('healthdock_user') || localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserProfile({
          name: u.full_name || u.name || doctor?.name || 'Dr. Sagar Sharma',
          email: u.email || doctor?.email || 'dr.sagar@healthdock.in',
        });
      } catch (e) {
        console.error(e);
      }
    } else if (doctor) {
      setUserProfile({
        name: doctor.name || 'Dr. Sagar Sharma',
        email: doctor.email || 'dr.sagar@healthdock.in',
      });
    }
  }, [doctor]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showLogoutModal) {
        setShowLogoutModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutModal]);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('healthdock_token');
    localStorage.removeItem('healthdock_user');
    localStorage.removeItem('healthdock_page');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (triggerToast) {
      triggerToast('Logged Out', 'You have been successfully logged out.', 'info');
    }
    navigate('/login');
  };

  const menuItems = [
    {
      id: 'Dashboard',
      icon: LayoutDashboard,
      link: '/dashboard',
      match: (pathname) => pathname === '/dashboard',
    },
    {
      id: 'Bookings',
      icon: BookOpen,
      link: '/bookings',
      match: (pathname) => pathname.startsWith('/bookings'),
    },
    {
      id: 'Availability',
      icon: Clock,
      link: '/availability',
      match: (pathname) => pathname.startsWith('/availability'),
    },
    {
      id: 'Holidays',
      icon: CalendarOff,
      link: '/holidays',
      match: (pathname) => pathname.startsWith('/holidays'),
    },
    {
      id: 'Calendar',
      icon: CalendarIcon,
      link: '/calendar',
      match: (pathname) => pathname.startsWith('/calendar'),
    },

    {
      id: 'Pages',
      icon: FileText,
      link: '/pages',
      match: (pathname) => pathname.startsWith('/pages'),
    },
    {
      id: 'Users',
      icon: Users,
      link: '/users',
      match: (pathname) => pathname.startsWith('/users'),
    },
    {
      id: 'Workflows',
      icon: GitBranch,
      link: '/workflows',
      match: (pathname) => pathname.startsWith('/workflows'),
    },
    {
      id: 'Settings',
      icon: Settings,
      link: '/settings',
      match: (pathname) => pathname.startsWith('/settings'),
    },
  ];

  if (isMobile && !isMobileOpen) {
    return null;
  }

  const sidebarNode = (
    <aside
      className={`${
        isMobile
          ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-300 md:hidden'
          : 'w-64 h-full bg-[#0B192C]'
      } text-slate-300 flex flex-col justify-between border-r border-slate-800 select-none flex-shrink-0 overflow-hidden bg-[#0B192C]`}
    >
      {/* Top Brand & Menus */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
          <Link
            to="/"
            onClick={() => {
              if (isMobile && onMobileClose) onMobileClose();
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
              <Cross className="w-4 h-4 stroke-[2.8]" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bold text-sm tracking-tight text-white leading-tight">
                HealthDock
              </span>
              <span className="text-[10px] tracking-wide text-teal-400 leading-tight">
                Appointment
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">
              v1.0
            </span>
            {isMobile && (
              <button
                type="button"
                onClick={onMobileClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(location.pathname);
            return (
              <Link
                key={item.id}
                to={item.link}
                onClick={() => {
                  if (isMobile && onMobileClose) onMobileClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 font-semibold border-l-2 border-teal-500 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.id}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utility Items */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 text-xs flex-shrink-0">
        {/* Dark Mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-teal-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>Dark Mode</span>
          </div>
          <div
            className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
              theme === 'dark' ? 'bg-teal-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* Upgrade / Pricing Link */}
        <Link
          to="/upgrade"
          onClick={() => {
            if (isMobile && onMobileClose) onMobileClose();
          }}
          className={`w-full px-3 py-2 flex items-center justify-between rounded-xl transition-all cursor-pointer group ${
            location.pathname.startsWith('/upgrade')
              ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30'
              : 'text-teal-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs text-white">Upgrade</span>
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-sm">
            Pro
          </span>
        </Link>

        {/* User Profile Pill at bottom */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-7 h-7 rounded-full bg-teal-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {userProfile.name[0]?.toUpperCase() || 'S'}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {userProfile.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-1.5">
            <button
              type="button"
              id="sidebar-logout-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutModal(true);
              }}
              title="Logout"
              aria-label="Logout"
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0E1624] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/40 p-6 relative animate-in zoom-in-95 duration-200 text-left select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Logout Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6 stroke-[2.2]" />
            </div>

            {/* Title & Description */}
            <h3 className="text-base font-bold font-serif text-[#0B192C] dark:text-white leading-snug">
              Sign out of HealthDock?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Are you sure you want to end your current session? You will need your credentials to log back into your practice cockpit.
            </p>

            {/* Active User Pill */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {userProfile.name[0]?.toUpperCase() || 'S'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {userProfile.name}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Active Doctor Session
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                id="btn-cancel-logout"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-logout"
                onClick={handleConfirmLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-semibold text-white shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );

  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onMobileClose}
        />
        {sidebarNode}
      </>
    );
  }

  return sidebarNode;
}
