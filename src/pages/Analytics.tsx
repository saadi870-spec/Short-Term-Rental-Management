import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BedDouble, Gauge, TrendingUp, Wallet } from 'lucide-react';
import {
  buildSeries,
  getRangeBounds,
  percentChange,
  previousPeriodSummary,
  propertyPerformance,
  RANGE_LABELS,
  RANGE_OPTIONS,
  sourceBreakdown,
  summarize,
  type RangeKey,
} from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { StatCard } from '@/components/StatCard';
import { ChartTooltip } from '@/components/ChartTooltip';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Progress,
  Segmented,
  Select,
} from '@/components/ui';

const SOURCE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b'];

export default function Analytics() {
  const { properties, reservations, isDark, money, moneyCompact } = useApp();
  const [range, setRange] = useState<RangeKey>('6m');
  const [propertyFilter, setPropertyFilter] = useState('all');

  const scopedPropertyId = propertyFilter === 'all' ? undefined : propertyFilter;
  const bounds = getRangeBounds(range);
  const current = summarize(reservations, properties, bounds.start, bounds.end, scopedPropertyId);
  const previous = previousPeriodSummary(reservations, properties, range, scopedPropertyId);
  const series = buildSeries(reservations, properties, range, scopedPropertyId);
  const sources = sourceBreakdown(
    reservations,
    properties,
    bounds.start,
    bounds.end,
    scopedPropertyId,
  );
  const performance = propertyPerformance(reservations, properties, bounds.start, bounds.end).filter(
    (entry) => propertyFilter === 'all' || entry.property.id === propertyFilter,
  );
  const sourceTotal = sources.reduce((total, source) => total + source.value, 0);

  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const occupancyAverage =
    series.reduce((total, point) => total + point.occupancy, 0) / Math.max(1, series.length);

  const scopeLabel =
    propertyFilter === 'all'
      ? 'Entire portfolio'
      : properties.find((property) => property.id === propertyFilter)?.name ?? 'Property';

  return (
    <div>
      <PageHeader
        title="Analytics"
        description={`${RANGE_LABELS[range]} · ${scopeLabel}`}
        actions={
          <>
            <Select
              value={propertyFilter}
              onChange={(event) => setPropertyFilter(event.target.value)}
              aria-label="Filter analytics by property"
              className="w-full sm:w-48"
            >
              <option value="all">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
            <Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={money(current.revenue)}
          icon={Wallet}
          iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
          delta={percentChange(current.revenue, previous.revenue)}
          hint="vs previous period"
        />
        <StatCard
          label="Occupancy"
          value={`${current.occupancy.toFixed(1)}%`}
          icon={Gauge}
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          delta={percentChange(current.occupancy, previous.occupancy)}
          hint={`${occupancyAverage.toFixed(0)}% average in range`}
        />
        <StatCard
          label="Avg. daily rate"
          value={money(current.adr)}
          icon={TrendingUp}
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
          delta={percentChange(current.adr, previous.adr)}
          hint="per occupied night"
        />
        <StatCard
          label="Booked nights"
          value={current.nights.toLocaleString('en-US')}
          icon={BedDouble}
          iconClass="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
          delta={percentChange(current.nights, previous.nights)}
          hint={`${current.bookings} reservations`}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Revenue & booking volume
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {money(sourceTotal)} from {series.reduce((total, point) => total + point.bookings, 0)} reservations
              </p>
            </div>
            <Badge tone="indigo">{RANGE_LABELS[range]}</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 6, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
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
                  minTickGap={16}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickFormatter={moneyCompact}
                  width={62}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip money={money} />}
                  cursor={{ stroke: '#6366f1', strokeDasharray: '4 4' }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="bookings"
                  name="Bookings"
                  fill={isDark ? '#334155' : '#e2e8f0'}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fill="url(#analyticsRevenue)"
                  activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Occupancy trend</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Share of available nights booked
            </p>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="occupancyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
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
                  minTickGap={12}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickFormatter={(value: number) => `${value}%`}
                  width={42}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  name="Occupancy"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#occupancyFill)"
                  activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Average in range</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {occupancyAverage.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Best period</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {[...series].sort((a, b) => b.occupancy - a.occupancy)[0]?.fullLabel ?? '—'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Property performance</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Revenue and occupancy by listing
              </p>
            </div>
            <Badge tone="slate">{performance.length} properties</Badge>
          </div>
          {performance.length === 0 ? (
            <EmptyState
              icon={BedDouble}
              title="No performance data"
              description="Once bookings land in this range, per-property metrics will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                    <th className="px-5 py-2.5 font-semibold">Property</th>
                    <th className="px-3 py-2.5 font-semibold">Nights</th>
                    <th className="px-3 py-2.5 font-semibold">Occupancy</th>
                    <th className="px-3 py-2.5 text-right font-semibold">ADR</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {performance.slice(0, 6).map((entry, index) => (
                    <tr key={entry.property.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold',
                              index === 0
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                            )}
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                              {entry.property.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {entry.property.city} · {entry.bookings} bookings
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{entry.nights}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={entry.occupancy} className="w-16" />
                          <span className="text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                            {entry.occupancy.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-xs tabular-nums text-slate-600 dark:text-slate-300">
                        {money(entry.adr)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                        {money(entry.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Channel mix</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Revenue by booking source</p>
          </div>
          <div className="mx-auto h-[190px] w-full max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={82}
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
          <ul className="space-y-2.5">
            {sources.map((source, index) => {
              const share = sourceTotal ? (source.value / sourceTotal) * 100 : 0;
              return (
                <li key={source.name} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                    />
                    <span className="text-slate-600 dark:text-slate-300">{source.name}</span>
                    <span className="text-slate-400">{source.count}</span>
                    <span className="ml-auto font-semibold tabular-nums text-slate-900 dark:text-white">
                      {money(source.value)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${share}%`,
                        backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Total revenue</span>
            <span className="font-semibold text-slate-900 dark:text-white">{money(sourceTotal)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
