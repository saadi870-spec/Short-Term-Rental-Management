import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays } from 'date-fns';
import { CalendarRange } from 'lucide-react';
import type { Reservation } from '@/lib/types';
import { fmtDate, iso, nightsBetween } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/Modal';

const schema = z
  .object({
    propertyId: z.string().min(1, 'Choose a property'),
    guestId: z.string().min(1, 'Choose a guest'),
    checkIn: z.string().min(1, 'Pick a check-in date'),
    checkOut: z.string().min(1, 'Pick a check-out date'),
    guests: z
      .number({ invalid_type_error: 'Enter a number' })
      .int('Use a whole number')
      .min(1, 'At least 1 guest')
      .max(30, 'That seems high'),
    status: z.enum(['pending', 'confirmed', 'checked-in', 'completed', 'cancelled']),
    source: z.enum(['Airbnb', 'Booking.com', 'Direct', 'Vrbo']),
    notes: z.string().max(500, 'Keep notes under 500 characters').optional(),
  })
  .superRefine((values, ctx) => {
    if (values.checkIn && values.checkOut && values.checkOut <= values.checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['checkOut'],
        message: 'Check-out must be after check-in',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function buildDefaults(properties: Array<{ id: string; maxGuests: number }>, guests: Array<{ id: string }>, guestId?: string): FormValues {
  const today = new Date();
  return {
    propertyId: properties[0]?.id ?? '',
    guestId: guestId ?? guests[0]?.id ?? '',
    checkIn: iso(today),
    checkOut: iso(addDays(today, 3)),
    guests: Math.min(2, properties[0]?.maxGuests ?? 2),
    status: 'confirmed',
    source: 'Direct',
    notes: '',
  };
}

export function ReservationFormModal({
  open,
  onClose,
  reservation,
  initialGuestId,
}: {
  open: boolean;
  onClose: () => void;
  reservation?: Reservation | null;
  initialGuestId?: string;
}) {
  const { properties, guests, addReservation, updateReservation, money } = useApp();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(properties, guests, initialGuestId),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      reservation
        ? {
            propertyId: reservation.propertyId,
            guestId: reservation.guestId,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            guests: reservation.guests,
            status: reservation.status,
            source: reservation.source,
            notes: reservation.notes ?? '',
          }
        : buildDefaults(properties, guests, initialGuestId),
    );
  }, [open, reservation, initialGuestId, properties, guests, reset]);

  const propertyId = watch('propertyId');
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const property = properties.find((item) => item.id === propertyId);

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  );
  const subtotal = property ? nights * property.nightlyRate : 0;
  const cleaning = property?.cleaningFee ?? 0;
  const total = subtotal + cleaning;

  const sortedGuests = useMemo(
    () => [...guests].sort((a, b) => a.name.localeCompare(b.name)),
    [guests],
  );

  const onSubmit = (values: FormValues) => {
    if (!property) {
      setError('propertyId', { message: 'Choose a property' });
      return;
    }
    if (values.guests > property.maxGuests) {
      setError('guests', { message: `This property sleeps up to ${property.maxGuests} guests.` });
      return;
    }
    if (!values.guestId) {
      setError('guestId', { message: 'Choose a guest' });
      return;
    }
    const bookingNights = nightsBetween(values.checkIn, values.checkOut);
    const bookingTotal = bookingNights * property.nightlyRate + property.cleaningFee;
    const payload = {
      ...values,
      notes: values.notes?.trim() || undefined,
      total: bookingTotal,
    };

    if (reservation) {
      updateReservation(reservation.id, { ...payload, nights: bookingNights });
      toast.success('Reservation updated', `${property.name} · ${fmtDate(values.checkIn, 'MMM d')} – ${fmtDate(values.checkOut, 'MMM d')}`);
    } else {
      addReservation(payload);
      toast.success('Reservation created', `${property.name} · ${fmtDate(values.checkIn, 'MMM d')} – ${fmtDate(values.checkOut, 'MMM d')}`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reservation ? 'Edit reservation' : 'New reservation'}
      description="Bookings are checked against the property capacity automatically."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reservation-form">
            {reservation ? 'Save changes' : 'Create booking'}
          </Button>
        </>
      }
    >
      <form id="reservation-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Property" htmlFor="propertyId" error={errors.propertyId?.message}>
          <Select id="propertyId" invalid={Boolean(errors.propertyId)} {...register('propertyId')}>
            {properties.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {item.city}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Guest" htmlFor="guestId" error={errors.guestId?.message}>
          <Select id="guestId" invalid={Boolean(errors.guestId)} {...register('guestId')}>
            {sortedGuests.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {guest.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Check-in" htmlFor="checkIn" error={errors.checkIn?.message}>
          <Input id="checkIn" type="date" invalid={Boolean(errors.checkIn)} {...register('checkIn')} />
        </Field>

        <Field label="Check-out" htmlFor="checkOut" error={errors.checkOut?.message} hint={nights > 0 ? `${nights} nights` : undefined}>
          <Input id="checkOut" type="date" min={checkIn} invalid={Boolean(errors.checkOut)} {...register('checkOut')} />
        </Field>

        <Field label="Guests" htmlFor="guests" error={errors.guests?.message} hint={property ? `Max ${property.maxGuests} at this property` : undefined}>
          <Input id="guests" type="number" min={1} invalid={Boolean(errors.guests)} {...register('guests', { valueAsNumber: true })} />
        </Field>

        <Field label="Booking source" htmlFor="source" error={errors.source?.message}>
          <Select id="source" {...register('source')}>
            <option value="Direct">Direct</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Booking.com">Booking.com</option>
            <option value="Vrbo">Vrbo</option>
          </Select>
        </Field>

        <Field label="Status" htmlFor="status" error={errors.status?.message}>
          <Select id="status" {...register('status')}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked-in">Checked in</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>

        <div className="hidden sm:block" />

        <Field label="Notes" htmlFor="notes" error={errors.notes?.message} className="sm:col-span-2">
          <Textarea id="notes" rows={2} placeholder="Arrival time, special requests, internal notes…" {...register('notes')} />
        </Field>

        <div className="sm:col-span-2">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/[0.06]">
            <div className="mb-3 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <CalendarRange size={16} />
              <p className="text-xs font-semibold uppercase tracking-wide">Pricing preview</p>
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>
                  {money(property?.nightlyRate ?? 0)} × {nights} {nights === 1 ? 'night' : 'nights'}
                </dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>Cleaning fee</dt>
                <dd className="tabular-nums">{money(cleaning)}</dd>
              </div>
              <div className="flex justify-between border-t border-indigo-200/60 pt-2 text-sm font-semibold text-slate-900 dark:border-indigo-500/20 dark:text-white">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </form>
    </Modal>
  );
}
