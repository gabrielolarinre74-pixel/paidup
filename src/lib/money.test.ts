import { describe, expect, it } from 'vitest'
import { formatMoney, parseAmount, round2 } from './money'
import { addDays, daysBetween, toISODate } from './dates'
import { documentsCsv, toCsv } from './csv'

describe('money', () => {
  it('formats currencies and survives unknown codes', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50')
    expect(formatMoney(1234.5, 'EUR')).toBe('€1,234.50')
    expect(formatMoney(1234.4, 'USD', { compact: true })).toBe('$1,234')
    expect(formatMoney(10, 'NOPE!')).toBe('10.00')
  })
  it('parses loose user input', () => {
    expect(parseAmount('$1,250.50')).toBe(1250.5)
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount(Number.NaN)).toBe(0)
    expect(round2(2.675)).toBe(2.68)
  })
})

describe('dates', () => {
  it('adds days across month ends and counts whole days', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(daysBetween('2026-03-01', '2026-03-31')).toBe(30)
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('csv', () => {
  it('escapes commas, quotes and formula injection', () => {
    expect(toCsv([{ a: 'x,y', b: 'say "hi"', c: '=SUM(A1)' }])).toBe('a,b,c\n"x,y","say ""hi""",\'=SUM(A1)')
  })
  it('exports documents with client names and totals', () => {
    const csv = documentsCsv(
      [{
        id: 'd', kind: 'invoice', number: 'INV-1', status: 'paid', clientId: 'c', issueDate: '2026-01-01',
        dueDate: '2026-01-15', currency: 'USD', items: [{ id: 'i', description: '', quantity: 2, rate: 50 }],
        taxRate: 10, discount: { type: 'amount', value: 0 }, notes: '', terms: '', paidAt: '2026-01-10T00:00:00Z',
        createdAt: '', updatedAt: '',
      }],
      [{ id: 'c', name: 'Acme', contact: '', email: '', phone: '', address: '', createdAt: '' }],
      '2026-02-01'
    )
    expect(csv.split('\n')[1]).toBe('Invoice,INV-1,Acme,Paid,2026-01-01,2026-01-15,USD,100.00,0.00,10.00,110.00,2026-01-10')
  })
})
