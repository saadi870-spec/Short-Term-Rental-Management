import { addDays, addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import type { AppNotification, AppData, BookingSource, Guest, Property, Reservation, ReservationStatus, Settings } from './types';
import { iso } from './utils';

const IMAGES = {
  skyline:
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=70',
  casa:
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=70',
  cabin:
    'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=70',
  harbour:
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70',
  chalet:
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=70',
  terracotta:
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70',
  canal:
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=70',
  palm:
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=70',
};

const A = 'Air conditioning';

export const PROPERTY_AMENITIES = [
  'Wi-Fi',
  'Kitchen',
  'Pool',
  A,
  'Free parking',
  'Washer',
  'Workspace',
  'Sea view',
  'Fireplace',
  'Hot tub',
  'Pet friendly',
  'Gym',
  'Balcony',
  'BBQ grill',
];

const now = new Date();

function buildProperties(): Property[] {
  return [
    {
      id: 'p1',
      name: 'Skyline Loft',
      type: 'Apartment',
      address: 'Rua da Boavista 42',
      city: 'Lisbon',
      country: 'Portugal',
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      nightlyRate: 185,
      cleaningFee: 45,
      status: 'active',
      image: IMAGES.skyline,
      amenities: ['Wi-Fi', 'Kitchen', A, 'Washer', 'Workspace', 'Balcony'],
      description:
        'A light-filled top-floor loft in the heart of Bairro Alto with a private terrace and sunset views over the Tagus. Walkable to the best restaurants in Lisbon.',
      rating: 4.92,
      reviews: 128,
      createdAt: iso(subMonths(now, 18)),
    },
    {
      id: 'p2',
      name: 'Casa Azul',
      type: 'Villa',
      address: 'Oia Cliffside 7',
      city: 'Santorini',
      country: 'Greece',
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 8,
      nightlyRate: 420,
      cleaningFee: 90,
      status: 'active',
      image: IMAGES.casa,
      amenities: ['Wi-Fi', 'Pool', A, 'Sea view', 'Kitchen', 'Free parking', 'BBQ grill'],
      description:
        'A cliffside villa with an infinity pool carved into the caldera. Three suites, a shaded outdoor kitchen and the best sunset in the Cyclades.',
      rating: 4.97,
      reviews: 214,
      createdAt: iso(subMonths(now, 26)),
    },
    {
      id: 'p3',
      name: 'The Nordic Cabin',
      type: 'Cabin',
      address: 'Fjordveien 12',
      city: 'Tromsø',
      country: 'Norway',
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      nightlyRate: 240,
      cleaningFee: 60,
      status: 'active',
      image: IMAGES.cabin,
      amenities: ['Wi-Fi', 'Fireplace', 'Kitchen', 'Free parking', 'Pet friendly', 'Hot tub'],
      description:
        'A timber cabin on the fjord with floor-to-ceiling windows built for aurora watching. Wood-fired hot tub, sauna and a very good coffee setup.',
      rating: 4.89,
      reviews: 96,
      createdAt: iso(subMonths(now, 14)),
    },
    {
      id: 'p4',
      name: 'Harbour View Suite',
      type: 'Apartment',
      address: 'Cais da Ribeira 118',
      city: 'Porto',
      country: 'Portugal',
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      nightlyRate: 130,
      cleaningFee: 35,
      status: 'active',
      image: IMAGES.harbour,
      amenities: ['Wi-Fi', 'Kitchen', A, 'Washer', 'Workspace'],
      description:
        'A compact design suite overlooking the Douro, two minutes from São Bento station. Built for couples and solo city breaks.',
      rating: 4.85,
      reviews: 187,
      createdAt: iso(subMonths(now, 30)),
    },
    {
      id: 'p5',
      name: 'Alpine Chalet',
      type: 'Chalet',
      address: 'Chemin des Bossons 3',
      city: 'Chamonix',
      country: 'France',
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 10,
      nightlyRate: 380,
      cleaningFee: 110,
      status: 'active',
      image: IMAGES.chalet,
      amenities: ['Wi-Fi', 'Fireplace', 'Hot tub', 'Free parking', 'Kitchen', 'Gym', 'Pet friendly'],
      description:
        'A four-bedroom chalet at the foot of Mont Blanc with a ski room, outdoor hot tub and a long dining table made for groups.',
      rating: 4.94,
      reviews: 143,
      createdAt: iso(subMonths(now, 22)),
    },
    {
      id: 'p6',
      name: 'Terracotta House',
      type: 'House',
      address: 'Derb Jdid 19, Medina',
      city: 'Marrakech',
      country: 'Morocco',
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      nightlyRate: 210,
      cleaningFee: 55,
      status: 'maintenance',
      image: IMAGES.terracotta,
      amenities: ['Wi-Fi', 'Pool', A, 'Kitchen', 'Balcony', 'BBQ grill'],
      description:
        'A restored riad with a courtyard pool, hand-cut zellige and a roof terrace for breakfast. Currently closed for bathroom renovations.',
      rating: 4.88,
      reviews: 74,
      createdAt: iso(subMonths(now, 11)),
    },
    {
      id: 'p7',
      name: 'Canal Studio',
      type: 'Studio',
      address: 'Prinsengracht 265',
      city: 'Amsterdam',
      country: 'Netherlands',
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      nightlyRate: 150,
      cleaningFee: 40,
      status: 'active',
      image: IMAGES.canal,
      amenities: ['Wi-Fi', 'Kitchen', 'Washer', 'Workspace', 'Balcony'],
      description:
        'A canal-house studio with original beams, a reading nook and bikes included. Nine minutes on foot from the Nine Streets.',
      rating: 4.9,
      reviews: 163,
      createdAt: iso(subMonths(now, 9)),
    },
    {
      id: 'p8',
      name: 'Palm Bungalow',
      type: 'Bungalow',
      address: 'Jalan Pantai 8, Canggu',
      city: 'Bali',
      country: 'Indonesia',
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      nightlyRate: 165,
      cleaningFee: 45,
      status: 'inactive',
      image: IMAGES.palm,
      amenities: ['Wi-Fi', 'Pool', A, 'Kitchen', 'Workspace', 'Gym'],
      description:
        'A two-bedroom bungalow surrounded by rice fields, with a plunge pool and a shared co-working pavilion. Paused for the low season.',
      rating: 4.82,
      reviews: 58,
      createdAt: iso(subMonths(now, 6)),
    },
  ];
}

const GUEST_SEED: Array<[string, string, string, string, boolean, string]> = [
  ['Sofia Almeida', 'sofia.almeida@gmail.com', 'Portugal', '+351 912 445 019', true, 'Lumia Studio'],
  ['James Whitfield', 'j.whitfield@outlook.com', 'United Kingdom', '+44 7700 900 118', false, ''],
  ['Amelie Laurent', 'amelie.laurent@gmail.com', 'France', '+33 6 12 44 88 21', true, 'Atelier Nord'],
  ['Lukas Becker', 'lukas.becker@web.de', 'Germany', '+49 176 220 4419', false, ''],
  ['Mia Nakamura', 'mia.nakamura@gmail.com', 'Japan', '+81 80 5521 8890', false, ''],
  ['Noah Bergström', 'noah.bergstrom@gmail.com', 'Sweden', '+46 70 998 2214', false, ''],
  ['Priya Raman', 'priya.raman@proton.me', 'India', '+91 98200 44219', true, 'Fable Health'],
  ['Elena Rossi', 'elena.rossi@libero.it', 'Italy', '+39 347 882 0144', false, ''],
  ['Daniel Okafor', 'dan.okafor@gmail.com', 'Nigeria', '+234 803 552 1188', false, ''],
  ['Hannah Meyer', 'hannah.meyer@gmail.com', 'Austria', '+43 664 221 8890', false, ''],
  ['Carlos Mendes', 'carlos.mendes@gmail.com', 'Brazil', '+55 11 98822 4410', true, 'Mendes Capital'],
  ['Ava Thompson', 'ava.thompson@gmail.com', 'United States', '+1 (212) 555-0142', false, ''],
  ['Youssef El Amrani', 'youssef.elamrani@gmail.com', 'Morocco', '+212 661 442 118', false, ''],
  ['Freya Nilsson', 'freya.nilsson@gmail.com', 'Denmark', '+45 22 88 44 19', false, ''],
  ['Oliver Grant', 'oliver.grant@gmail.com', 'Australia', '+61 412 885 019', false, ''],
  ['Isabella Costa', 'isabella.costa@gmail.com', 'Spain', '+34 612 887 440', false, ''],
];

function buildGuests(): Guest[] {
  return GUEST_SEED.map(([name, email, country, phone, vip, company], index) => ({
    id: `g${index + 1}`,
    name,
    email,
    phone,
    country,
    vip,
    company: company || undefined,
    joinedAt: iso(subMonths(now, 3 + ((index * 7) % 30))),
    notes:
      index % 4 === 0
        ? 'Prefers early check-in and a quiet unit away from the street.'
        : index % 5 === 0
          ? 'Travels with a small dog. Pet fee already agreed.'
          : undefined,
  }));
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTES = [
  'Late check-in requested — flight lands at 22:40.',
  'Travelling with an infant, cot requested.',
  'Anniversary stay. Welcome hamper arranged.',
  'Corporate booking, invoice to be issued to company.',
  'Repeat guest — flexible checkout confirmed.',
  'Airport transfer booked through the concierge.',
];

function buildReservations(properties: Property[], guests: Guest[]): Reservation[] {
  const rand = mulberry32(20261111);
  const start = startOfMonth(subMonths(now, 5));
  const end = endOfMonth(addMonths(now, 3));
  const sources: BookingSource[] = ['Airbnb', 'Booking.com', 'Direct', 'Vrbo'];
  const reservations: Reservation[] = [];
  let counter = 1;

  for (const property of properties) {
    let cursor = addDays(start, Math.floor(rand() * 11));
    let guestCursor = Math.floor(rand() * guests.length);

    while (addDays(cursor, 2) < end) {
      const nights = 2 + Math.floor(rand() * 6);
      const checkIn = cursor;
      const checkOut = addDays(checkIn, nights);
      if (checkOut > end) break;

      const guest = guests[guestCursor % guests.length];
      guestCursor += 1 + Math.floor(rand() * 2);

      const isCurrent = checkIn <= now && checkOut > now;
      const isPast = checkOut <= now;
      let status: ReservationStatus;
      if (isCurrent) {
        status = 'checked-in';
      } else if (isPast) {
        status = 'completed';
      } else {
        const roll = rand();
        status = roll < 0.07 ? 'cancelled' : roll < 0.19 ? 'pending' : 'confirmed';
      }

      const roll = rand();
      const source: BookingSource =
        roll < 0.45 ? sources[0] : roll < 0.7 ? sources[1] : roll < 0.9 ? sources[2] : sources[3];

      const total = Math.round(
        (property.nightlyRate * nights + property.cleaningFee) * (1 + rand() * 0.12),
      );

      const bookedOn = addDays(checkIn, -(3 + Math.floor(rand() * 26)));
      const createdAt = iso(
        bookedOn > now ? addDays(now, -(1 + Math.floor(rand() * 12))) : bookedOn,
      );

      reservations.push({
        id: `r${counter}`,
        propertyId: property.id,
        guestId: guest.id,
        checkIn: iso(checkIn),
        checkOut: iso(checkOut),
        nights,
        guests: 1 + Math.floor(rand() * property.maxGuests),
        total,
        status,
        source,
        notes: rand() < 0.32 ? NOTES[Math.floor(rand() * NOTES.length)] : undefined,
        createdAt,
      });

      counter += 1;
      cursor = addDays(checkOut, 1 + Math.floor(rand() * 5));
    }
  }

  return reservations.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

export const defaultSettings: Settings = {
  profile: {
    name: 'Alex Morgan',
    email: 'alex@staypilot.io',
    phone: '+1 (415) 555-0138',
    company: 'Morgan Stays',
    role: 'Portfolio Manager',
    bio: 'Managing a boutique portfolio of short-term rentals across Europe, North Africa and South-East Asia. Obsessed with occupancy and guest experience.',
  },
  preferences: {
    theme: 'light',
    weekStartsOn: 1,
    currency: 'USD',
    compact: false,
    reduceMotion: false,
  },
  notifications: {
    newBookings: true,
    cancellations: true,
    payments: true,
    reviews: false,
    weeklyDigest: true,
    productUpdates: false,
  },
};

export const seedNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'New booking confirmed',
    description: 'Sofia Almeida booked Skyline Loft for 5 nights via Airbnb.',
    time: '12 minutes ago',
    kind: 'booking',
    read: false,
  },
  {
    id: 'n2',
    title: 'Payment received',
    description: '$1,940 payout for Casa Azul has landed in your account.',
    time: '1 hour ago',
    kind: 'payment',
    read: false,
  },
  {
    id: 'n3',
    title: 'New 5-star review',
    description: 'James Whitfield left a review on Harbour View Suite.',
    time: '3 hours ago',
    kind: 'review',
    read: false,
  },
  {
    id: 'n4',
    title: 'Maintenance reminder',
    description: 'Terracotta House bathroom renovation is due to finish Friday.',
    time: 'Yesterday',
    kind: 'alert',
    read: true,
  },
  {
    id: 'n5',
    title: 'Weekly digest ready',
    description: 'Your portfolio occupancy is up 6.2% week over week.',
    time: '2 days ago',
    kind: 'alert',
    read: true,
  },
];

export function createInitialData(): AppData {
  const properties = buildProperties();
  const guests = buildGuests();
  return {
    properties,
    guests,
    reservations: buildReservations(properties, guests),
    settings: defaultSettings,
  };
}

export const IMAGE_FALLBACKS = IMAGES;

export function relativeNotificationTime(date: Date): string {
  return format(date, 'MMM d, HH:mm');
}
