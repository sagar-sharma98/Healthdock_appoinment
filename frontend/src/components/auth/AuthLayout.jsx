import React from 'react';
import AuthLeftPanel from './AuthLeftPanel';
import { Cross, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function AuthLayout({ children }) {
  const { liveToast, setLiveToast } = useApp();

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex w-full bg-slate-50 dark:bg-[#071224] text-slate-800 dark:text-slate-100 transition-colors relative">
      
      {/* Toast Feedback */}
      {liveToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0B192C] text-white p-4 rounded-2xl shadow-2xl border border-teal-500/40 flex items-start gap-3 max-w-md animate-slide-down">
          <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-extrabold text-teal-300 text-sm font-display">{liveToast.title}</h4>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{liveToast.message}</p>
          </div>
          <button 
            onClick={() => setLiveToast(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Left Product Details Showcase (Compact, strictly no scrolling) */}
      <AuthLeftPanel />

      {/* Right Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-10 lg:p-12 xl:p-16 relative overflow-y-auto">
        
        {/* Mobile Logo Only (no Back to Website, no theme toggle) */}
        <div className="lg:hidden flex items-center justify-center w-full mb-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
              <Cross className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="font-stylish font-extrabold text-lg text-[#0B192C] dark:text-white">
              HealthDock
            </span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
