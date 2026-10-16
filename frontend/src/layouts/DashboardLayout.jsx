import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '../components/common/AppSidebar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] dark:bg-[#071224] text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
