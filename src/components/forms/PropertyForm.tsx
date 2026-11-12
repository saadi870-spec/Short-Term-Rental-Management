import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ImageIcon } from 'lucide-react';
import { IMAGE_FALLBACKS, PROPERTY_AMENITIES } from '@/lib/mock';
import type { Property } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/Modal';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Cabin', 'House', 'Studio', 'Chalet', 'Bungalow'] as const;

const schema = z.object({
  name: z.string().min(2, 'Give the property a name'),
  type: z.enum(PROPERTY_TYPES),
  status: z.enum(['active', 'inactive', 'maintenance']),
  address: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  bedrooms: z
    .number({ invalid_type_error: 'Enter a number' })
    .int('Use a whole number')
    .min(1, 'At least 1 bedroom')
    .max(20, 'That seems high'),
  bathrooms: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(1, 'At least 1 bathroom')
    .max(20, 'That seems high'),
  maxGuests: z
    .number({ invalid_type_error: 'Enter a number' })
    .int('Use a whole number')
    .min(1, 'At least 1 guest')
    .max(30, 'That seems high'),
  nightlyRate: z.number({ invalid_type_error: 'Enter a rate' }).min(1, 'Set a nightly rate'),
  cleaningFee: z.number({ invalid_type_error: 'Enter a fee' }).min(0, 'Cannot be negative'),
  image: z.string().url('Enter a valid image URL').or(z.literal('')),
  description: z.string().max(700, 'Keep the description under 700 characters').optional(),
  amenities: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: '',
  type: 'Apartment',
  status: 'active',
  address: '',
  city: '',
  country: '',
  bedrooms: 2,
  bathrooms: 1,
  maxGuests: 4,
  nightlyRate: 150,
  cleaningFee: 45,
  image: '',
  description: '',
  amenities: ['Wi-Fi', 'Kitchen'],
};

export function PropertyFormModal({
  open,
  onClose,
  property,
}: {
  open: boolean;
  onClose: () => void;
  property?: Property | null;
}) {
  const { addProperty, updateProperty } = useApp();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    reset(
      property
        ? {
            name: property.name,
            type: property.type,
            status: property.status,
            address: property.address,
            city: property.city,
            country: property.country,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            maxGuests: property.maxGuests,
            nightlyRate: property.nightlyRate,
            cleaningFee: property.cleaningFee,
            image: property.image,
            description: property.description,
            amenities: property.amenities,
          }
        : EMPTY,
    );
  }, [open, property, reset]);

  const amenities = watch('amenities') ?? [];
  const imageUrl = watch('image');

  const toggleAmenity = (amenity: string) => {
    const next = amenities.includes(amenity)
      ? amenities.filter((item) => item !== amenity)
      : [...amenities, amenity];
    setValue('amenities', next, { shouldDirty: true });
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      image: values.image.trim() || IMAGE_FALLBACKS.skyline,
      description: values.description?.trim() ?? '',
      amenities: values.amenities ?? [],
    };
    if (property) {
      updateProperty(property.id, payload);
      toast.success('Property updated', `${values.name} has been saved.`);
    } else {
      addProperty(payload);
      toast.success('Property added', `${values.name} is now part of your portfolio.`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={property ? 'Edit property' : 'Add a property'}
      description={
        property
          ? 'Update the details guests and your team see.'
          : 'List a new apartment, house or villa in your portfolio.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="property-form">
            {property ? 'Save changes' : 'Add property'}
          </Button>
        </>
      }
    >
      <form id="property-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Property name" htmlFor="name" error={errors.name?.message} className="sm:col-span-2">
          <Input id="name" placeholder="e.g. Skyline Loft" invalid={Boolean(errors.name)} {...register('name')} />
        </Field>

        <Field label="Type" htmlFor="type" error={errors.type?.message}>
          <Select id="type" {...register('type')}>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status" error={errors.status?.message}>
          <Select id="status" {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </Select>
        </Field>

        <Field label="Street address" htmlFor="address" error={errors.address?.message} className="sm:col-span-2">
          <Input id="address" placeholder="Rua da Boavista 42" invalid={Boolean(errors.address)} {...register('address')} />
        </Field>

        <Field label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" placeholder="Lisbon" invalid={Boolean(errors.city)} {...register('city')} />
        </Field>

        <Field label="Country" htmlFor="country" error={errors.country?.message}>
          <Input id="country" placeholder="Portugal" invalid={Boolean(errors.country)} {...register('country')} />
        </Field>

        <Field label="Bedrooms" htmlFor="bedrooms" error={errors.bedrooms?.message}>
          <Input id="bedrooms" type="number" min={1} invalid={Boolean(errors.bedrooms)} {...register('bedrooms', { valueAsNumber: true })} />
        </Field>

        <Field label="Bathrooms" htmlFor="bathrooms" error={errors.bathrooms?.message}>
          <Input id="bathrooms" type="number" min={1} step={0.5} invalid={Boolean(errors.bathrooms)} {...register('bathrooms', { valueAsNumber: true })} />
        </Field>

        <Field label="Max guests" htmlFor="maxGuests" error={errors.maxGuests?.message}>
          <Input id="maxGuests" type="number" min={1} invalid={Boolean(errors.maxGuests)} {...register('maxGuests', { valueAsNumber: true })} />
        </Field>

        <Field label="Nightly rate" htmlFor="nightlyRate" error={errors.nightlyRate?.message} hint="Shown to guests before fees">
          <Input id="nightlyRate" type="number" min={1} invalid={Boolean(errors.nightlyRate)} {...register('nightlyRate', { valueAsNumber: true })} />
        </Field>

        <Field label="Cleaning fee" htmlFor="cleaningFee" error={errors.cleaningFee?.message}>
          <Input id="cleaningFee" type="number" min={0} invalid={Boolean(errors.cleaningFee)} {...register('cleaningFee', { valueAsNumber: true })} />
        </Field>

        <Field
          label="Image URL"
          htmlFor="image"
          error={errors.image?.message}
          hint="Paste a hosted photo or leave blank for a placeholder"
          className="sm:col-span-2"
        >
          <div className="flex items-start gap-3">
            <Input id="image" placeholder="https://…" invalid={Boolean(errors.image)} {...register('image')} />
            <div className="flex h-[42px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-full w-full object-cover" onError={(event) => (event.currentTarget.style.display = 'none')} />
              ) : (
                <ImageIcon size={18} className="text-slate-400" />
              )}
            </div>
          </div>
        </Field>

        <Field label="Description" htmlFor="description" error={errors.description?.message} className="sm:col-span-2">
          <Textarea id="description" rows={3} placeholder="What makes this stay special?" {...register('description')} />
        </Field>

        <div className="sm:col-span-2">
          <p className="label">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_AMENITIES.map((amenity) => {
              const selected = amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                    selected
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  {selected && <Check size={12} />}
                  {amenity}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
