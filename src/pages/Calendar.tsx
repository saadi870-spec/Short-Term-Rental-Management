import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, GripVertical, Plus } from 'lucide-react';
import type { Property } from '@/lib/types';
import { summarize } from '@/lib/analytics';
import { PROPERTY_SWATCHES, cn, fmtDate, iso } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Segmented,
  Select,
} from '@/components/ui';
import { ReservationDetailsModal } from '@/components/ReservationDetailsModal';

const CELL = 44;

export default function Calendar() {
  const { properties, reservations, settings, money, guestById, moveReservation } = useApp();
  const toast = useToast();

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [view, setView] = useState<'timeline' | 'grid'>('timeline');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const weekStartsOn = settings.preferences.weekStartsOn;
  const today = new Date();
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const monthStartISO = iso(monthStart);
  const monthEndISO = iso(monthEnd);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const gridDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn }),
    end: endOfWeek(monthEnd, { weekStartsOn }),
  });

  const weekLabels = useMemo(() => {
    const base = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, index) => base[(index + weekStartsOn) % 7]);
  }, [weekStartsOn]);

  const visibleProperties = useMemo(
    () => (propertyFilter === 'all' ? properties : properties.filter((property) => property.id === propertyFilter)),
    [properties, propertyFilter],
  );

  const propertySwatch = useMemo(() => {
    const map = new Map<string, (typeof PROPERTY_SWATCHES)[number]>();
    properties.forEach((property, index) => {
      map.set(property.id, PROPERTY_SWATCHES[index % PROPERTY_SWATCHES.length]);
    });
    return map;
  }, [properties]);

  const visibleIds = useMemo(() => new Set(visibleProperties.map((property) => property.id)), [visibleProperties]);

  const monthReservations = useMemo(
    () =>
      reservations.filter(
        (reservation) =>
          reservation.status !== 'cancelled' &&
          visibleIds.has(reservation.propertyId) &&
          reservation.checkIn <= monthEndISO &&
          reservation.checkOut > monthStartISO,
      ),
    [reservations, visibleIds, monthStartISO, monthEndISO],
  );

  const summary = summarize(
    reservations,
    properties,
    monthStartISO,
    monthEndISO,
    propertyFilter === 'all' ? undefined : propertyFilter,
  );

  const bookingsOnDay = (day: Date) => {
    const dayISO = iso(day);
    return monthReservations.filter(
      (reservation) => reservation.checkIn <= dayISO && reservation.checkOut > dayISO,
    );
  };

  const handleDrop = (day: Date) => {
    const id = draggedId;
    setDraggedId(null);
    setDragOverDay(null);
    if (!id) return;
    const reservation = reservations.find((item) => item.id === id);
    if (!reservation) return;
    const newCheckIn = iso(day);
    if (reservation.checkIn === newCheckIn) return;
    moveReservation(id, newCheckIn);
    toast.success(
      'Booking rescheduled',
      `${guestById(reservation.guestId)?.name ?? 'Guest'} now arrives ${format(day, 'MMM d')} and departs ${format(addDays(day, reservation.nights), 'MMM d')}.`,
    );
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="See every stay at a glance and drag bookings to new dates."
        actions={
          <Link
            to="/reservations?new=1"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            <Plus size={16} />
            New reservation
          </Link>
        }
      />

      <Card className="mb-4 p-3.5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              aria-label="Previous month"
              onClick={() => setCursor((current) => addMonths(current, -1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <p className="min-w-[140px] text-center text-sm font-semibold text-slate-900 dark:text-white">
              {format(monthStart, 'MMMM yyyy')}
            </p>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Next month"
              onClick={() => setCursor((current) => addMonths(current, 1))}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="ml-1"
              onClick={() => setCursor(startOfMonth(new Date()))}
            >
              Today
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
            <Select
              value={propertyFilter}
              onChange={(event) => setPropertyFilter(event.target.value)}
              aria-label="Filter calendar by property"
              className="w-full sm:w-48"
            >
              <option value="all">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'timeline', label: 'Timeline' },
                { value: 'grid', label: 'Month grid' },
              ]}
            />
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Badge tone="indigo" dot>
            {monthReservations.length} bookings this month
          </Badge>
          <Badge tone="emerald" dot>
            {summary.occupancy.toFixed(0)}% occupancy
          </Badge>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {money(monthReservations.reduce((total, reservation) => total + reservation.total, 0))} booked
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <GripVertical size={13} />
            Drag a booking to reschedule
          </span>
        </div>
      </Card>

      {view === 'timeline' ? (
        <Card className="overflow-hidden">
          <div className="flex">
            <div className="w-40 shrink-0 border-r border-slate-100 dark:border-slate-800 sm:w-48">
              <div className="flex h-16 items-end border-b border-slate-100 px-4 pb-2.5 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Property
                </span>
              </div>
              {visibleProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-2 border-b border-slate-100 px-4 dark:border-slate-800"
                  style={{ height: 56 }}
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', propertySwatch.get(property.id)?.dot)} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {property.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">{property.city}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="scrollbar-thin flex-1 overflow-x-auto">
              <div style={{ width: monthDays.length * CELL }}>
                <div className="flex h-16 border-b border-slate-100 dark:border-slate-800">
                  {monthDays.map((day) => {
                    const isToday = isSameDay(day, today);
                    return (
                      <div
                        key={day.toISOString()}
                        style={{ width: CELL }}
                        className={cn(
                          'flex shrink-0 flex-col items-center justify-center border-r border-slate-100 text-center dark:border-slate-800',
                          isToday && 'bg-indigo-50 dark:bg-indigo-500/10',
                        )}
                      >
                        <span className="text-[9px] font-medium uppercase text-slate-400">
                          {format(day, 'EEEEE')}
                        </span>
                        <span
                          className={cn(
                            'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                            isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {visibleProperties.map((property) => (
                  <div
                    key={property.id}
                    className="relative border-b border-slate-100 dark:border-slate-800"
                    style={{ height: 56 }}
                  >
                    <div className="absolute inset-0 flex">
                      {monthDays.map((day) => {
                        const key = iso(day);
                        return (
                          <div
                            key={key}
                            style={{ width: CELL }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOverDay(key);
                            }}
                            onDragLeave={() => setDragOverDay((current) => (current === key ? null : current))}
                            onDrop={(event) => {
                              event.preventDefault();
                              handleDrop(day);
                            }}
                            className={cn(
                              'h-full shrink-0 border-r border-slate-100/80 transition-colors dark:border-slate-800/70',
                              dragOverDay === key && 'bg-indigo-100/70 dark:bg-indigo-500/20',
                            )}
                          />
                        );
                      })}
                    </div>

                    {monthReservations
                      .filter((reservation) => reservation.propertyId === property.id)
                      .map((reservation) => {
                        const startIndex = differenceInCalendarDays(parseISO(reservation.checkIn), monthStart);
                        const endIndex = differenceInCalendarDays(parseISO(reservation.checkOut), monthStart);
                        const from = Math.max(0, startIndex);
                        const to = Math.min(monthDays.length, endIndex);
                        if (to <= from) return null;
                        const swatch = propertySwatch.get(property.id);
                        const guestName = guestById(reservation.guestId)?.name ?? 'Guest';
                        return (
                          <button
                            key={reservation.id}
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData('text/plain', reservation.id);
                              event.dataTransfer.effectAllowed = 'move';
                              setDraggedId(reservation.id);
                            }}
                            onDragEnd={() => {
                              setDraggedId(null);
                              setDragOverDay(null);
                            }}
                            onClick={() => setSelectedId(reservation.id)}
                            title={`${guestName} · ${fmtDate(reservation.checkIn, 'MMM d')} – ${fmtDate(reservation.checkOut, 'MMM d')}`}
                            className={cn(
                              'absolute top-[11px] z-10 flex h-[34px] cursor-grab items-center gap-1.5 overflow-hidden rounded-lg border px-2 text-left text-[10px] font-medium shadow-sm transition hover:shadow-md active:cursor-grabbing',
                              swatch?.soft,
                              reservation.status === 'pending' && 'border-dashed',
                              draggedId === reservation.id && 'opacity-40',
                            )}
                            style={{
                              left: from * CELL + 2,
                              width: Math.max(CELL - 4, (to - from) * CELL - 4),
                            }}
                          >
                            <span className="truncate">{guestName}</span>
                            {to - from > 2 && (
                              <span className="ml-auto shrink-0 opacity-70">
                                {reservation.nights}n
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {visibleProperties.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No properties match this filter.
            </p>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                {weekLabels.map((label) => (
                  <div
                    key={label}
                    className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {gridDays.map((day) => {
                  const inMonth = isSameMonth(day, cursor);
                  const isToday = isSameDay(day, today);
                  const dayISO = iso(day);
                  const dayBookings = bookingsOnDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverDay(dayISO);
                      }}
                      onDragLeave={() => setDragOverDay((current) => (current === dayISO ? null : current))}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDrop(day);
                      }}
                      className={cn(
                        'min-h-[112px] border-b border-r border-slate-100 p-1.5 transition-colors last:border-r-0 dark:border-slate-800',
                        !inMonth && 'bg-slate-50/60 dark:bg-slate-950/40',
                        dragOverDay === dayISO && 'bg-indigo-50 ring-1 ring-inset ring-indigo-300 dark:bg-indigo-500/10 dark:ring-indigo-500/40',
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between px-0.5">
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                            isToday
                              ? 'bg-indigo-600 text-white'
                              : inMonth
                                ? 'text-slate-700 dark:text-slate-300'
                                : 'text-slate-400 dark:text-slate-600',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayBookings.length > 1 && (
                          <span className="text-[9px] font-medium text-slate-400">{dayBookings.length}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map((reservation) => {
                          const swatch = propertySwatch.get(reservation.propertyId);
                          const property = properties.find((item) => item.id === reservation.propertyId);
                          const guest = guestById(reservation.guestId);
                          return (
                            <button
                              key={reservation.id}
                              type="button"
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData('text/plain', reservation.id);
                                event.dataTransfer.effectAllowed = 'move';
                                setDraggedId(reservation.id);
                              }}
                              onDragEnd={() => {
                                setDraggedId(null);
                                setDragOverDay(null);
                              }}
                              onClick={() => setSelectedId(reservation.id)}
                              title={`${guest?.name ?? 'Guest'} · ${property?.name ?? 'Property'}`}
                              className={cn(
                                'block w-full cursor-grab truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-medium transition active:cursor-grabbing',
                                swatch?.soft,
                                draggedId === reservation.id && 'opacity-40',
                              )}
                            >
                              {guest?.name.split(' ').slice(-1)[0] ?? 'Guest'}
                            </button>
                          );
                        })}
                        {dayBookings.length > 2 && (
                          <p className="px-1 text-[9px] font-medium text-slate-400">
                            +{dayBookings.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {properties.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
          {visibleProperties.map((property: Property) => (
            <span key={property.id} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className={cn('h-2 w-2 rounded-full', propertySwatch.get(property.id)?.dot)} />
              {property.name}
            </span>
          ))}
        </div>
      )}

      <ReservationDetailsModal reservationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
