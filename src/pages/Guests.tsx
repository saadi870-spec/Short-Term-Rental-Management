import { useMemo, useState } from 'react';
import {
  CalendarPlus,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { fmtDate, iso } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
} from '@/components/ui';
import { Modal } from '@/components/Modal';
import { GuestFormModal } from '@/components/forms/GuestForm';
import { ReservationFormModal } from '@/components/forms/ReservationForm';

type GuestFilter = 'all' | 'vip' | 'repeat' | 'upcoming';
type SortKey = 'spend' | 'name' | 'recent';

export default function Guests() {
  const { guests, reservations, loading, money, propertyById } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GuestFilter>('all');
  const [sort, setSort] = useState<SortKey>('spend');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [bookingGuestId, setBookingGuestId] = useState<string | null>(null);

  const todayISO = iso(new Date());

  const guestStats = useMemo(() => {
    const map = new Map<
      string,
      { stays: number; nights: number; spent: number; lastStay?: string; upcoming: boolean }
    >();
    guests.forEach((guest) => {
      const stays = reservations.filter(
        (reservation) => reservation.guestId === guest.id && reservation.status !== 'cancelled',
      );
      const past = stays.filter((reservation) => reservation.checkOut <= todayISO);
      map.set(guest.id, {
        stays: stays.length,
        nights: stays.reduce((total, reservation) => total + reservation.nights, 0),
        spent: stays.reduce((total, reservation) => total + reservation.total, 0),
        lastStay: past.length
          ? past.map((reservation) => reservation.checkOut).sort().slice(-1)[0]
          : undefined,
        upcoming: stays.some((reservation) => reservation.checkIn > todayISO),
      });
    });
    return map;
  }, [guests, reservations, todayISO]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = guests.filter((guest) => {
      const stats = guestStats.get(guest.id);
      const matchesSearch =
        !term ||
        guest.name.toLowerCase().includes(term) ||
        guest.email.toLowerCase().includes(term) ||
        guest.country.toLowerCase().includes(term) ||
        (guest.company ?? '').toLowerCase().includes(term);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'vip' && guest.vip) ||
        (filter === 'repeat' && (stats?.stays ?? 0) >= 3) ||
        (filter === 'upcoming' && Boolean(stats?.upcoming));
      return matchesSearch && matchesFilter;
    });

    return [...result].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'recent') {
        return (guestStats.get(b.id)?.lastStay ?? '').localeCompare(guestStats.get(a.id)?.lastStay ?? '');
      }
      return (guestStats.get(b.id)?.spent ?? 0) - (guestStats.get(a.id)?.spent ?? 0);
    });
  }, [guests, guestStats, search, filter, sort]);

  const detail = detailId ? guests.find((guest) => guest.id === detailId) : undefined;
  const detailBookings = detail
    ? reservations
        .filter((reservation) => reservation.guestId === detail.id)
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    : [];
  const detailStats = detail ? guestStats.get(detail.id) : undefined;

  const totalLifetime = guests.reduce((total, guest) => total + (guestStats.get(guest.id)?.spent ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Guests"
        description={`${guests.length} guest profiles · ${money(totalLifetime)} lifetime booking value`}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus size={16} />
            Add guest
          </Button>
        }
      />

      <Card className="mb-5 p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guests by name, email or country…"
              aria-label="Search guests"
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select
              value={filter}
              onChange={(event) => setFilter(event.target.value as GuestFilter)}
              aria-label="Filter guests"
              className="sm:w-40"
            >
              <option value="all">All guests</option>
              <option value="vip">VIP guests</option>
              <option value="repeat">Repeat guests</option>
              <option value="upcoming">Upcoming stays</option>
            </Select>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Sort guests"
              className="sm:w-40"
            >
              <option value="spend">Highest value</option>
              <option value="name">Name A–Z</option>
              <option value="recent">Most recent stay</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[220px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No guests found"
            description={
              guests.length === 0
                ? 'Add your first guest to start creating bookings.'
                : 'No guest matches this search or filter. Try widening your filters.'
            }
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((guest) => {
            const stats = guestStats.get(guest.id);
            return (
              <Card key={guest.id} className="flex flex-col p-5 card-hover">
                <div className="flex items-start gap-3">
                  <Avatar name={guest.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {guest.name}
                      </h3>
                      {guest.vip && <Badge tone="amber">VIP</Badge>}
                      {(stats?.stays ?? 0) >= 3 && <Badge tone="indigo">Repeat</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{guest.email}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400">
                      <MapPin size={11} /> {guest.country}
                      {guest.company ? ` · ${guest.company}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-3 text-center dark:bg-slate-950/40">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{stats?.stays ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Stays</p>
                  </div>
                  <div className="border-x border-slate-200/70 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{stats?.nights ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Nights</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{money(stats?.spent ?? 0)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Value</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <span className="truncate text-slate-400">
                    {stats?.upcoming
                      ? 'Upcoming stay booked'
                      : stats?.lastStay
                        ? `Last stay ${fmtDate(stats.lastStay, 'MMM d, yyyy')}`
                        : 'No stays yet'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailId(guest.id)}
                    className="shrink-0 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    View profile
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title="Guest profile"
        description="Booking history and contact details"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailId(null)}>
              Close
            </Button>
            {detail && (
              <Button
                onClick={() => {
                  setBookingGuestId(detail.id);
                  setDetailId(null);
                }}
              >
                <CalendarPlus size={15} /> New booking
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={detail.name} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{detail.name}</h3>
                  {detail.vip && <Badge tone="amber">VIP</Badge>}
                  {(detailStats?.stays ?? 0) >= 3 && <Badge tone="indigo">Repeat guest</Badge>}
                  {detail.company && (
                    <Badge tone="slate">
                      <Sparkles size={11} /> {detail.company}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={13} /> {detail.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={13} /> {detail.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} /> {detail.country}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Guest since {fmtDate(detail.joinedAt, 'MMMM yyyy')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Stays', value: String(detailStats?.stays ?? 0) },
                { label: 'Nights', value: String(detailStats?.nights ?? 0) },
                { label: 'Lifetime value', value: money(detailStats?.spent ?? 0) },
                {
                  label: 'Avg. stay',
                  value: `${Math.max(1, Math.round((detailStats?.nights ?? 0) / Math.max(1, detailStats?.stays ?? 1)))} nights`,
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {detail.notes && (
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.06]">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Guest preferences
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-amber-900/80 dark:text-amber-100/80">
                  {detail.notes}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Booking history
              </p>
              {detailBookings.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No bookings yet — create the first stay.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                  {detailBookings.slice(0, 8).map((reservation) => {
                    const property = propertyById(reservation.propertyId);
                    return (
                      <li key={reservation.id} className="flex flex-wrap items-center gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {property?.name ?? 'Removed property'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {fmtDate(reservation.checkIn, 'MMM d, yyyy')} – {fmtDate(reservation.checkOut, 'MMM d, yyyy')}
                          </p>
                        </div>
                        <StatusBadge status={reservation.status} />
                        <span className="w-20 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                          {money(reservation.total)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <GuestFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ReservationFormModal
        open={Boolean(bookingGuestId)}
        onClose={() => setBookingGuestId(null)}
        initialGuestId={bookingGuestId ?? undefined}
      />
    </div>
  );
}
