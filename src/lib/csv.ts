import type { Guest, Property, Reservation } from './types';

function escapeCell(value: string | number): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportReservationsCsv(
  reservations: Reservation[],
  propertyById: (id: string) => Property | undefined,
  guestById: (id: string) => Guest | undefined,
): void {
  const header = [
    'Reservation ID',
    'Guest',
    'Email',
    'Property',
    'City',
    'Check in',
    'Check out',
    'Nights',
    'Guests',
    'Source',
    'Status',
    'Total',
  ];
  const rows = reservations.map((reservation) => {
    const property = propertyById(reservation.propertyId);
    const guest = guestById(reservation.guestId);
    return [
      reservation.id,
      guest?.name ?? 'Unknown',
      guest?.email ?? '',
      property?.name ?? 'Removed property',
      property?.city ?? '',
      reservation.checkIn,
      reservation.checkOut,
      reservation.nights,
      reservation.guests,
      reservation.source,
      reservation.status,
      reservation.total,
    ].map(escapeCell);
  });

  const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `staypilot-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
