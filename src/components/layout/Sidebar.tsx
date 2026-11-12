import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CalendarCheck2,
  CalendarDays,
  LayoutDashboard,
  Settings2,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import { Avatar } from '@/components/ui';

const WORKSPACE = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/reservations', label: 'Reservations', icon: CalendarCheck2, badge: 'pending' as const },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/guests', label: 'Guests', icon: Users },
];

const INSIGHTS = [
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings2 },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { reservations, properties, settings } = useApp();
  const toast = useToast();
  const pendingCount = reservations.filter((reservation) => reservation.status === 'pending').length;
  const activeCount = properties.filter((property) => property.status === 'active').length;

  const renderLink = ({
    to,
    label,
    icon: Icon,
    end,
    badge,
  }: {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    end?: boolean;
    badge?: 'pending';
  }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
            : 'text-slate-400 hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={cn('shrink-0', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
          <span className="truncate">{label}</span>
          {badge === 'pending' && pendingCount > 0 && (
            <span
              className={cn(
                'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-amber-400/15 text-amber-300',
              )}
            >
              {pendingCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col bg-[#111827] transition-transform duration-300 ease-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden="true">
                <path d="M12 3.2 20.1 21l-8.1-5.2L3.9 21 12 3.2Z" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-tight text-white">StayPilot</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Rental OS
              </span>
            </span>
          </NavLink>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Workspace
          </p>
          <nav className="space-y-1">{WORKSPACE.map(renderLink)}</nav>

          <p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Insights
          </p>
          <nav className="space-y-1">{INSIGHTS.map(renderLink)}</nav>

          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-indigo-300">
              <Sparkles size={14} />
              <span className="text-xs font-semibold">Portfolio Pro</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {activeCount} active {activeCount === 1 ? 'property' : 'properties'} on your plan.
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
                style={{ width: `${Math.min(100, (activeCount / 12) * 100)}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                toast.info('Portfolio Pro', 'You are already on the Pro plan — billing opens in the full product.')
              }
              className="mt-3 w-full rounded-lg bg-white/10 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              Manage plan
            </button>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/5 p-3">
          <NavLink
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5"
          >
            <Avatar name={settings.profile.name} size="md" className="ring-slate-900" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-white">
                {settings.profile.name}
              </span>
              <span className="block truncate text-xs text-slate-400">{settings.profile.role}</span>
            </span>
            <Settings2 size={16} className="text-slate-500" />
          </NavLink>
        </div>
      </aside>
    </>
  );
}
