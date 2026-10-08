import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, today } from '@/lib/dates'
import { nextNumber } from '@/lib/documents'
import type { Business, Client, Doc, DocKind, LineItem } from '@/lib/types'
import { uid } from '@/lib/utils'
import { sampleBusiness, sampleClients, sampleDocs } from './sample'

type State = {
  business: Business
  clients: Client[]
  docs: Doc[]
  updateBusiness: (patch: Partial<Business>) => void
  createDoc: (kind: DocKind, clientId?: string | null) => string
  updateDoc: (id: string, patch: Partial<Doc>) => void
  addItem: (id: string) => void
  updateItem: (id: string, itemId: string, patch: Partial<LineItem>) => void
  removeItem: (id: string, itemId: string) => void
  moveItem: (id: string, itemId: string, dir: -1 | 1) => void
  duplicateDoc: (id: string) => string | null
  deleteDoc: (id: string) => void
  setStatus: (id: string, status: Doc['status']) => void
  convertQuote: (id: string) => string | null
  saveClient: (client: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => string
  deleteClient: (id: string) => void
  replaceAll: (data: Pick<State, 'business' | 'clients' | 'docs'>) => void
  resetDemo: () => void
  clearAll: () => void
}

const now = () => new Date().toISOString()
const blankItem = (): LineItem => ({ id: uid('li-'), description: '', quantity: 1, rate: 0 })

function touch(docs: Doc[], id: string, fn: (d: Doc) => Doc) {
  return docs.map((d) => (d.id === id ? { ...fn(d), updatedAt: now() } : d))
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      business: sampleBusiness,
      clients: sampleClients,
      docs: sampleDocs(),

      updateBusiness: (patch) => set((s) => ({ business: { ...s.business, ...patch } })),

      createDoc: (kind, clientId = null) => {
        const { business, docs } = get()
        const issueDate = today()
        const doc: Doc = {
          id: uid('d-'),
          kind,
          number: nextNumber(docs, kind === 'invoice' ? business.invoicePrefix : business.quotePrefix),
          status: 'draft',
          clientId,
          issueDate,
          dueDate: addDays(issueDate, kind === 'invoice' ? business.paymentTermsDays : business.quoteValidDays),
          currency: business.currency,
          items: [blankItem()],
          taxRate: business.defaultTaxRate,
          discount: { type: 'percent', value: 0 },
          notes: business.defaultNotes,
          terms: kind === 'invoice' ? business.defaultTerms : `This quote is valid for ${business.quoteValidDays} days.`,
          createdAt: now(),
          updatedAt: now(),
        }
        set({ docs: [doc, ...docs] })
        return doc.id
      },

      updateDoc: (id, patch) => set((s) => ({ docs: touch(s.docs, id, (d) => ({ ...d, ...patch })) })),

      addItem: (id) => set((s) => ({ docs: touch(s.docs, id, (d) => ({ ...d, items: [...d.items, blankItem()] })) })),

      updateItem: (id, itemId, patch) =>
        set((s) => ({
          docs: touch(s.docs, id, (d) => ({
            ...d,
            items: d.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
          })),
        })),

      removeItem: (id, itemId) =>
        set((s) => ({
          docs: touch(s.docs, id, (d) => {
            const items = d.items.filter((i) => i.id !== itemId)
            return { ...d, items: items.length ? items : [blankItem()] }
          }),
        })),

      moveItem: (id, itemId, dir) =>
        set((s) => ({
          docs: touch(s.docs, id, (d) => {
            const i = d.items.findIndex((x) => x.id === itemId)
            const j = i + dir
            if (i < 0 || j < 0 || j >= d.items.length) return d
            const items = [...d.items]
            ;[items[i], items[j]] = [items[j], items[i]]
            return { ...d, items }
          }),
        })),

      duplicateDoc: (id) => {
        const { docs, business } = get()
        const src = docs.find((d) => d.id === id)
        if (!src) return null
        const issueDate = today()
        const copy: Doc = {
          ...src,
          id: uid('d-'),
          number: nextNumber(docs, src.kind === 'invoice' ? business.invoicePrefix : business.quotePrefix),
          status: 'draft',
          issueDate,
          dueDate: addDays(issueDate, src.kind === 'invoice' ? business.paymentTermsDays : business.quoteValidDays),
          items: src.items.map((i) => ({ ...i, id: uid('li-') })),
          sentAt: undefined,
          paidAt: undefined,
          fromQuoteId: undefined,
          convertedInvoiceId: undefined,
          createdAt: now(),
          updatedAt: now(),
        }
        set({ docs: [copy, ...docs] })
        return copy.id
      },

      deleteDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),

      setStatus: (id, status) =>
        set((s) => ({
          docs: touch(s.docs, id, (d) => ({
            ...d,
            status,
            sentAt: status === 'draft' ? undefined : (d.sentAt ?? now()),
            paidAt: status === 'paid' ? (d.paidAt ?? now()) : undefined,
          })),
        })),

      convertQuote: (id) => {
        const { docs, business } = get()
        const quote = docs.find((d) => d.id === id && d.kind === 'quote')
        if (!quote) return null
        if (quote.convertedInvoiceId && docs.some((d) => d.id === quote.convertedInvoiceId)) {
          return quote.convertedInvoiceId
        }
        const issueDate = today()
        const invoice: Doc = {
          ...quote,
          id: uid('d-'),
          kind: 'invoice',
          number: nextNumber(docs, business.invoicePrefix),
          status: 'draft',
          issueDate,
          dueDate: addDays(issueDate, business.paymentTermsDays),
          items: quote.items.map((i) => ({ ...i, id: uid('li-') })),
          terms: business.defaultTerms,
          fromQuoteId: quote.id,
          convertedInvoiceId: undefined,
          sentAt: undefined,
          paidAt: undefined,
          createdAt: now(),
          updatedAt: now(),
        }
        set({
          docs: [
            invoice,
            ...docs.map((d) =>
              d.id === quote.id ? { ...d, status: 'accepted' as const, convertedInvoiceId: invoice.id, updatedAt: now() } : d
            ),
          ],
        })
        return invoice.id
      },

      saveClient: ({ id, ...values }) => {
        if (id) {
          set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...values } : c)) }))
          return id
        }
        const client: Client = { ...values, id: uid('c-'), createdAt: now() }
        set((s) => ({ clients: [client, ...s.clients] }))
        return client.id
      },

      deleteClient: (id) =>
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          docs: s.docs.map((d) => (d.clientId === id ? { ...d, clientId: null } : d)),
        })),

      replaceAll: (data) => set({ business: data.business, clients: data.clients, docs: data.docs }),
      resetDemo: () => set({ business: sampleBusiness, clients: sampleClients, docs: sampleDocs() }),
      clearAll: () => set((s) => ({ clients: [], docs: [], business: { ...s.business } })),
    }),
    { name: 'paidup-data', version: 1 }
  )
)
