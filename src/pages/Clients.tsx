import { useMemo, useState } from 'react'
import { FilePlus2, Mail, Pencil, Phone, Search, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useLocation } from 'wouter'
import { ClientDialog } from '@/components/ClientDialog'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/field'
import { today } from '@/lib/dates'
import { clientStats } from '@/lib/documents'
import { formatMoney } from '@/lib/money'
import type { Client } from '@/lib/types'
import { useStore } from '@/store'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

export function Clients() {
  const clients = useStore((s) => s.clients)
  const docs = useStore((s) => s.docs)
  const currency = useStore((s) => s.business.currency)
  const createDoc = useStore((s) => s.createDoc)
  const deleteClient = useStore((s) => s.deleteClient)
  const [, navigate] = useLocation()
  const [editing, setEditing] = useState<Client | undefined>()
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState<Client | null>(null)
  const [query, setQuery] = useState('')
  const now = today()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients
      .filter((c) => !q || [c.name, c.contact, c.email].some((v) => v.toLowerCase().includes(q)))
      .map((c) => ({ client: c, stats: clientStats(c, docs, now) }))
      .sort((a, b) => b.stats.owed - a.stats.owed || b.stats.paid - a.stats.paid)
  }, [clients, docs, query, now])

  return (
    <>
      <PageHeader
        eyebrow='Relationships'
        title='Clients'
        description='Who you work with, what they have paid and what is still open.'
        actions={
          <Button variant='ink' onClick={() => { setEditing(undefined); setOpen(true) }}>
            <UserPlus /> New client
          </Button>
        }
      />
      <div className='relative mb-5 max-w-sm'>
        <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input aria-label='Search clients' placeholder='Search name, contact or email' className='pl-9' value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {rows.length === 0 ? (
        <Card className='px-6 py-16 text-center'>
          <p className='font-bold'>{clients.length ? 'No clients match' : 'No clients yet'}</p>
          <p className='mt-1 text-sm text-muted-foreground'>Add the people and businesses you bill.</p>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {rows.map(({ client: c, stats }) => (
            <Card key={c.id} className='flex flex-col p-5'>
              <div className='flex items-start gap-3'>
                <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-sm font-extrabold text-ink-foreground'>
                  {initials(c.name) || '?'}
                </span>
                <div className='min-w-0 flex-1'>
                  <h2 className='truncate font-bold'>{c.name}</h2>
                  <p className='truncate text-sm text-muted-foreground'>{c.contact || 'No contact person'}</p>
                </div>
                <Button size='icon' variant='ghost' className='size-8' aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c); setOpen(true) }}>
                  <Pencil />
                </Button>
                <Button size='icon' variant='ghost' className='size-8 hover:text-danger' aria-label={`Delete ${c.name}`} onClick={() => setRemoving(c)}>
                  <Trash2 />
                </Button>
              </div>
              <div className='mt-4 space-y-1 text-sm text-muted-foreground'>
                {c.email && (
                  <a href={`mailto:${c.email}`} className='flex items-center gap-2 hover:text-foreground'>
                    <Mail className='size-3.5' /> {c.email}
                  </a>
                )}
                {c.phone && (
                  <p className='flex items-center gap-2'>
                    <Phone className='size-3.5' /> {c.phone}
                  </p>
                )}
              </div>
              <div className='mt-5 grid grid-cols-2 gap-3 border-t pt-4'>
                <div>
                  <p className='text-xs font-semibold text-muted-foreground'>Paid to date</p>
                  <p className='tabular font-extrabold'>{formatMoney(stats.paid, currency)}</p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-muted-foreground'>Still open</p>
                  <p className={`tabular font-extrabold ${stats.owed ? 'text-yellow-700 dark:text-primary' : ''}`}>{formatMoney(stats.owed, currency)}</p>
                </div>
              </div>
              <Button size='sm' className='mt-4 justify-center' onClick={() => navigate(`/documents/${createDoc('invoice', c.id)}`)}>
                <FilePlus2 /> New invoice for {c.name.split(' ')[0]}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <ClientDialog open={open} onOpenChange={setOpen} client={editing} />
      <Dialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Delete ${removing?.name ?? 'client'}?`}
        description='Their invoices and quotes stay, but will no longer be linked to a client.'
      >
        <div className='flex justify-end gap-2'>
          <Button onClick={() => setRemoving(null)}>Cancel</Button>
          <Button
            variant='danger'
            onClick={() => {
              if (removing) {
                deleteClient(removing.id)
                toast.success(`${removing.name} deleted`)
              }
              setRemoving(null)
            }}
          >
            Delete client
          </Button>
        </div>
      </Dialog>
    </>
  )
}
