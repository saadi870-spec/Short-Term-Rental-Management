import { addDays, differenceInCalendarDays, endOfMonth, format, parseISO, startOfDay, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns';
import type { BookingSource, Property, Reservation } from './types';
import { clamp, iso, pctChange } from './utils';

export type RangeKey = '30d' | '90d' | '6m' | '12m';

export const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
];

export const RANGE_LABELS: Record<RangeKey, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '6m': 'Last 6 months',
  '12m': 'Last 12 months',
};

export interface Bucket {
  label: string;
  fullLabel: string;
  start: string;
  end: string;
  days: number;
}

export function isCounted(reservation: Reservation): boolean {
  return reservation.status !== 'cancelled' && reservation.status !== 'pending';
}

export function getBuckets(range: RangeKey): Bucket[] {
  const today = startOfDay(new Date());

  if (range === '30d') {
    return Array.from({ length: 30 }, (_, index) => {
      const day = subDays(today, 29 - index);
      return {
        label: format(day, 'MMM d'),
        fullLabel: format(day, 'EEE, MMM d'),
        start: iso(day),
        end: iso(day),
        days: 1,
      };
    });
  }

  if (range === '90d') {
    const firstWeek = startOfWeek(subDays(today, 90), { weekStartsOn: 1 });
    const buckets: Bucket[] = [];
    for (let index = 0; index < 13; index += 1) {
      const start = addDays(firstWeek, index * 7);
      const end = addDays(start, 6);
      buckets.push({
        label: format(start, 'MMM d'),
        fullLabel: `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`,
        start: iso(start),
        end: iso(end),
        days: 7,
      });
    }
    return buckets;
  }

  const months = range === '6m' ? 6 : 12;
  return Array.from({ length: months }, (_, index) => {
    const start = startOfMonth(subMonths(today, months - 1 - index));
    const end = endOfMonth(start);
    return {
      label: format(start, 'MMM'),
      fullLabel: format(start, 'MMMM yyyy'),
      start: iso(start),
      end: iso(end),
      days: differenceInCalendarDays(end, start) + 1,
    };
  });
}

export function getRangeBounds(range: RangeKey): { start: string; end: string } {
  const buckets = getBuckets(range);
  return { start: buckets[0].start, end: buckets[buckets.length - 1].end };
}

function overlapNights(reservation: Reservation, startISO: string, endISO: string): number {
  const checkIn = parseISO(reservation.checkIn);
  const checkOut = parseISO(reservation.checkOut);
  const rangeStart = parseISO(startISO);
  const rangeEndExclusive = addDays(parseISO(endISO), 1);
  const from = checkIn > rangeStart ? checkIn : rangeStart;
  const to = checkOut < rangeEndExclusive ? checkOut : rangeEndExclusive;
  return Math.max(0, differenceInCalendarDays(to, from));
}

export interface Summary {
  revenue: number;
  bookings: number;
  nights: number;
  occupancy: number;
  adr: number;
  guests: number;
}

export function summarize(
  reservations: Reservation[],
  properties: Property[],
  startISO: string,
  endISO: string,
  propertyId?: string,
): Summary {
  const scopedProperties = propertyId
    ? properties.filter((property) => property.id === propertyId)
    : properties.filter((property) => property.status === 'active');
  const propertyIds = new Set(scopedProperties.map((property) => property.id));

  const booked = reservations.filter(
    (reservation) =>
      propertyIds.has(reservation.propertyId) &&
      isCounted(reservation) &&
      reservation.checkIn >= startISO &&
      reservation.checkIn <= endISO,
  );

  const revenue = booked.reduce((total, reservation) => total + reservation.total, 0);
  const nights = booked.reduce((total, reservation) => total + reservation.nights, 0);

  const occupiedNights = reservations
    .filter(
      (reservation) =>
        propertyIds.has(reservation.propertyId) &&
        isCounted(reservation) &&
        reservation.checkIn <= endISO &&
        reservation.checkOut > startISO,
    )
    .reduce((total, reservation) => total + overlapNights(reservation, startISO, endISO), 0);

  const calendarDays = differenceInCalendarDays(parseISO(endISO), parseISO(startISO)) + 1;
  const capacity = Math.max(1, scopedProperties.length * calendarDays);

  return {
    revenue,
    bookings: booked.length,
    nights,
    occupancy: clamp((occupiedNights / capacity) * 100, 0, 100),
    adr: nights ? revenue / nights : 0,
    guests: booked.reduce((total, reservation) => total + reservation.guests, 0),
  };
}

export function previousPeriodSummary(
  reservations: Reservation[],
  properties: Property[],
  range: RangeKey,
  propertyId?: string,
): Summary {
  const buckets = getBuckets(range);
  const start = parseISO(buckets[0].start);
  const end = parseISO(buckets[buckets.length - 1].end);
  const days = differenceInCalendarDays(end, start) + 1;
  const previousEnd = subDays(start, 1);
  const previousStart = subDays(previousEnd, days - 1);
  return summarize(reservations, properties, iso(previousStart), iso(previousEnd), propertyId);
}

export interface SeriesPoint {
  label: string;
  fullLabel: string;
  revenue: number;
  bookings: number;
  occupancy: number;
  adr: number;
}

export function buildSeries(
  reservations: Reservation[],
  properties: Property[],
  range: RangeKey,
  propertyId?: string,
): SeriesPoint[] {
  return getBuckets(range).map((bucket) => {
    const summary = summarize(reservations, properties, bucket.start, bucket.end, propertyId);
    return {
      label: bucket.label,
      fullLabel: bucket.fullLabel,
      revenue: Math.round(summary.revenue),
      bookings: summary.bookings,
      occupancy: Number(summary.occupancy.toFixed(1)),
      adr: Math.round(summary.adr),
    };
  });
}

export interface PropertyPerformance {
  property: Property;
  revenue: number;
  bookings: number;
  nights: number;
  occupancy: number;
  adr: number;
}

export function propertyPerformance(
  reservations: Reservation[],
  properties: Property[],
  startISO: string,
  endISO: string,
): PropertyPerformance[] {
  return properties
    .map((property) => {
      const summary = summarize(reservations, properties, startISO, endISO, property.id);
      return {
        property,
        revenue: summary.revenue,
        bookings: summary.bookings,
        nights: summary.nights,
        occupancy: summary.occupancy,
        adr: summary.adr,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export interface SourceSlice {
  name: BookingSource;
  value: number;
  count: number;
}

export function sourceBreakdown(
  reservations: Reservation[],
  properties: Property[],
  startISO: string,
  endISO: string,
  propertyId?: string,
): SourceSlice[] {
  const scoped = new Set(
    (propertyId ? properties.filter((property) => property.id === propertyId) : properties).map(
      (property) => property.id,
    ),
  );
  const sources: BookingSource[] = ['Airbnb', 'Booking.com', 'Direct', 'Vrbo'];
  return sources.map((source) => {
    const matches = reservations.filter(
      (reservation) =>
        scoped.has(reservation.propertyId) &&
        isCounted(reservation) &&
        reservation.source === source &&
        reservation.checkIn >= startISO &&
        reservation.checkIn <= endISO,
    );
    return {
      name: source,
      value: matches.reduce((total, reservation) => total + reservation.total, 0),
      count: matches.length,
    };
  });
}

export function percentChange(current: number, previous: number): number | null {
  return pctChange(current, previous);
}
