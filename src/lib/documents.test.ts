import { describe, expect, it } from 'vitest'
import { clientStats, displayStatus, lineTotal, nextNumber, paidByMonth, summary, totals } from './documents'
import type { Doc } from './types'

const doc = (over: Partial<Doc> = {}): Doc => ({
  id: 'd1',
  kind: 'invoice',
  number: 'INV-0001',
  status: 'sent',
  clientId: 'c1',
  issueDate: '2026-09-01',
  dueDate: '2026-09-15',
  currency: 'USD',
  items: [{ id: 'a', description: 'Design', quantity: 2, rate: 100 }],
  taxRate: 10,
  discount: { type: 'percent', value: 0 },
  notes: '',
  terms: '',
  createdAt: '',
  updatedAt: '',
  ...over,
})

describe('totals', () => {
  it('applies the discount before tax', () => {
    expect(totals(doc({ discount: { type: 'percent', value: 25 } }))).toEqual({
      subtotal: 200,
      discount: 50,
      taxable: 150,
      tax: 15,
      total: 165,
    })
  })

  it('caps fixed discounts at the subtotal and ignores negative values', () => {
    expect(totals(doc({ discount: { type: 'amount', value: 999 } })).total).toBe(0)
    expect(totals(doc({ discount: { type: 'amount', value: -5 }, taxRate: -3 })).total).toBe(200)
  })

  it('rounds money to cents without float drift', () => {
    expect(lineTotal({ quantity: 3, rate: 0.1 })).toBe(0.3)
    expect(totals(doc({ items: [{ id: 'x', description: '', quantity: 1, rate: 1.005 }], taxRate: 0 })).total).toBe(1.01)
  })
})

describe('displayStatus', () => {
  it('derives overdue only for sent invoices past their due date', () => {
    expect(displayStatus(doc(), '2026-09-15')).toBe('sent')
    expect(displayStatus(doc(), '2026-09-16')).toBe('overdue')
    expect(displayStatus(doc({ status: 'paid' }), '2026-12-01')).toBe('paid')
    expect(displayStatus(doc({ kind: 'quote' }), '2026-12-01')).toBe('sent')
  })
})

describe('nextNumber', () => {
  it('continues the highest number for the same prefix only', () => {
    const docs = [{ number: 'INV-0009' }, { number: 'INV-0011' }, { number: 'QTE-0050' }, { number: 'custom' }]
    expect(nextNumber(docs, 'INV-')).toBe('INV-0012')
    expect(nextNumber(docs, 'QTE-')).toBe('QTE-0051')
    expect(nextNumber([], 'A.')).toBe('A.0001')
  })
})

describe('summary', () => {
  it('splits outstanding, overdue and paid this month; quotes never count as owed', () => {
    const docs = [
      doc({ id: '1' }), // 220 overdue on Oct 8
      doc({ id: '2', dueDate: '2026-10-30' }), // 220 outstanding
      doc({ id: '3', status: 'paid', paidAt: '2026-10-02T10:00:00Z', issueDate: '2026-09-22' }), // paid this month
      doc({ id: '4', status: 'paid', paidAt: '2026-09-10T10:00:00Z' }), // paid last month
      doc({ id: '5', status: 'draft' }),
      doc({ id: '6', kind: 'quote' }),
    ]
    expect(summary(docs, '2026-10-08')).toEqual({
      outstanding: 440,
      overdue: 220,
      overdueCount: 1,
      paidThisMonth: 220,
      draftCount: 1,
      openQuotes: 220,
      avgDaysToPay: 10, // (10 + 9) / 2 rounded
    })
  })

  it('returns null average when nothing has been paid', () => {
    expect(summary([doc()], '2026-09-01').avgDaysToPay).toBeNull()
  })
})

describe('paidByMonth and clientStats', () => {
  it('buckets paid invoices into the last N months', () => {
    const buckets = paidByMonth(
      [doc({ status: 'paid', paidAt: '2026-10-01T00:00:00Z' }), doc({ status: 'paid', paidAt: '2026-04-01T00:00:00Z' })],
      '2026-10-08',
      3
    )
    expect(buckets.map((b) => [b.key, b.total])).toEqual([
      ['2026-08', 0],
      ['2026-09', 0],
      ['2026-10', 220],
    ])
  })

  it('totals paid and owed per client', () => {
    const client = { id: 'c1', name: '', contact: '', email: '', phone: '', address: '', createdAt: '' }
    const s = clientStats(client, [doc(), doc({ status: 'paid' }), doc({ clientId: 'other' })], '2026-09-01')
    expect(s).toEqual({ paid: 220, owed: 220, invoices: 2 })
  })
})
