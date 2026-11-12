import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '@/store/AppStore';
import { useToast } from '@/store/ToastContext';
import { Button, Field, Input, Textarea } from '@/components/ui';
import { Modal } from '@/components/Modal';

const schema = z.object({
  name: z.string().min(2, 'Enter the guest’s full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(6, 'Enter a contact number'),
  country: z.string().min(2, 'Enter a country'),
  company: z.string().max(80).optional(),
  notes: z.string().max(400, 'Keep notes under 400 characters').optional(),
  vip: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: '',
  email: '',
  phone: '',
  country: '',
  company: '',
  notes: '',
  vip: false,
};

export function GuestFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addGuest } = useApp();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onSubmit = (values: FormValues) => {
    addGuest({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      country: values.country.trim(),
      company: values.company?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      vip: Boolean(values.vip),
    });
    toast.success('Guest added', `${values.name} is now in your guest book.`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a guest"
      description="Create a profile before assigning their first stay."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="guest-form">
            Add guest
          </Button>
        </>
      }
    >
      <form id="guest-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="guest-name" error={errors.name?.message} className="sm:col-span-2">
          <Input id="guest-name" placeholder="Sofia Almeida" invalid={Boolean(errors.name)} {...register('name')} />
        </Field>
        <Field label="Email" htmlFor="guest-email" error={errors.email?.message}>
          <Input id="guest-email" type="email" placeholder="sofia@example.com" invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
        <Field label="Phone" htmlFor="guest-phone" error={errors.phone?.message}>
          <Input id="guest-phone" placeholder="+351 912 445 019" invalid={Boolean(errors.phone)} {...register('phone')} />
        </Field>
        <Field label="Country" htmlFor="guest-country" error={errors.country?.message}>
          <Input id="guest-country" placeholder="Portugal" invalid={Boolean(errors.country)} {...register('country')} />
        </Field>
        <Field label="Company" htmlFor="guest-company" error={errors.company?.message} hint="Optional">
          <Input id="guest-company" placeholder="Company name" {...register('company')} />
        </Field>
        <Field label="Notes" htmlFor="guest-notes" error={errors.notes?.message} className="sm:col-span-2">
          <Textarea id="guest-notes" rows={2} placeholder="Preferences, allergies, arrival notes…" {...register('notes')} />
        </Field>
        <label className="flex items-center gap-2.5 sm:col-span-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
            {...register('vip')}
          />
          <span className="text-sm text-slate-600 dark:text-slate-300">Mark as VIP guest</span>
        </label>
      </form>
    </Modal>
  );
}
