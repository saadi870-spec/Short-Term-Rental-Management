import { Link, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import Reservations from '@/pages/Reservations';
import Calendar from '@/pages/Calendar';
import Guests from '@/pages/Guests';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import { Card } from '@/components/ui';

function NotFound() {
  return (
    <Card className="mx-auto max-w-lg px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Compass size={26} />
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        The page you are looking for has checked out. Let’s get you back to the dashboard.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Back to dashboard
      </Link>
    </Card>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="guests" element={<Guests />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
