import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createInitialData, defaultSettings } from '@/lib/mock';
import { nightsBetween, uid } from '@/lib/utils';
import type { AppData, Guest, Property, Reservation, Settings } from '@/lib/types';

const STORAGE_KEY = 'staypilot.data.v1';

export type PropertyInput = Omit<Property, 'id' | 'createdAt' | 'rating' | 'reviews'>;
export type ReservationInput = Omit<Reservation, 'id' | 'createdAt' | 'nights'>;
export type GuestInput = Omit<Guest, 'id' | 'joinedAt'>;
export type SettingsPatch = {
  profile?: Partial<Settings['profile']>;
  preferences?: Partial<Settings['preferences']>;
  notifications?: Partial<Settings['notifications']>;
};

function mergeSettings(settings?: Partial<Settings>): Settings {
  return {
    profile: { ...defaultSettings.profile, ...settings?.profile },
    preferences: { ...defaultSettings.preferences, ...settings?.preferences },
    notifications: { ...defaultSettings.notifications, ...settings?.notifications },
  };
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed.properties || !parsed.reservations || !parsed.guests) {
      return createInitialData();
    }
    return {
      properties: parsed.properties,
      reservations: parsed.reservations,
      guests: parsed.guests,
      settings: mergeSettings(parsed.settings),
    };
  } catch {
    return createInitialData();
  }
}

interface AppContextValue {
  properties: Property[];
  reservations: Reservation[];
  guests: Guest[];
  settings: Settings;
  loading: boolean;
  isDark: boolean;
  money: (value: number) => string;
  moneyCompact: (value: number) => string;
  propertyById: (id: string) => Property | undefined;
  guestById: (id: string) => Guest | undefined;
  toggleTheme: () => void;
  addProperty: (input: PropertyInput) => Property;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addReservation: (input: ReservationInput) => Reservation;
  updateReservation: (id: string, patch: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;
  moveReservation: (id: string, newCheckIn: string) => void;
  addGuest: (input: GuestInput) => Guest;
  updateSettings: (patch: SettingsPatch) => void;
  resetDemoData: () => void;
  exportData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [loading, setLoading] = useState(true);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, [data]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = data.settings.preferences.theme;
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'reduce-motion',
      data.settings.preferences.reduceMotion,
    );
  }, [data.settings.preferences.reduceMotion]);

  const currency = data.settings.preferences.currency;

  const money = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(Number.isFinite(value) ? value : 0);
  }, [currency]);

  const moneyCompact = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    return (value: number) => formatter.format(Number.isFinite(value) ? value : 0);
  }, [currency]);

  const propertyIndex = useMemo(
    () => new Map(data.properties.map((property) => [property.id, property])),
    [data.properties],
  );
  const guestIndex = useMemo(
    () => new Map(data.guests.map((guest) => [guest.id, guest])),
    [data.guests],
  );

  const value: AppContextValue = {
    properties: data.properties,
    reservations: data.reservations,
    guests: data.guests,
    settings: data.settings,
    loading,
    isDark,
    money,
    moneyCompact,
    propertyById: (id) => propertyIndex.get(id),
    guestById: (id) => guestIndex.get(id),
    toggleTheme: () =>
      setData((current) => ({
        ...current,
        settings: {
          ...current.settings,
          preferences: {
            ...current.settings.preferences,
            theme: current.settings.preferences.theme === 'dark' ? 'light' : 'dark',
          },
        },
      })),
    addProperty: (input) => {
      const property: Property = {
        ...input,
        id: uid('p'),
        createdAt: new Date().toISOString().slice(0, 10),
        rating: 0,
        reviews: 0,
      };
      setData((current) => ({ ...current, properties: [property, ...current.properties] }));
      return property;
    },
    updateProperty: (id, patch) =>
      setData((current) => ({
        ...current,
        properties: current.properties.map((property) =>
          property.id === id ? { ...property, ...patch } : property,
        ),
      })),
    deleteProperty: (id) =>
      setData((current) => ({
        ...current,
        properties: current.properties.filter((property) => property.id !== id),
        reservations: current.reservations.filter((reservation) => reservation.propertyId !== id),
      })),
    addReservation: (input) => {
      const reservation: Reservation = {
        ...input,
        id: uid('r'),
        nights: nightsBetween(input.checkIn, input.checkOut),
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setData((current) => ({
        ...current,
        reservations: [...current.reservations, reservation].sort((a, b) =>
          a.checkIn.localeCompare(b.checkIn),
        ),
      }));
      return reservation;
    },
    updateReservation: (id, patch) =>
      setData((current) => ({
        ...current,
        reservations: current.reservations.map((reservation) =>
          reservation.id === id ? { ...reservation, ...patch } : reservation,
        ),
      })),
    deleteReservation: (id) =>
      setData((current) => ({
        ...current,
        reservations: current.reservations.filter((reservation) => reservation.id !== id),
      })),
    moveReservation: (id, newCheckIn) =>
      setData((current) => ({
        ...current,
        reservations: current.reservations.map((reservation) => {
          if (reservation.id !== id) return reservation;
          const checkIn = new Date(`${newCheckIn}T00:00:00`);
          checkIn.setDate(checkIn.getDate() + reservation.nights);
          const checkOut = checkIn.toISOString().slice(0, 10);
          return { ...reservation, checkIn: newCheckIn, checkOut };
        }),
      })),
    addGuest: (input) => {
      const guest: Guest = {
        ...input,
        id: uid('g'),
        joinedAt: new Date().toISOString().slice(0, 10),
      };
      setData((current) => ({ ...current, guests: [guest, ...current.guests] }));
      return guest;
    },
    updateSettings: (patch) =>
      setData((current) => ({
        ...current,
        settings: {
          profile: { ...current.settings.profile, ...patch.profile },
          preferences: { ...current.settings.preferences, ...patch.preferences },
          notifications: { ...current.settings.notifications, ...patch.notifications },
        },
      })),
    resetDemoData: () => setData(createInitialData()),
    exportData: () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `staypilot-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}
