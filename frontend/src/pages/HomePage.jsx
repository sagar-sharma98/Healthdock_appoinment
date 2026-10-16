import React from 'react';
import Navbar from '../components/Navbar';
import MarketingPage from '../components/MarketingPage';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1">
        <MarketingPage />
      </main>
    </div>
  );
}
