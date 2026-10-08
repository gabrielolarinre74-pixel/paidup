import { describe, expect, it } from 'vitest'
import { sampleBusiness } from '@/store/sample'
import { greetingName, mailtoLink, reminderMessage, whatsappLink } from './reminders'
import type { Client, Doc } from './types'

const client: Client = { id: 'c', name: 'Kettle Bakery', contact: 'Leo Martins', email: 'leo@x.example', phone: '+1 (555) 0102', address: '', createdAt: '' }
const doc: Doc = {
  id: 'd', kind: 'invoice', number: 'INV-0004', status: 'sent', clientId: 'c',
  issueDate: '2026-09-01', dueDate: '2026-09-15', currency: 'USD',
  items: [{ id: 'a', description: 'Site', quantity: 1, rate: 500 }], taxRate: 0,
  discount: { type: 'percent', value: 0 }, notes: '', terms: '', createdAt: '', updatedAt: '',
}

describe('reminderMessage', () => {
  it('uses a gentle tone before the due date', () => {
    const msg = reminderMessage(doc, client, sampleBusiness, '2026-09-12')
    expect(msg).toContain('Hi Leo')
    expect(msg).toContain('due in 3 days')
    expect(msg).toContain('$500.00')
    expect(msg).toContain('Payment details')
  })

  it('states how late an overdue invoice is', () => {
    expect(reminderMessage(doc, client, sampleBusiness, '2026-09-16')).toContain('(1 day ago)')
  })

  it('writes a thank-you for paid invoices and an approval note for quotes', () => {
    expect(reminderMessage({ ...doc, status: 'paid' }, client, sampleBusiness, '2026-09-16')).toMatch(/Thanks for paying/)
    expect(reminderMessage({ ...doc, kind: 'quote' }, client, sampleBusiness, '2026-09-16')).toMatch(/approve/)
  })

  it('falls back gracefully without a client', () => {
    expect(reminderMessage(doc, undefined, sampleBusiness, '2026-09-12')).toContain('Hi there')
  })
})

describe('links', () => {
  it('builds a wa.me link with digits only and encoded text', () => {
    expect(whatsappLink('+1 (555) 0102', 'Hi & bye')).toBe('https://wa.me/15550102?text=Hi%20%26%20bye')
  })
  it('builds a mailto link', () => {
    expect(mailtoLink('a@b.co', 'Invoice 1', 'x y')).toBe('mailto:a%40b.co?subject=Invoice%201&body=x%20y')
  })
})

describe('greetingName', () => {
  it('keeps titles with the surname and falls back to the company', () => {
    expect(greetingName({ contact: 'Dr. Owen Hart', name: 'Lumen' })).toBe('Dr. Hart')
    expect(greetingName({ contact: 'Maya Chen', name: 'Harbor' })).toBe('Maya')
    expect(greetingName({ contact: '', name: 'Harbor' })).toBe('Harbor')
    expect(greetingName(undefined)).toBe('there')
  })
})
