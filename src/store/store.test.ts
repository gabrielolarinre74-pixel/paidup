import { beforeEach, describe, expect, it } from 'vitest'
import { sampleBusiness } from './sample'
import { useStore } from './index'

const get = () => useStore.getState()

describe('store', () => {
  beforeEach(() => useStore.setState({ business: sampleBusiness, clients: [], docs: [] }))

  it('creates numbered drafts with business defaults', () => {
    const a = get().createDoc('invoice')
    const b = get().createDoc('invoice')
    const q = get().createDoc('quote')
    const [docB, docA] = get().docs.filter((d) => d.kind === 'invoice')
    expect([docA.id, docB.id]).toEqual([a, b])
    expect(docA.number).toBe('INV-0001')
    expect(docB.number).toBe('INV-0002')
    expect(get().docs.find((d) => d.id === q)?.number).toBe('QTE-0001')
    expect(docA).toMatchObject({ status: 'draft', taxRate: 7.5, currency: 'USD' })
  })

  it('stamps sent and paid dates, and clears paid when reopened', () => {
    const id = get().createDoc('invoice')
    get().setStatus(id, 'paid')
    const paid = get().docs[0]
    expect(paid.sentAt).toBeTruthy()
    expect(paid.paidAt).toBeTruthy()
    get().setStatus(id, 'sent')
    expect(get().docs[0].paidAt).toBeUndefined()
  })

  it('keeps at least one line item and reorders items', () => {
    const id = get().createDoc('invoice')
    get().addItem(id)
    const [first, second] = get().docs[0].items
    get().moveItem(id, second.id, -1)
    expect(get().docs[0].items.map((i) => i.id)).toEqual([second.id, first.id])
    get().removeItem(id, first.id)
    get().removeItem(id, second.id)
    expect(get().docs[0].items).toHaveLength(1)
  })

  it('converts a quote into a linked draft invoice only once', () => {
    const q = get().createDoc('quote')
    const inv = get().convertQuote(q)!
    const quote = get().docs.find((d) => d.id === q)!
    const invoice = get().docs.find((d) => d.id === inv)!
    expect(quote).toMatchObject({ status: 'accepted', convertedInvoiceId: inv })
    expect(invoice).toMatchObject({ kind: 'invoice', status: 'draft', fromQuoteId: q, number: 'INV-0001' })
    expect(get().convertQuote(q)).toBe(inv)
    expect(get().docs.filter((d) => d.kind === 'invoice')).toHaveLength(1)
  })

  it('duplicates as a fresh draft with new ids', () => {
    const id = get().createDoc('invoice')
    get().setStatus(id, 'paid')
    const copy = get().duplicateDoc(id)!
    const d = get().docs.find((x) => x.id === copy)!
    expect(d).toMatchObject({ status: 'draft', number: 'INV-0002', paidAt: undefined })
    expect(d.items[0].id).not.toBe(get().docs.find((x) => x.id === id)!.items[0].id)
  })

  it('unlinks documents when a client is deleted', () => {
    const cid = get().saveClient({ name: 'Acme', contact: '', email: '', phone: '', address: '' })
    get().createDoc('invoice', cid)
    get().deleteClient(cid)
    expect(get().clients).toHaveLength(0)
    expect(get().docs[0].clientId).toBeNull()
  })
})
