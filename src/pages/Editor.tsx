import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUp,
  BellRing,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Plus,
  Send,
  Trash2,
  Undo2,
  UserPlus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link, useLocation } from 'wouter'
import { ClientDialog } from '@/components/ClientDialog'
import { DocPreview } from '@/components/doc/DocPreview'
import { SendDialog } from '@/components/doc/SendDialog'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Label, Select, Textarea } from '@/components/ui/field'
import { addDays, daysBetween, today } from '@/lib/dates'
import { displayStatus, kindLabel, lineTotal, totals } from '@/lib/documents'
import { CURRENCIES, formatMoney, parseAmount } from '@/lib/money'
import type { Doc, LineItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { downloadPdf } from '@/pdf/download'
import { useStore } from '@/store'
import { NotFound } from './NotFound'

const TERMS = [
  { label: 'On receipt', days: 0 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
]

export function Editor({ id }: { id: string }) {
  const doc = useStore((s) => s.docs.find((d) => d.id === id))
  if (!doc) return <NotFound title='This document no longer exists' />
  return <EditorView doc={doc} />
}

function EditorView({ doc }: { doc: Doc }) {
  const [, navigate] = useLocation()
  const docs = useStore((s) => s.docs)
  const clients = useStore((s) => s.clients)
  const business = useStore((s) => s.business)
  const { updateDoc, addItem, updateItem, removeItem, moveItem, setStatus, duplicateDoc, deleteDoc, convertQuote } = useStore.getState()
  const [clientOpen, setClientOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const client = clients.find((c) => c.id === doc.clientId)
  const now = today()
  const status = displayStatus(doc, now)
  const t = totals(doc)
  const isInvoice = doc.kind === 'invoice'
  const numberTaken = docs.some((d) => d.id !== doc.id && d.number.trim() === doc.number.trim())
  const update = (patch: Partial<Doc>) => updateDoc(doc.id, patch)

  // Item library: the latest rate used for each description across all documents
  const library = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of [...docs].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))) {
      for (const i of d.items) if (i.description.trim()) map.set(i.description.trim(), i.rate)
    }
    return map
  }, [docs])

  const onDescription = (item: LineItem, value: string) => {
    const known = library.get(value.trim())
    updateItem(doc.id, item.id, known !== undefined && !item.rate ? { description: value, rate: known } : { description: value })
  }

  const pdf = async () => {
    setPdfBusy(true)
    try {
      await downloadPdf(doc, client, business)
      toast.success(`${doc.number}.pdf downloaded`)
    } catch (e) {
      console.error(e)
      toast.error('Could not create the PDF. Please try again.')
    } finally {
      setPdfBusy(false)
    }
  }

  const termDays = daysBetween(doc.issueDate, doc.dueDate)

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-center gap-3'>
        <Link href='/documents' className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground'>
          <ArrowLeft className='size-4' /> Invoices & quotes
        </Link>
        <span className='text-muted-foreground'>/</span>
        <h1 className='text-xl font-extrabold tracking-tight'>
          {kindLabel(doc.kind)} {doc.number}
        </h1>
        <StatusBadge status={status} />
        {doc.fromQuoteId && (
          <Link href={`/documents/${doc.fromQuoteId}`} className='text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline'>
            from quote
          </Link>
        )}
        <div className='ml-auto flex flex-wrap gap-2'>
          <Button size='sm' onClick={() => { const id = duplicateDoc(doc.id); if (id) { toast.success('Duplicated as a new draft'); navigate(`/documents/${id}`) } }}>
            <Copy /> Duplicate
          </Button>
          <Button size='sm' variant='ghost' aria-label='Delete' onClick={() => setDeleteOpen(true)}>
            <Trash2 />
          </Button>
          <Button size='sm' onClick={pdf} disabled={pdfBusy}>
            {pdfBusy ? <Loader2 className='animate-spin' /> : <Download />} PDF
          </Button>
          {status === 'draft' && (
            <Button size='sm' variant='primary' onClick={() => setSendOpen(true)}>
              <Send /> Send {kindLabel(doc.kind).toLowerCase()}
            </Button>
          )}
          {isInvoice && (status === 'sent' || status === 'overdue') && (
            <>
              <Button size='sm' onClick={() => setSendOpen(true)}>
                <BellRing /> {status === 'overdue' ? 'Chase payment' : 'Remind'}
              </Button>
              <Button size='sm' variant='primary' onClick={() => { setStatus(doc.id, 'paid'); toast.success(`${doc.number} marked as paid`) }}>
                <CheckCircle2 /> Mark paid
              </Button>
            </>
          )}
          {isInvoice && status === 'paid' && (
            <>
              <Button size='sm' onClick={() => setSendOpen(true)}>
                <Send /> Thank-you note
              </Button>
              <Button size='sm' onClick={() => { setStatus(doc.id, 'sent'); toast('Marked as unpaid') }}>
                <Undo2 /> Mark unpaid
              </Button>
            </>
          )}
          {!isInvoice && status === 'sent' && (
            <Button size='sm' onClick={() => { setStatus(doc.id, 'declined'); toast('Quote marked as declined') }}>
              <X /> Declined
            </Button>
          )}
          {!isInvoice && status !== 'declined' && status !== 'draft' && (
            <Button
              size='sm'
              variant='primary'
              onClick={() => {
                const existed = !!doc.convertedInvoiceId && docs.some((d) => d.id === doc.convertedInvoiceId)
                const invoiceId = convertQuote(doc.id)
                if (invoiceId) {
                  toast.success(existed ? 'Opened the invoice for this quote' : 'Quote accepted and turned into a draft invoice')
                  navigate(`/documents/${invoiceId}`)
                }
              }}
            >
              <ArrowRightLeft /> {doc.convertedInvoiceId ? 'Open invoice' : 'Convert to invoice'}
            </Button>
          )}
        </div>
      </div>

      {status === 'overdue' && (
        <div role='status' className='mb-5 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm'>
          <BellRing className='size-4 text-danger' />
          <span>
            <strong>{daysBetween(doc.dueDate, now)} days overdue.</strong> A short, friendly reminder usually does the trick.
          </span>
          <Button size='sm' variant='ink' className='ml-auto' onClick={() => setSendOpen(true)}>
            Write reminder
          </Button>
        </div>
      )}

      <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]'>
        <div className='space-y-5'>
          <Card>
            <CardHeader title='Client & dates' />
            <div className='grid gap-4 p-5 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <Label htmlFor='client'>Bill to</Label>
                <div className='flex gap-2'>
                  <Select id='client' value={doc.clientId ?? ''} onChange={(e) => update({ clientId: e.target.value || null })}>
                    <option value=''>Choose a client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Button aria-label='Add a new client' onClick={() => setClientOpen(true)}>
                    <UserPlus /> <span className='hidden sm:inline'>New</span>
                  </Button>
                </div>
              </div>
              <Field label='Number' htmlFor='number' error={numberTaken ? 'Another document already uses this number' : undefined}>
                <Input id='number' value={doc.number} onChange={(e) => update({ number: e.target.value })} />
              </Field>
              <Field label='Currency' htmlFor='currency'>
                <Select id='currency' value={doc.currency} onChange={(e) => update({ currency: e.target.value })}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label='Issue date' htmlFor='issue'>
                <Input
                  id='issue'
                  type='date'
                  value={doc.issueDate}
                  onChange={(e) => e.target.value && update({ issueDate: e.target.value, dueDate: addDays(e.target.value, Math.max(0, termDays)) })}
                />
              </Field>
              <Field label={isInvoice ? 'Due date' : 'Valid until'} htmlFor='due' error={termDays < 0 ? 'Must be on or after the issue date' : undefined}>
                <Input id='due' type='date' value={doc.dueDate} min={doc.issueDate} onChange={(e) => e.target.value && update({ dueDate: e.target.value })} />
              </Field>
              {isInvoice && (
                <div className='flex flex-wrap gap-1.5 sm:col-span-2' aria-label='Payment terms'>
                  {TERMS.map((term) => (
                    <button
                      key={term.days}
                      type='button'
                      onClick={() => update({ dueDate: addDays(doc.issueDate, term.days) })}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground',
                        termDays === term.days && 'border-primary-strong bg-primary-soft text-foreground'
                      )}
                    >
                      {term.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title='Line items' description='Start typing a past item to reuse its rate.' />
            <datalist id='item-library'>
              {[...library.keys()].map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <div className='space-y-3 p-5'>
              {doc.items.map((item, idx) => (
                <div key={item.id} className='grid grid-cols-[72px_110px_minmax(0,1fr)] gap-2 rounded-xl border bg-surface p-3'>
                  <Input
                    aria-label={`Item ${idx + 1} description`}
                    list='item-library'
                    placeholder='What did you do?'
                    value={item.description}
                    onChange={(e) => onDescription(item, e.target.value)}
                    className='col-span-3'
                  />
                  <Input aria-label={`Item ${idx + 1} quantity`} type='number' min={0} step='any' value={item.quantity} onChange={(e) => updateItem(doc.id, item.id, { quantity: Math.max(0, parseAmount(e.target.value)) })} />
                  <Input aria-label={`Item ${idx + 1} rate`} type='number' min={0} step='any' value={item.rate} onChange={(e) => updateItem(doc.id, item.id, { rate: Math.max(0, parseAmount(e.target.value)) })} />
                  <div className='flex items-center justify-end gap-0.5'>
                    <span className='tabular mr-2 min-w-20 text-right text-sm font-bold'>{formatMoney(lineTotal(item), doc.currency)}</span>
                    <Button size='icon' variant='ghost' className='size-8' aria-label='Move up' disabled={idx === 0} onClick={() => moveItem(doc.id, item.id, -1)}>
                      <ArrowUp />
                    </Button>
                    <Button size='icon' variant='ghost' className='size-8' aria-label='Move down' disabled={idx === doc.items.length - 1} onClick={() => moveItem(doc.id, item.id, 1)}>
                      <ArrowDown />
                    </Button>
                    <Button size='icon' variant='ghost' className='size-8 hover:text-danger' aria-label={`Remove item ${idx + 1}`} onClick={() => removeItem(doc.id, item.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={() => addItem(doc.id)} className='w-full justify-center border-dashed'>
                <Plus /> Add line item
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title='Discount & tax' />
            <div className='grid gap-4 p-5 sm:grid-cols-3'>
              <Field label='Discount' htmlFor='discount'>
                <div className='flex gap-2'>
                  <Input id='discount' type='number' min={0} step='any' value={doc.discount.value} onChange={(e) => update({ discount: { ...doc.discount, value: Math.max(0, parseAmount(e.target.value)) } })} />
                  <Select aria-label='Discount type' className='w-20' value={doc.discount.type} onChange={(e) => update({ discount: { ...doc.discount, type: e.target.value as 'percent' | 'amount' } })}>
                    <option value='percent'>%</option>
                    <option value='amount'>{doc.currency}</option>
                  </Select>
                </div>
              </Field>
              <Field label={`${business.taxLabel || 'Tax'} rate (%)`} htmlFor='tax'>
                <Input id='tax' type='number' min={0} max={100} step='any' value={doc.taxRate} onChange={(e) => update({ taxRate: Math.min(100, Math.max(0, parseAmount(e.target.value))) })} />
              </Field>
              <div className='rounded-xl bg-primary-soft p-3 text-right'>
                <p className='text-xs font-bold text-muted-foreground'>Total</p>
                <p className='tabular text-xl font-extrabold tracking-tight'>{formatMoney(t.total, doc.currency)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title='Notes & terms' />
            <div className='grid gap-4 p-5'>
              <Field label='Note to client' htmlFor='notes'>
                <Textarea id='notes' rows={2} value={doc.notes} onChange={(e) => update({ notes: e.target.value })} />
              </Field>
              <Field label='Terms' htmlFor='terms'>
                <Textarea id='terms' rows={2} value={doc.terms} onChange={(e) => update({ terms: e.target.value })} />
              </Field>
            </div>
          </Card>
          <p className='text-xs text-muted-foreground'>Changes save automatically in this browser.</p>
        </div>

        <div className='lg:sticky lg:top-24'>
          <DocPreview doc={doc} client={client} business={business} />
        </div>
      </div>

      <ClientDialog open={clientOpen} onOpenChange={setClientOpen} onSaved={(cid) => update({ clientId: cid })} />
      <SendDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        doc={doc}
        client={client}
        business={business}
        onSent={() => {
          if (doc.status === 'draft') setStatus(doc.id, 'sent')
        }}
      />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen} title={`Delete ${doc.number}?`} description='This removes it from this browser and cannot be undone.'>
        <div className='flex justify-end gap-2'>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant='danger'
            onClick={() => {
              deleteDoc(doc.id)
              toast.success(`${doc.number} deleted`)
              navigate('/documents')
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
