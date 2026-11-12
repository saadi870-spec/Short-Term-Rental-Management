import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Delta } from './ui';

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  delta,
  hint,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  delta?: number | null;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('card card-hover p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconClass)}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {delta !== undefined && <Delta value={delta} />}
        {hint && <span className="truncate text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </div>
    </div>
  );
}
