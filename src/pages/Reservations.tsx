import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import type { Reservation, ReservationStatus } from '@/lib/types';
import { exportReservationsCsv } from '@/lib/csv';
import { cn, fmtDate } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  TableSkeleton,
} from '@/components/ui';
import { ConfirmDialog } from '@/components/Modal';
import { ReservationDetailsModal } from '@/components/ReservationDetailsModal';
import { ReservationFormModal } from '@/components/forms/ReservationForm';

const PAGE_SIZE = 8;

const STATUS_TABS: Array<{ value: 'all' | ReservationStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked-in', label: 'Checked in' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

type SortKey = 'checkin-desc' | 'checkin-asc' | 'total-desc' | 'created-desc';

export default function Reservations() {
  const {
    properties,
    reservations,
    guests,
    loading,
    money,
    propertyById,
    guestById,
    deleteReservation,
  } = useApp();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') ?? '';
  const creating = searchParams.get('new') === '1';

  const [search, setSearch] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | ReservationStatus>('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('checkin-desc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, propertyFilter, sort]);

  const propertyMap = useMemo(
    () => new Map(properties.map((property) => [property.id, property])),
    [properties],
  );
  const guestMap = useMemo(() => new Map(guests.map((guest) => [guest.id, guest])), [guests]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: reservations.length };
    reservations.forEach((reservation) => {
      result[reservation.status] = (result[reservation.status] ?? 0) + 1;
    });
    return result;
  }, [reservations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = reservations.filter((reservation) => {
      const guest = guestMap.get(reservation.guestId);
      const property = propertyMap.get(reservation.propertyId);
      const matchesSearch =
        !term ||
        guest?.name.toLowerCase().includes(term) ||
        guest?.email.toLowerCase().includes(term) ||
        property?.name.toLowerCase().includes(term) ||
        property?.city.toLowerCase().includes(term) ||
        reservation.id.toLowerCase().includes(term) ||
        reservation.source.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      const matchesProperty = propertyFilter === 'all' || reservation.propertyId === propertyFilter;
      return matchesSearch && matchesStatus && matchesProperty;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case 'checkin-asc':
          return a.checkIn.localeCompare(b.checkIn);
        case 'total-desc':
          return b.total - a.total;
        case 'created-desc':
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return b.checkIn.localeCompare(a.checkIn);
      }
    });
  }, [reservations, guestMap, propertyMap, search, statusFilter, propertyFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreate = () => {
    const next = new URLSearchParams(searchParams);
    next.set('new', '1');
    setSearchParams(next);
  };
  const closeForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
    setEditing(null);
  };

  const hasFilters = Boolean(search) || statusFilter !== 'all' || propertyFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPropertyFilter('all');
    setSort('checkin-desc');
  };

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Every stay across your portfolio, with live status and payment details."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                exportReservationsCsv(filtered, propertyById, guestById);
                toast.success('Export ready', `${filtered.length} reservations exported to CSV.`);
              }}
            >
              <Download size={16} />
              Export
            </Button>
            <Button onClick={openCreate}>
              <CalendarPlus size={16} />
              New reservation
            </Button>
          </>
        }
      />

      <Card className="mb-4 p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by guest, property, email or booking ID…"
              aria-label="Search reservations"
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select
              value={propertyFilter}
              onChange={(event) => setPropertyFilter(event.target.value)}
              aria-label="Filter by property"
              className="sm:w-44"
            >
              <option value="all">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Sort reservations"
              className="sm:w-44"
            >
              <option value="checkin-desc">Newest check-in</option>
              <option value="checkin-asc">Oldest check-in</option>
              <option value="total-desc">Highest value</option>
              <option value="created-desc">Recently booked</option>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <ArrowUpDown size={14} className="shrink-0 text-slate-400" />
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  active
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {tab.label}
                <span className={cn('text-[10px]', active ? 'text-indigo-500 dark:text-indigo-300' : 'text-slate-400')}>
                  {counts[tab.value] ?? 0}
                </span>
              </button>
            );
          })}
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto shrink-0 text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
            >
              Reset
            </button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No reservations match"
            description="Try a different guest, property or status — or create a new booking."
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <CalendarPlus size={16} /> New reservation
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                    <th className="px-5 py-3 font-semibold">Guest</th>
                    <th className="px-5 py-3 font-semibold">Property</th>
                    <th className="px-5 py-3 font-semibold">Check-in</th>
                    <th className="px-5 py-3 font-semibold">Check-out</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Source</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pageItems.map((reservation) => {
                    const guest = guestMap.get(reservation.guestId);
                    const property = propertyMap.get(reservation.propertyId);
                    return (
                      <tr
                        key={reservation.id}
                        onClick={() => setSelectedId(reservation.id)}
                        className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={guest?.name ?? 'Guest'} size="sm" />
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-medium text-slate-900 dark:text-slate-100">
                                {guest?.name ?? 'Unknown guest'}
                                {guest?.vip && <Badge tone="amber">VIP</Badge>}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">{guest?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{property?.name ?? '—'}</p>
                          <p className="text-[11px] text-slate-400">
                            {property?.city} · {reservation.nights} nights
                          </p>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {fmtDate(reservation.checkIn, 'MMM d, yyyy')}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {fmtDate(reservation.checkOut, 'MMM d, yyyy')}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={reservation.status} />
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {reservation.source}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                          {money(reservation.total)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              aria-label="Delete reservation"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteTarget(reservation);
                              }}
                              className="icon-btn h-8 w-8 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {pageItems.map((reservation) => {
                const guest = guestMap.get(reservation.guestId);
                const property = propertyMap.get(reservation.propertyId);
                return (
                  <li key={reservation.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(reservation.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') setSelectedId(reservation.id);
                      }}
                      className="cursor-pointer p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={guest?.name ?? 'Guest'} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {guest?.name ?? 'Unknown guest'}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {property?.name ?? '—'} · {property?.city}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={reservation.status} />
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {fmtDate(reservation.checkIn, 'MMM d')} – {fmtDate(reservation.checkOut, 'MMM d')}
                          <span className="block text-[11px] text-slate-400">
                            {reservation.nights} nights · {reservation.source}
                          </span>
                        </div>
                        <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                          {money(reservation.total)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
              <p>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length} reservations
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={14} /> Prev
                </Button>
                <span className="min-w-[80px] text-center font-medium">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <p className="mt-3 text-center text-xs text-slate-400">
        Tip: use{' '}
        <Link to="/calendar" className="font-medium text-indigo-500 hover:underline">
          the calendar
        </Link>{' '}
        to drag bookings to new dates.
      </p>

      <ReservationFormModal
        open={creating || Boolean(editing)}
        onClose={closeForm}
        reservation={editing}
      />

      <ReservationDetailsModal
        reservationId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={(reservation) => {
          setSelectedId(null);
          setEditing(reservation);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const guest = guestMap.get(deleteTarget.guestId)?.name ?? 'The booking';
          deleteReservation(deleteTarget.id);
          toast.success('Reservation deleted', `${guest}'s booking was removed.`);
        }}
        title="Delete this reservation?"
        description="The booking will be removed from your records and freed in the calendar. This cannot be undone."
        confirmLabel="Delete reservation"
      />
    </div>
  );
}
