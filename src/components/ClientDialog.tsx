import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/field'
import type { Client } from '@/lib/types'
import { useStore } from '@/store'

const schema = z.object({
  name: z.string().trim().min(1, 'Add the business or person you bill').max(120),
  contact: z.string().trim().max(120),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === '' || v.replace(/\D/g, '').length >= 7, 'Enter a phone number with country code'),
  address: z.string().trim().max(300),
})

type Values = z.infer<typeof schema>
const empty: Values = { name: '', contact: '', email: '', phone: '', address: '' }

export function ClientDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
  onSaved?: (id: string) => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={client ? 'Edit client' : 'New client'}
      description='Saved clients fill in the "Bill to" block and power reminders.'
    >
      {/* Remount the form each time so it starts from the right values */}
      {open && <ClientForm client={client} onCancel={() => onOpenChange(false)} onSaved={(id) => { onSaved?.(id); onOpenChange(false) }} />}
    </Dialog>
  )
}

function ClientForm({ client, onCancel, onSaved }: { client?: Client; onCancel: () => void; onSaved: (id: string) => void }) {
  const saveClient = useStore((s) => s.saveClient)
  const [values, setValues] = useState<Values>(client ? { name: client.name, contact: client.contact, email: client.email, phone: client.phone, address: client.address } : empty)
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({})

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const next: typeof errors = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Values] ??= issue.message
      setErrors(next)
      return
    }
    const id = saveClient({ ...parsed.data, id: client?.id })
    toast.success(client ? 'Client updated' : `${parsed.data.name} added`)
    onSaved(id)
  }

  return (
    <form onSubmit={submit} className='grid gap-4 sm:grid-cols-2' noValidate>
      <Field label='Client name' htmlFor='c-name' error={errors.name} className='sm:col-span-2'>
        <Input id='c-name' autoFocus value={values.name} onChange={set('name')} placeholder='Kettle Bakery' />
      </Field>
      <Field label='Contact person' htmlFor='c-contact' error={errors.contact}>
        <Input id='c-contact' value={values.contact} onChange={set('contact')} placeholder='Leo Martins' />
      </Field>
      <Field label='Email' htmlFor='c-email' error={errors.email}>
        <Input id='c-email' type='email' value={values.email} onChange={set('email')} placeholder='leo@kettle.example' />
      </Field>
      <Field label='WhatsApp / phone' htmlFor='c-phone' error={errors.phone} hint='Include the country code for WhatsApp reminders'>
        <Input id='c-phone' value={values.phone} onChange={set('phone')} placeholder='+1 555 0102' />
      </Field>
      <Field label='Address' htmlFor='c-address' error={errors.address} className='sm:col-span-2'>
        <Textarea id='c-address' rows={2} value={values.address} onChange={set('address')} />
      </Field>
      <div className='flex justify-end gap-2 sm:col-span-2'>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type='submit' variant='ink'>
          {client ? 'Save changes' : 'Add client'}
        </Button>
      </div>
    </form>
  )
}
