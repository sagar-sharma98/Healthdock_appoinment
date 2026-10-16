import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cross } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] text-white bg-[#0B192C]/95 backdrop-blur-xl border-b border-white/10 shadow-md">
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-3.5 flex items-center justify-between font-serif">
        
        {/* Brand Logo - Placed to far left */}
        <Link to={token ? "/dashboard" : "/"} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-md bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Cross className="w-4.5 h-4.5 stroke-[2.8]" />
          </div>
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-serif font-normal text-xl sm:text-2xl tracking-tight text-white">
              HealthDock
            </span>
            <span className="font-serif font-light text-xs sm:text-sm tracking-wide text-slate-300">
              Appointment
            </span>
          </div>
        </Link>

        {/* Center Nav Links (only on Home) */}
        {isHome && (
          <nav className="hidden lg:flex items-center gap-8 text-xs sm:text-sm font-serif font-light text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#doctor-qr" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#footer" className="hover:text-white transition-colors">Contact</a>
          </nav>
        )}

        {/* Right Action: Login & Signup buttons or Dashboard */}
        <div className="flex items-center gap-3">
          {token ? (
            <Link
              to="/dashboard"
              className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs sm:text-sm font-serif font-normal rounded-md shadow-sm transition-all flex items-center justify-center hover:scale-[1.02]"
            >
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              {/* Button 1: Login */}
              <Link
                to="/login"
                className="text-xs sm:text-sm font-serif font-normal text-slate-200 hover:text-white px-4 py-2 transition-colors rounded-md hover:bg-white/10 border border-transparent hover:border-white/10"
              >
                Login
              </Link>

              {/* Button 2: Signup */}
              <Link
                to="/signup"
                className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs sm:text-sm font-serif font-normal rounded-md shadow-sm transition-all flex items-center justify-center hover:scale-[1.02]"
              >
                <span>Signup</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
