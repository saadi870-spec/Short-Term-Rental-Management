import type { TooltipProps } from 'recharts';

const CURRENCY_KEYS = new Set(['revenue', 'adr', 'value', 'total']);

export function ChartTooltip({
  active,
  payload,
  money,
}: TooltipProps<number, string> & { money?: (value: number) => string }) {
  if (!active || !payload || payload.length === 0) return null;
  const firstPayload = payload[0]?.payload as { fullLabel?: string } | undefined;

  return (
    <div className="min-w-[160px] rounded-xl border border-slate-200 bg-white/95 px-3.5 py-3 shadow-lift backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      {firstPayload?.fullLabel && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {firstPayload.fullLabel}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? '');
          const value = typeof item.value === 'number' ? item.value : 0;
          const formatted =
            key === 'occupancy'
              ? `${value.toFixed(1)}%`
              : CURRENCY_KEYS.has(key) && money
                ? money(value)
                : value.toLocaleString('en-US');
          return (
            <div key={`${key}-${item.name}`} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color ?? '#4f46e5' }}
              />
              <span className="capitalize text-slate-500 dark:text-slate-400">{item.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatted}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
