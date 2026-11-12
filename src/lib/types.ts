export type PropertyType =
  | 'Apartment'
  | 'Villa'
  | 'Cabin'
  | 'House'
  | 'Studio'
  | 'Chalet'
  | 'Bungalow';

export type PropertyStatus = 'active' | 'inactive' | 'maintenance';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  nightlyRate: number;
  cleaningFee: number;
  status: PropertyStatus;
  image: string;
  amenities: string[];
  description: string;
  rating: number;
  reviews: number;
  createdAt: string;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked-in'
  | 'completed'
  | 'cancelled';

export type BookingSource = 'Airbnb' | 'Booking.com' | 'Direct' | 'Vrbo';

export interface Reservation {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  status: ReservationStatus;
  source: BookingSource;
  notes?: string;
  createdAt: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  joinedAt: string;
  notes?: string;
  vip?: boolean;
  company?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  profile: {
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    bio: string;
  };
  preferences: {
    theme: ThemeMode;
    weekStartsOn: 0 | 1;
    currency: 'USD' | 'EUR' | 'GBP';
    compact: boolean;
    reduceMotion: boolean;
  };
  notifications: {
    newBookings: boolean;
    cancellations: boolean;
    payments: boolean;
    reviews: boolean;
    weeklyDigest: boolean;
    productUpdates: boolean;
  };
}

export interface AppData {
  properties: Property[];
  reservations: Reservation[];
  guests: Guest[];
  settings: Settings;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  kind: 'booking' | 'payment' | 'review' | 'alert';
  read: boolean;
}
