import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MarketingPage from '../components/MarketingPage';

export default function HomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  // If logged in, prevent rendering the official marketing page while redirecting
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B192C]">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1">
        <MarketingPage />
      </main>
    </div>
  );
}
