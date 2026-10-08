import { useMemo, useState } from 'react'
import { Download, FilePlus2, FileText, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useLocation } from 'wouter'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/field'
import { documentsCsv, download } from '@/lib/csv'
import { formatDate, today } from '@/lib/dates'
import { displayStatus, STATUS_LABEL, totals } from '@/lib/documents'
import { formatMoney } from '@/lib/money'
import type { DisplayStatus, DocKind } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

type KindFilter = 'all' | DocKind
const KIND_TABS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'quote', label: 'Quotes' },
]
const STATUS_FILTERS: DisplayStatus[] = ['draft', 'sent', 'overdue', 'paid', 'accepted']

export function Documents() {
  const docs = useStore((s) => s.docs)
  const clients = useStore((s) => s.clients)
  const createDoc = useStore((s) => s.createDoc)
  const [, navigate] = useLocation()
  const [kind, setKind] = useState<KindFilter>('all')
  const [status, setStatus] = useState<DisplayStatus | null>(null)
  const [query, setQuery] = useState('')
  const now = today()

  const clientName = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients])
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs
      .map((d) => ({ doc: d, status: displayStatus(d, now), total: totals(d).total, client: d.clientId ? (clientName.get(d.clientId) ?? '') : '' }))
      .filter((r) => (kind === 'all' || r.doc.kind === kind) && (!status || r.status === status))
      .filter((r) => !q || r.doc.number.toLowerCase().includes(q) || r.client.toLowerCase().includes(q))
      .sort((a, b) => b.doc.issueDate.localeCompare(a.doc.issueDate) || b.doc.number.localeCompare(a.doc.number))
  }, [docs, kind, status, query, clientName, now])

  const exportCsv = () => {
    if (!rows.length) return toast.error('Nothing to export with these filters')
    download(`paidup-${kind}-${now}.csv`, documentsCsv(rows.map((r) => r.doc), clients, now))
    toast.success(`Exported ${rows.length} document${rows.length === 1 ? '' : 's'}`)
  }

  return (
    <>
      <PageHeader
        eyebrow='Billing'
        title='Invoices & quotes'
        description='Everything you have sent, drafted or been paid for.'
        actions={
          <>
            <Button onClick={exportCsv}>
              <Download /> Export CSV
            </Button>
            <Button onClick={() => navigate(`/documents/${createDoc('quote')}`)}>
              <FileText /> New quote
            </Button>
            <Button variant='ink' onClick={() => navigate(`/documents/${createDoc('invoice')}`)}>
              <FilePlus2 /> New invoice
            </Button>
          </>
        }
      />

      <div className='mb-4 flex flex-wrap items-center gap-3'>
        <div role='tablist' aria-label='Document type' className='inline-flex rounded-xl border bg-card p-1'>
          {KIND_TABS.map((t) => (
            <button
              key={t.value}
              role='tab'
              aria-selected={kind === t.value}
              onClick={() => setKind(t.value)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition',
                kind === t.value && 'bg-ink text-ink-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className='flex flex-wrap gap-1.5'>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              aria-pressed={status === s}
              onClick={() => setStatus(status === s ? null : s)}
              className={cn(
                'rounded-full border px-3 py-1 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground',
                status === s && 'border-primary-strong bg-primary-soft text-foreground'
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className='relative ml-auto w-full sm:w-64'>
          <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input aria-label='Search documents' placeholder='Search number or client' className='pl-9' value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <Card className='overflow-hidden'>
        {rows.length === 0 ? (
          <div className='px-6 py-16 text-center'>
            <p className='font-bold'>No documents match</p>
            <p className='mt-1 text-sm text-muted-foreground'>Try another filter, or create a new invoice.</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b bg-muted/50 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase'>
                  <th className='px-5 py-3'>Number</th>
                  <th className='px-5 py-3'>Client</th>
                  <th className='hidden px-5 py-3 sm:table-cell'>Issued</th>
                  <th className='hidden px-5 py-3 sm:table-cell'>Due</th>
                  <th className='px-5 py-3'>Status</th>
                  <th className='px-5 py-3 text-right'>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ doc, status: s, total, client }) => (
                  <tr key={doc.id} className='group border-b last:border-0 hover:bg-muted/40'>
                    <td className='px-5 py-3.5'>
                      <Link href={`/documents/${doc.id}`} className='font-bold group-hover:underline'>
                        {doc.number}
                      </Link>
                      <span className='ml-2 text-xs text-muted-foreground'>{doc.kind === 'quote' ? 'Quote' : ''}</span>
                    </td>
                    <td className='px-5 py-3.5'>{client || <span className='text-muted-foreground'>No client</span>}</td>
                    <td className='hidden px-5 py-3.5 text-muted-foreground sm:table-cell'>{formatDate(doc.issueDate)}</td>
                    <td className='hidden px-5 py-3.5 text-muted-foreground sm:table-cell'>{formatDate(doc.dueDate)}</td>
                    <td className='px-5 py-3.5'>
                      <StatusBadge status={s} />
                    </td>
                    <td className='tabular px-5 py-3.5 text-right font-bold'>{formatMoney(total, doc.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className='mt-3 text-xs text-muted-foreground'>
        {rows.length} of {docs.length} documents
      </p>
    </>
  )
}
