import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bell,
  Database,
  Download,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Sun,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { Settings as SettingsType, ThemeMode } from '@/lib/types';
import { cn, fmtDate } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Select, Textarea, Toggle } from '@/components/ui';
import { ConfirmDialog } from '@/components/Modal';

type TabKey = 'profile' | 'preferences' | 'notifications' | 'data';

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'preferences', label: 'Preferences', icon: Palette },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'data', label: 'Data & storage', icon: Database },
];

const profileSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(6, 'Enter a contact number'),
  company: z.string().max(80, 'Keep it under 80 characters'),
  role: z.string().max(80, 'Keep it under 80 characters'),
  bio: z.string().max(500, 'Keep your bio under 500 characters'),
});

type ProfileValues = z.infer<typeof profileSchema>;

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; description: string; icon: LucideIcon }> = [
  { value: 'light', label: 'Light', description: 'Bright, airy interface', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Low-light friendly', icon: Moon },
  { value: 'system', label: 'System', description: 'Match your device', icon: Monitor },
];

const NOTIFICATION_OPTIONS: Array<{
  key: keyof SettingsType['notifications'];
  label: string;
  description: string;
}> = [
  { key: 'newBookings', label: 'New bookings', description: 'Get notified when a guest confirms a stay.' },
  { key: 'cancellations', label: 'Cancellations', description: 'Alert me when a booking is cancelled or amended.' },
  { key: 'payments', label: 'Payments & payouts', description: 'Payout confirmations and failed payment alerts.' },
  { key: 'reviews', label: 'Guest reviews', description: 'New reviews and rating changes across listings.' },
  { key: 'weeklyDigest', label: 'Weekly digest', description: 'A Monday summary of occupancy and revenue.' },
  { key: 'productUpdates', label: 'Product updates', description: 'New StayPilot features and release notes.' },
];

export default function Settings() {
  const { settings, updateSettings, exportData, resetDemoData, properties, reservations, guests } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>('profile');
  const [resetOpen, setResetOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: settings.profile,
  });

  const storageSize = useMemo(() => {
    try {
      const raw = localStorage.getItem('staypilot.data.v1');
      return raw ? ((new Blob([raw]).size / 1024).toFixed(1)) : '0.0';
    } catch {
      return '0.0';
    }
  }, [properties, reservations, guests, settings]);

  const onSaveProfile = (values: ProfileValues) => {
    updateSettings({ profile: values });
    reset(values);
    toast.success('Profile saved', 'Your details have been updated.');
  };

  const setPreference = <K extends keyof SettingsType['preferences'],>(
    key: K,
    value: SettingsType['preferences'][K],
  ) => {
    updateSettings({ preferences: { [key]: value } });
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, workspace preferences and demo data."
      />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-card dark:border-slate-800 dark:bg-slate-900 lg:h-fit lg:flex-col">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition lg:text-sm',
                  active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                )}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {tab === 'profile' && (
            <Card className="p-5 sm:p-6">
              <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-center">
                <Avatar name={settings.profile.name} size="xl" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {settings.profile.name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {settings.profile.role} · {settings.profile.company}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Profile details appear in the sidebar, navbar and exported reports.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast.info('Avatar uploads disabled', 'This demo generates initials from your name instead.')
                  }
                >
                  Change photo
                </Button>
              </div>

              <form id="profile-form" onSubmit={handleSubmit(onSaveProfile)} className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="profile-name" error={errors.name?.message}>
                  <Input id="profile-name" invalid={Boolean(errors.name)} {...register('name')} />
                </Field>
                <Field label="Email" htmlFor="profile-email" error={errors.email?.message}>
                  <Input id="profile-email" type="email" invalid={Boolean(errors.email)} {...register('email')} />
                </Field>
                <Field label="Phone" htmlFor="profile-phone" error={errors.phone?.message}>
                  <Input id="profile-phone" invalid={Boolean(errors.phone)} {...register('phone')} />
                </Field>
                <Field label="Company" htmlFor="profile-company" error={errors.company?.message}>
                  <Input id="profile-company" {...register('company')} />
                </Field>
                <Field label="Role" htmlFor="profile-role" error={errors.role?.message}>
                  <Input id="profile-role" {...register('role')} />
                </Field>
                <div className="hidden sm:block" />
                <Field label="Bio" htmlFor="profile-bio" error={errors.bio?.message} className="sm:col-span-2">
                  <Textarea id="profile-bio" rows={3} {...register('bio')} />
                </Field>

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:col-span-2">
                  <Button type="submit" disabled={!isDirty}>
                    <Save size={15} />
                    Save changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!isDirty}
                    onClick={() => reset(settings.profile)}
                  >
                    Discard
                  </Button>
                  <span className="ml-auto text-xs text-slate-400">
                    Last updated {fmtDate(new Date(), 'MMM d, yyyy')}
                  </span>
                </div>
              </form>
            </Card>
          )}

          {tab === 'preferences' && (
            <div className="space-y-5">
              <Card className="p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Appearance</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Theme changes apply instantly and are remembered on this device.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = settings.preferences.theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPreference('theme', option.value)}
                        className={cn(
                          'rounded-xl border p-4 text-left transition',
                          active
                            ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-500/20 dark:border-indigo-500/50 dark:bg-indigo-500/10'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg',
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                          )}
                        >
                          <Icon size={17} />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{option.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Regional & display</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Currency" htmlFor="currency" hint="Applies to every monetary value in the app">
                    <Select
                      id="currency"
                      value={settings.preferences.currency}
                      onChange={(event) =>
                        setPreference('currency', event.target.value as SettingsType['preferences']['currency'])
                      }
                    >
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                    </Select>
                  </Field>
                  <Field label="Week starts on" htmlFor="week-start" hint="Used by the calendar">
                    <Select
                      id="week-start"
                      value={String(settings.preferences.weekStartsOn)}
                      onChange={(event) => setPreference('weekStartsOn', Number(event.target.value) === 0 ? 0 : 1)}
                    >
                      <option value="1">Monday</option>
                      <option value="0">Sunday</option>
                    </Select>
                  </Field>
                </div>

                <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <Toggle
                    label="Compact layout"
                    description="Tighter page spacing so more rows fit on screen."
                    checked={settings.preferences.compact}
                    onChange={(checked) => setPreference('compact', checked)}
                  />
                  <Toggle
                    label="Reduce motion"
                    description="Minimise animations and transitions across the dashboard."
                    checked={settings.preferences.reduceMotion}
                    onChange={(checked) => setPreference('reduceMotion', checked)}
                  />
                </div>
              </Card>
            </div>
          )}

          {tab === 'notifications' && (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Email notifications</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Choose what lands in {settings.profile.email}. Changes save automatically.
                  </p>
                </div>
                <Badge tone="emerald" dot>
                  Demo preferences
                </Badge>
              </div>
              <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {NOTIFICATION_OPTIONS.map((option) => (
                  <Toggle
                    key={option.key}
                    label={option.label}
                    description={option.description}
                    checked={settings.notifications[option.key]}
                    onChange={(checked) =>
                      updateSettings({
                        notifications: { ...settings.notifications, [option.key]: checked },
                      })
                    }
                  />
                ))}
              </div>
            </Card>
          )}

          {tab === 'data' && (
            <div className="space-y-5">
              <Card className="p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Demo data</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  StayPilot runs entirely in your browser. Properties, reservations, guests and settings are
                  stored in LocalStorage under <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">staypilot.data.v1</code>.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Properties', value: properties.length },
                    { label: 'Reservations', value: reservations.length },
                    { label: 'Guests', value: guests.length },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">Approximate storage used: {storageSize} KB</p>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Export & reset</h2>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Download a JSON snapshot</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Includes properties, bookings, guests and preferences.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      exportData();
                      toast.success('Snapshot exported', 'Your StayPilot data is downloading as JSON.');
                    }}
                  >
                    <Download size={15} /> Export data
                  </Button>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Reset demo data</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Restores the sample portfolio and clears any changes you have made.
                    </p>
                  </div>
                  <Button variant="danger" onClick={() => setResetOpen(true)}>
                    <RotateCcw size={15} /> Reset data
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemoData();
          toast.success('Demo data reset', 'The sample portfolio has been restored.');
        }}
        title="Reset all demo data?"
        description="Every property, reservation, guest and preference will return to the original sample data. Your current changes cannot be recovered."
        confirmLabel="Reset everything"
      />
    </div>
  );
}
