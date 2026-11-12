import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function iso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function fmtDate(value: string | Date, pattern = 'MMM d, yyyy'): string {
  const date = toDate(value);
  return isValid(date) ? format(date, pattern) : '—';
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(0, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)));
}

export function addDaysISO(value: string, days: number): string {
  return iso(addDays(parseISO(value), days));
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return current ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-fuchsia-500 to-purple-500',
  'from-blue-500 to-indigo-400',
  'from-teal-500 to-emerald-400',
];

export function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 9973;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export const PROPERTY_SWATCHES = [
  { bar: 'bg-indigo-500', soft: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30', dot: 'bg-indigo-500' },
  { bar: 'bg-sky-500', soft: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30', dot: 'bg-sky-500' },
  { bar: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  { bar: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30', dot: 'bg-amber-500' },
  { bar: 'bg-rose-500', soft: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30', dot: 'bg-rose-500' },
  { bar: 'bg-violet-500', soft: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30', dot: 'bg-violet-500' },
  { bar: 'bg-teal-500', soft: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30', dot: 'bg-teal-500' },
  { bar: 'bg-orange-500', soft: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30', dot: 'bg-orange-500' },
];
