import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Cross, Sun, Moon } from 'lucide-react';
import AppSidebar from '../components/common/AppSidebar';
import { useApp } from '../context/AppContext';

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useApp();

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-[#F8FAFC] dark:bg-[#071224] text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Mobile Top Navigation Bar (Visible only on mobile < md) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B192C] text-white border-b border-slate-800 z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-sm">
              <Cross className="w-3.5 h-3.5 stroke-[2.8]" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bold text-xs tracking-tight text-white leading-tight">
                HealthDock
              </span>
              <span className="text-[9px] tracking-wide text-teal-400 leading-tight">
                Appointment
              </span>
            </div>
          </Link>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 text-teal-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </header>

      {/* Desktop Sidebar (Permanent on >= md) */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <AppSidebar />
      </div>

      {/* Mobile Drawer Sidebar (Slide-over drawer on < md) */}
      <AppSidebar
        isMobile
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
