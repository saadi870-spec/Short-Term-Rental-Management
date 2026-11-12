import { useEffect, useState } from 'react';
import {
  CalendarCheck2,
  CalendarPlus,
  Clock,
  Mail,
  Pencil,
  Phone,
  Receipt,
  Trash2,
  Users,
} from 'lucide-react';
import { fmtDate } from '@/lib/utils';
import type { Reservation } from '@/lib/types';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import { Avatar, Badge, Button, StatusBadge } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { PropertyImage } from '@/components/PropertyImage';

function nextStatus(status: Reservation['status']): { status: Reservation['status']; label: string; toast: string } | null {
  switch (status) {
    case 'pending':
      return { status: 'confirmed', label: 'Confirm booking', toast: 'Booking confirmed' };
    case 'confirmed':
      return { status: 'checked-in', label: 'Check in guest', toast: 'Guest checked in' };
    case 'checked-in':
      return { status: 'completed', label: 'Check out guest', toast: 'Guest checked out' };
    default:
      return null;
  }
}

export function ReservationDetailsModal({
  reservationId,
  onClose,
  onEdit,
}: {
  reservationId: string | null;
  onClose: () => void;
  onEdit?: (reservation: Reservation) => void;
}) {
  const { reservations, propertyById, guestById, money, updateReservation, deleteReservation } = useApp();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setConfirmOpen(false);
  }, [reservationId]);

  const reservation = reservationId ? reservations.find((item) => item.id === reservationId) : undefined;

  if (!reservation) return null;

  const property = propertyById(reservation.propertyId);
  const guest = guestById(reservation.guestId);
  const advance = nextStatus(reservation.status);
  const cleaning = property?.cleaningFee ?? 0;
  const subtotal = Math.max(0, reservation.total - cleaning);

  const applyStatus = (status: Reservation['status'], message: string) => {
    updateReservation(reservation.id, { status });
    if (status === 'cancelled') {
      toast.info('Booking cancelled', `${guest?.name ?? 'Guest'} · ${property?.name ?? 'Property'}`);
    } else {
      toast.success(message, `${guest?.name ?? 'Guest'} · ${property?.name ?? 'Property'}`);
    }
  };

  return (
    <>
      <Modal
        open={Boolean(reservation)}
        onClose={onClose}
        title="Reservation details"
        description={`Booking ${reservation.id.toUpperCase()} · ${reservation.source}`}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              className="mr-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={15} />
              Delete
            </Button>
            {reservation.status === 'pending' || reservation.status === 'confirmed' ? (
              <Button
                variant="secondary"
                onClick={() => applyStatus('cancelled', 'Booking cancelled')}
              >
                Cancel booking
              </Button>
            ) : null}
            {onEdit && (
              <Button variant="secondary" onClick={() => onEdit(reservation)}>
                <Pencil size={15} />
                Edit
              </Button>
            )}
            {advance && (
              <Button onClick={() => applyStatus(advance.status, advance.toast)}>{advance.label}</Button>
            )}
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={guest?.name ?? 'Unknown guest'} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {guest?.name ?? 'Unknown guest'}
                  </h3>
                  {guest?.vip && <Badge tone="amber">VIP</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {guest?.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} /> {guest.email}
                    </span>
                  )}
                  {guest?.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={12} /> {guest.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <StatusBadge status={reservation.status} />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <PropertyImage
              src={property?.image}
              alt={property?.name ?? 'Property'}
              className="h-14 w-20 shrink-0 rounded-lg"
              iconSize={18}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {property?.name ?? 'Removed property'}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {property ? `${property.city}, ${property.country}` : 'This property is no longer listed'}
              </p>
            </div>
            <div className="ml-auto hidden text-right sm:block">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
              <p className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                {money(reservation.total)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile
              icon={CalendarPlus}
              label="Check-in"
              value={fmtDate(reservation.checkIn, 'EEE, MMM d, yyyy')}
              hint="From 15:00"
            />
            <InfoTile
              icon={CalendarCheck2}
              label="Check-out"
              value={fmtDate(reservation.checkOut, 'EEE, MMM d, yyyy')}
              hint="Before 11:00"
            />
            <InfoTile
              icon={Clock}
              label="Stay length"
              value={`${reservation.nights} ${reservation.nights === 1 ? 'night' : 'nights'}`}
            />
            <InfoTile
              icon={Users}
              label="Guests"
              value={`${reservation.guests} ${reservation.guests === 1 ? 'guest' : 'guests'}`}
              hint={property ? `Sleeps up to ${property.maxGuests}` : undefined}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 flex items-center gap-2">
              <Receipt size={15} className="text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Payment breakdown
              </p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>Accommodation · {reservation.nights} nights</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>Cleaning fee</dt>
                <dd className="tabular-nums">{money(cleaning)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
                <dt>Total paid</dt>
                <dd className="tabular-nums">{money(reservation.total)}</dd>
              </div>
            </dl>
          </div>

          {reservation.notes && (
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Internal note
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-amber-900/80 dark:text-amber-100/80">
                {reservation.notes}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Booked on {fmtDate(reservation.createdAt)}</span>
            <span>
              {reservation.source} · {property?.type ?? 'Stay'}
            </span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          deleteReservation(reservation.id);
          toast.success('Reservation deleted', 'The booking has been removed from your records.');
          onClose();
        }}
        title="Delete this reservation?"
        description="This removes the booking and frees its dates in the calendar. This cannot be undone."
        confirmLabel="Delete reservation"
      />
    </>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon size={13} />
        <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
