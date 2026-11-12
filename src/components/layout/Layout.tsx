import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { settings } = useApp();

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-[268px]">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main
          className={cn(
            'mx-auto w-full max-w-[1500px] flex-1 px-4 sm:px-6 lg:px-8',
            settings.preferences.compact ? 'py-4 lg:py-5' : 'py-6 lg:py-8',
          )}
        >
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-slate-200/70 px-4 py-4 text-center text-xs text-slate-400 dark:border-slate-800/70 dark:text-slate-500 sm:px-6 lg:px-8">
          StayPilot · Portfolio demo · Data is stored in your browser
        </footer>
      </div>
    </div>
  );
}
