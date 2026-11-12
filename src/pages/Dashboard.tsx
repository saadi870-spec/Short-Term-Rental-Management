import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns';
import {
  ArrowRight,
  CalendarCheck2,
  Download,
  Gauge,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { buildSeries, percentChange, sourceBreakdown, summarize } from '@/lib/analytics';
import { exportReservationsCsv } from '@/lib/csv';
import { fmtDate, iso } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import { StatCard } from '@/components/StatCard';
import { ReservationDetailsModal } from '@/components/ReservationDetailsModal';
import { ChartTooltip } from '@/components/ChartTooltip';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Segmented,
  Skeleton,
  StatusBadge,
} from '@/components/ui';

const SOURCE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b'];

export default function Dashboard() {
  const {
    properties,
    reservations,
    guests,
    loading,
    money,
    moneyCompact,
    isDark,
    settings,
    propertyById,
    guestById,
  } = useApp();
  const toast = useToast();
  const [chartRange, setChartRange] = useState<'6m' | '12m'>('6m');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const today = new Date();
  const monthStart = iso(startOfMonth(today));
  const monthEnd = iso(endOfMonth(today));
  const current = summarize(reservations, properties, monthStart, monthEnd);
  const previous = summarize(
    reservations,
    properties,
    iso(startOfMonth(subMonths(today, 1))),
    iso(endOfMonth(subMonths(today, 1))),
  );

  const series = buildSeries(reservations, properties, chartRange);
  const seriesTotal = series.reduce((total, point) => total + point.revenue, 0);
  const occupancySeries = buildSeries(reservations, properties, '6m');
  const averageOccupancy =
    occupancySeries.reduce((total, point) => total + point.occupancy, 0) / occupancySeries.length;

  const sources = sourceBreakdown(reservations, properties, iso(subDays(today, 90)), iso(today));
  const sourceTotal = sources.reduce((total, source) => total + source.value, 0);

  const arrivals = reservations
    .filter((reservation) => reservation.status !== 'cancelled' && reservation.checkIn >= iso(today))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 5);

  const recent = [...reservations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const firstName = settings.profile.name.split(' ')[0];
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[136px]" />
          ))}
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <Skeleton className="h-[380px] xl:col-span-2" />
          <Skeleton className="h-[380px]" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description={`${format(today, 'EEEE, MMMM d')} · ${properties.length} properties across ${new Set(properties.map((property) => property.country)).size} countries`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                exportReservationsCsv(reservations, propertyById, guestById);
                toast.success('Report exported', 'Your reservations CSV is downloading.');
              }}
            >
              <Download size={16} />
              Export report
            </Button>
            <Link
              to="/reservations?new=1"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              <Plus size={16} />
              New reservation
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={money(current.revenue)}
          icon={Wallet}
          iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
          delta={percentChange(current.revenue, previous.revenue)}
          hint="vs last month"
        />
        <StatCard
          label="Bookings"
          value={String(current.bookings)}
          icon={CalendarCheck2}
          iconClass="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
          delta={percentChange(current.bookings, previous.bookings)}
          hint={`${guests.length} guests in book`}
        />
        <StatCard
          label="Occupancy"
          value={`${current.occupancy.toFixed(1)}%`}
          icon={Gauge}
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          delta={percentChange(current.occupancy, previous.occupancy)}
          hint="portfolio average"
        />
        <StatCard
          label="Avg. daily rate"
          value={money(current.adr)}
          icon={TrendingUp}
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
          delta={percentChange(current.adr, previous.adr)}
          hint="per occupied night"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Revenue overview</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {money(seriesTotal)} booked across the {chartRange === '6m' ? 'last 6 months' : 'last 12 months'}
              </p>
            </div>
            <Segmented
              value={chartRange}
              onChange={setChartRange}
              options={[
                { value: '6m', label: '6M' },
                { value: '12m', label: '12M' },
              ]}
            />
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  dy={8}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickFormatter={moneyCompact}
                  width={62}
                />
                <Tooltip
                  content={<ChartTooltip money={money} />}
                  cursor={{ stroke: '#6366f1', strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Occupancy</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Last 6 months</p>
            </div>
            <Badge tone={averageOccupancy >= 70 ? 'emerald' : 'amber'} dot>
              {averageOccupancy.toFixed(0)}% avg
            </Badge>
          </div>
          <div className="min-h-[230px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancySeries} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickFormatter={(value: number) => `${value}%`}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? '#ffffff08' : '#f1f5f9' }} />
                <Bar dataKey="occupancy" name="Occupancy" radius={[6, 6, 0, 0]} maxBarSize={30}>
                  {occupancySeries.map((entry, index) => (
                    <Cell
                      key={entry.label}
                      fill={index === occupancySeries.length - 1 ? '#4f46e5' : isDark ? '#4338ca' : '#c7d2fe'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Portfolio target</span>
            <span className="font-semibold text-slate-900 dark:text-white">75% occupancy</span>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming arrivals</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Next 5 check-ins on the books</p>
            </div>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Calendar <ArrowRight size={13} />
            </Link>
          </div>
          {arrivals.length === 0 ? (
            <EmptyState
              icon={CalendarCheck2}
              title="No upcoming arrivals"
              description="New bookings will appear here as soon as they come in."
              action={
                <Link
                  to="/reservations?new=1"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white"
                >
                  <Plus size={14} /> Create booking
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {arrivals.map((reservation) => {
                const guest = guestById(reservation.guestId);
                const property = propertyById(reservation.propertyId);
                return (
                  <li key={reservation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(reservation.id)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <Avatar name={guest?.name ?? 'Guest'} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {guest?.name ?? 'Unknown guest'}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {property?.name ?? 'Property'} · {property?.city ?? ''}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400 sm:hidden">
                          {fmtDate(reservation.checkIn, 'MMM d')} – {fmtDate(reservation.checkOut, 'MMM d')} ·{' '}
                          {reservation.nights} nights
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {fmtDate(reservation.checkIn, 'MMM d')} – {fmtDate(reservation.checkOut, 'MMM d')}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {reservation.nights} nights · {reservation.guests} guests
                        </p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                          {money(reservation.total)}
                        </p>
                        <p className="text-[11px] text-slate-400">{reservation.source}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Booking sources</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Last 90 days · {money(sourceTotal)}</p>
          </div>
          <div className="h-[170px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {sources.map((source, index) => (
                    <Cell key={source.name} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip money={money} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-1 space-y-2.5">
            {sources.map((source, index) => (
              <li key={source.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-300">{source.name}</span>
                <span className="text-slate-400">· {source.count}</span>
                <span className="ml-auto font-semibold tabular-nums text-slate-900 dark:text-white">
                  {money(source.value)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent bookings</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Latest activity across your portfolio</p>
          </div>
          <Link
            to="/reservations"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                <th className="px-5 py-2.5 font-semibold">Guest</th>
                <th className="px-5 py-2.5 font-semibold">Property</th>
                <th className="px-5 py-2.5 font-semibold">Stay</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((reservation) => {
                const guest = guestById(reservation.guestId);
                const property = propertyById(reservation.propertyId);
                return (
                  <tr
                    key={reservation.id}
                    onClick={() => setSelectedId(reservation.id)}
                    className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={guest?.name ?? 'Guest'} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {guest?.name ?? 'Unknown'}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">{guest?.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{property?.name ?? '—'}</p>
                      <p className="text-[11px] text-slate-400">{property?.city}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {fmtDate(reservation.checkIn, 'MMM d')} – {fmtDate(reservation.checkOut, 'MMM d')}
                      <span className="block text-[11px] text-slate-400">{reservation.nights} nights</span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                      {money(reservation.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ReservationDetailsModal
        reservationId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
