import { useMemo, useState } from 'react';
import {
  Bath,
  BedDouble,
  Building2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import type { Property, PropertyStatus } from '@/lib/types';
import { cn, fmtDate, iso } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Skeleton } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { PropertyImage } from '@/components/PropertyImage';
import { PropertyFormModal } from '@/components/forms/PropertyForm';

const STATUS_BADGE: Record<PropertyStatus, { label: string; tone: 'emerald' | 'amber' | 'slate' }> = {
  active: { label: 'Active', tone: 'emerald' },
  maintenance: { label: 'Maintenance', tone: 'amber' },
  inactive: { label: 'Inactive', tone: 'slate' },
};

export default function Properties() {
  const { properties, reservations, loading, money, guestById, deleteProperty } = useApp();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PropertyStatus>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const todayISO = iso(new Date());
  const types = useMemo(() => Array.from(new Set(properties.map((property) => property.type))), [properties]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesSearch =
        !term ||
        property.name.toLowerCase().includes(term) ||
        property.city.toLowerCase().includes(term) ||
        property.country.toLowerCase().includes(term) ||
        property.address.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      const matchesType = typeFilter === 'all' || property.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [properties, search, statusFilter, typeFilter]);

  const availability = (propertyId: string) => {
    const upcoming = reservations
      .filter(
        (reservation) =>
          reservation.propertyId === propertyId &&
          reservation.status !== 'cancelled' &&
          reservation.checkOut > todayISO,
      )
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    const current = upcoming.find(
      (reservation) => reservation.checkIn <= todayISO && reservation.checkOut > todayISO,
    );
    if (current) return { occupied: true as const, until: current.checkOut };
    return { occupied: false as const, next: upcoming[0]?.checkIn };
  };

  const detail = detailId ? properties.find((property) => property.id === detailId) : undefined;
  const detailBookings = detail
    ? reservations
        .filter(
          (reservation) =>
            reservation.propertyId === detail.id &&
            reservation.status !== 'cancelled' &&
            reservation.checkOut >= todayISO,
        )
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
        .slice(0, 4)
    : [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (property: Property) => {
    setEditing(property);
    setDetailId(null);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Manage the holiday homes, apartments and villas in your portfolio."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add property
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
              placeholder="Search by name, city or address…"
              aria-label="Search properties"
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | PropertyStatus)}
              aria-label="Filter by status"
              className="sm:w-40"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </Select>
            <Select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter by type"
              className="sm:w-40"
            >
              <option value="all">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <span className="col-span-2 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 sm:ml-2">
              {filtered.length} of {properties.length} properties
            </span>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[380px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No properties found"
            description={
              properties.length === 0
                ? 'Add your first property to start taking bookings.'
                : 'Try adjusting your search or filters to see more of your portfolio.'
            }
            action={
              properties.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus size={16} /> Add property
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => {
            const status = STATUS_BADGE[property.status];
            const availabilityInfo = availability(property.id);
            return (
              <Card key={property.id} className="group flex flex-col overflow-hidden card-hover">
                <div className="relative h-44" onClick={() => setDetailId(property.id)}>
                  <PropertyImage src={property.image} alt={property.name} className="h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <Badge tone={status.tone} dot>
                      {status.label}
                    </Badge>
                  </div>
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 backdrop-blur dark:bg-slate-900/80 dark:text-slate-200">
                    {property.type}
                  </span>
                  <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold">{property.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-white/75">
                        <MapPin size={12} /> {property.city}, {property.country}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold">{money(property.nightlyRate)}</p>
                      <p className="text-[10px] text-white/70">per night</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <BedDouble size={14} /> {property.bedrooms}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bath size={14} /> {property.bathrooms}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} /> {property.maxGuests}
                      </span>
                    </div>
                    {property.rating > 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        {property.rating.toFixed(2)}
                        <span className="text-slate-400">({property.reviews})</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">New listing</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] dark:bg-slate-950/50">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        property.status !== 'active'
                          ? 'bg-slate-400'
                          : availabilityInfo.occupied
                            ? 'bg-rose-500'
                            : 'bg-emerald-500',
                      )}
                    />
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {property.status === 'maintenance'
                        ? 'Closed for maintenance'
                        : property.status === 'inactive'
                          ? 'Not accepting bookings'
                          : availabilityInfo.occupied
                            ? `Occupied until ${fmtDate(availabilityInfo.until, 'MMM d')}`
                            : availabilityInfo.next
                              ? `Available · next stay ${fmtDate(availabilityInfo.next, 'MMM d')}`
                              : 'Available · no upcoming stays'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <Button variant="secondary" size="sm" onClick={() => setDetailId(property.id)}>
                      View details
                    </Button>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(property)}
                        aria-label={`Edit ${property.name}`}
                        className="icon-btn h-8 w-8"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(property)}
                        aria-label={`Delete ${property.name}`}
                        className="icon-btn h-8 w-8 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PropertyFormModal open={formOpen} onClose={() => setFormOpen(false)} property={editing} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const affected = reservations.filter((reservation) => reservation.propertyId === deleteTarget.id).length;
          const name = deleteTarget.name;
          deleteProperty(deleteTarget.id);
          toast.success(
            'Property deleted',
            `${name}${affected ? ` and ${affected} reservations were` : ' was'} removed from your portfolio.`,
          );
        }}
        title="Delete this property?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be removed from your portfolio along with ${reservations.filter((reservation) => reservation.propertyId === deleteTarget.id).length} linked reservations. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete property"
      />

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? 'Property'}
        description={detail ? `${detail.type} · ${detail.city}, ${detail.country}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailId(null)}>
              Close
            </Button>
            {detail && (
              <Button onClick={() => openEdit(detail)}>
                <Pencil size={15} /> Edit property
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <PropertyImage
              src={detail.image}
              alt={detail.name}
              className="h-52 w-full rounded-xl"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_BADGE[detail.status].tone} dot>
                {STATUS_BADGE[detail.status].label}
              </Badge>
              <Badge tone="slate">{detail.type}</Badge>
              {detail.rating > 0 && (
                <Badge tone="amber">
                  <Star size={12} className="fill-amber-500" /> {detail.rating.toFixed(2)} · {detail.reviews} reviews
                </Badge>
              )}
              <span className="ml-auto text-sm font-semibold text-slate-900 dark:text-white">
                {money(detail.nightlyRate)} <span className="text-xs font-normal text-slate-400">/ night</span>
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{detail.description}</p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Bedrooms', value: detail.bedrooms },
                { label: 'Bathrooms', value: detail.bathrooms },
                { label: 'Max guests', value: detail.maxGuests },
                { label: 'Cleaning fee', value: money(detail.cleaningFee) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.amenities.map((amenity) => (
                  <span key={amenity} className="chip border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Upcoming stays
              </p>
              {detailBookings.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No upcoming stays for this property.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                  {detailBookings.map((reservation) => (
                    <li key={reservation.id} className="flex items-center gap-3 p-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {guestById(reservation.guestId)?.name ?? 'Guest'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {fmtDate(reservation.checkIn, 'MMM d')} – {fmtDate(reservation.checkOut, 'MMM d')} · {reservation.nights} nights
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {money(reservation.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

