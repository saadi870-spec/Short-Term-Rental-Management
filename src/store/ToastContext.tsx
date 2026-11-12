import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

interface ToastContextValue {
  toast: ToastApi;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastKind, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: {
    icon: CheckCircle2,
    ring: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: AlertTriangle,
    ring: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    iconColor: 'text-rose-500',
  },
  info: {
    icon: Info,
    ring: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    iconColor: 'text-indigo-500',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      counter.current += 1;
      const id = counter.current;
      setItems((current) => [...current.slice(-3), { id, kind, title, description }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      toast: {
        success: (title, description) => push('success', title, description),
        error: (title, description) => push('error', title, description),
        info: (title, description) => push('info', title, description),
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end">
        {items.map((item) => {
          const style = STYLES[item.kind];
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lift dark:border-slate-700 dark:bg-slate-900"
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', style.ring)}>
                <Icon className="h-4.5 w-4.5" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(item.id)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context.toast;
}
