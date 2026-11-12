import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarCheck2,
  Check,
  ChevronDown,
  CreditCard,
  Menu,
  Moon,
  Search,
  Star,
  Sun,
  TriangleAlert,
} from 'lucide-react';
import { seedNotifications } from '@/lib/mock';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { Avatar } from '@/components/ui';
import type { AppNotification } from '@/lib/types';

const KIND_ICON = {
  booking: CalendarCheck2,
  payment: CreditCard,
  review: Star,
  alert: TriangleAlert,
} as const;

const KIND_STYLE = {
  booking: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  payment: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  review: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  alert: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
} as const;

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { settings, isDark, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const unread = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/reservations?q=${encodeURIComponent(trimmed)}` : '/reservations');
  };

  const markAllRead = () =>
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="icon-btn lg:hidden"
        >
          <Menu size={20} />
        </button>

        <form onSubmit={submitSearch} className="relative hidden w-full max-w-sm sm:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guests, properties, bookings…"
            aria-label="Search reservations"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-16 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:bg-slate-900"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800">
            ⌘K
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="icon-btn"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((open) => !open)}
              className="icon-btn relative"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              aria-expanded={notifOpen}
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950" />
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift dark:border-slate-700 dark:bg-slate-900 sm:w-96">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                    {unread > 0 && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {unread} new
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    <Check size={13} /> Mark all read
                  </button>
                </div>
                <div className="max-h-[340px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                  {notifications.map((notification) => {
                    const Icon = KIND_ICON[notification.kind];
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() =>
                          setNotifications((current) =>
                            current.map((item) =>
                              item.id === notification.id ? { ...item, read: true } : item,
                            ),
                          )
                        }
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60',
                          !notification.read && 'bg-indigo-50/40 dark:bg-indigo-500/5',
                        )}
                      >
                        <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', KIND_STYLE[notification.kind])}>
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </span>
                            {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {notification.description}
                          </span>
                          <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            {notification.time}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Link
                  to="/settings"
                  onClick={() => setNotifOpen(false)}
                  className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60"
                >
                  Manage notification preferences
                </Link>
              </div>
            )}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

          <Link
            to="/settings"
            className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Avatar name={settings.profile.name} size="sm" />
            <span className="hidden leading-tight sm:block">
              <span className="block max-w-[140px] truncate text-xs font-semibold text-slate-900 dark:text-white">
                {settings.profile.name}
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                {settings.profile.role}
              </span>
            </span>
            <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
          </Link>
        </div>
      </div>
    </header>
  );
}
