import { addDays, today } from '@/lib/dates'
import type { Business, Client, Doc, LineItem } from '@/lib/types'

/** Fictional demo data. Dates are generated relative to today so the demo always looks current. */
export const sampleBusiness: Business = {
  name: 'Brightline Studio',
  owner: 'Sam Rivera',
  email: 'hello@brightline.example',
  phone: '+1 555 0142',
  address: '24 Market Street\nSuite 5',
  website: 'brightline.example',
  logo: '',
  logoWidth: 120,
  paymentDetails: 'Bank transfer\nAccount name: Brightline Studio\nAccount no: 0000 0000 0000',
  taxLabel: 'Sales tax',
  defaultTaxRate: 7.5,
  currency: 'USD',
  invoicePrefix: 'INV-',
  quotePrefix: 'QTE-',
  paymentTermsDays: 14,
  quoteValidDays: 30,
  defaultNotes: 'Thank you for your business.',
  defaultTerms: 'Payment due within 14 days. A 2% late fee may apply after the due date.',
}

const c = (id: string, name: string, contact: string, email: string, phone: string, address: string): Client => ({
  id,
  name,
  contact,
  email,
  phone,
  address,
  createdAt: '2026-01-05T09:00:00.000Z',
})

export const sampleClients: Client[] = [
  c('c-harbor', 'Harbor & Pine Coffee', 'Maya Chen', 'maya@harborpine.example', '+1 555 0101', '8 Harbor Road'),
  c('c-kettle', 'Kettle Bakery', 'Leo Martins', 'leo@kettle.example', '+1 555 0102', '19 Baker Lane'),
  c('c-atlas', 'Atlas Fitness Club', 'Priya Nair', 'priya@atlasfit.example', '+1 555 0103', '400 Ridge Avenue'),
  c('c-lumen', 'Lumen Dental', 'Dr. Owen Hart', 'owen@lumendental.example', '+1 555 0104', '77 Clinic Way'),
  c('c-fieldnote', 'Fieldnote Books', 'Ines Duarte', 'ines@fieldnote.example', '+1 555 0105', '3 Library Square'),
]

let n = 0
const item = (description: string, quantity: number, rate: number): LineItem => ({
  id: `li-${++n}`,
  description,
  quantity,
  rate,
})

type Seed = {
  kind: Doc['kind']
  clientId: string
  issuedAgo: number
  status: Doc['status']
  paidAfter?: number
  items: LineItem[]
  discount?: Doc['discount']
}

const seeds: Seed[] = [
  { kind: 'invoice', clientId: 'c-harbor', issuedAgo: 160, status: 'paid', paidAfter: 9, items: [item('Brand identity: logo, palette and type', 1, 1800), item('Menu board design', 3, 120)] },
  { kind: 'invoice', clientId: 'c-kettle', issuedAgo: 130, status: 'paid', paidAfter: 12, items: [item('Website design and build (5 pages)', 1, 2400)] },
  { kind: 'invoice', clientId: 'c-atlas', issuedAgo: 104, status: 'paid', paidAfter: 6, items: [item('Membership landing page', 1, 950), item('Photo retouching', 12, 15)] },
  { kind: 'invoice', clientId: 'c-lumen', issuedAgo: 75, status: 'paid', paidAfter: 18, items: [item('Online booking setup', 1, 650), item('Staff training session (hours)', 2, 90)] },
  { kind: 'invoice', clientId: 'c-harbor', issuedAgo: 48, status: 'paid', paidAfter: 5, items: [item('Social media management (monthly)', 1, 700), item('Short-form video edits', 4, 85)] },
  { kind: 'invoice', clientId: 'c-fieldnote', issuedAgo: 30, status: 'paid', paidAfter: 10, items: [item('E-commerce product pages', 20, 35), item('Payment and shipping setup', 1, 400)], discount: { type: 'percent', value: 10 } },
  { kind: 'invoice', clientId: 'c-kettle', issuedAgo: 12, status: 'paid', paidAfter: 4, items: [item('Website care plan (monthly)', 1, 180)] },
  { kind: 'invoice', clientId: 'c-atlas', issuedAgo: 34, status: 'sent', items: [item('Class schedule app screens', 6, 140), item('Usability review', 1, 300)] },
  { kind: 'invoice', clientId: 'c-lumen', issuedAgo: 22, status: 'sent', items: [item('Google Business profile optimisation', 1, 350), item('Review request automation', 1, 420)] },
  { kind: 'invoice', clientId: 'c-harbor', issuedAgo: 6, status: 'sent', items: [item('Social media management (monthly)', 1, 700)] },
  { kind: 'invoice', clientId: 'c-fieldnote', issuedAgo: 3, status: 'sent', items: [item('Newsletter template', 1, 480), item('Mailing list migration', 1, 220)] },
  { kind: 'invoice', clientId: 'c-kettle', issuedAgo: 1, status: 'draft', items: [item('Seasonal promo landing page', 1, 600), item('Product photography (half day)', 1, 450)] },
  { kind: 'quote', clientId: 'c-lumen', issuedAgo: 8, status: 'sent', items: [item('Patient portal redesign', 1, 3200), item('Accessibility audit', 1, 600)] },
  { kind: 'quote', clientId: 'c-atlas', issuedAgo: 20, status: 'accepted', items: [item('Referral programme setup', 1, 900)] },
]

export function sampleDocs(todayISO = today(), business = sampleBusiness): Doc[] {
  const counters = { invoice: 0, quote: 0 }
  return seeds.map((s, i) => {
    const issueDate = addDays(todayISO, -s.issuedAgo)
    const num = ++counters[s.kind]
    const prefix = s.kind === 'invoice' ? business.invoicePrefix : business.quotePrefix
    const stamp = `${issueDate}T10:00:00.000Z`
    return {
      id: `d-${i + 1}`,
      kind: s.kind,
      number: `${prefix}${String(num).padStart(4, '0')}`,
      status: s.status,
      clientId: s.clientId,
      issueDate,
      dueDate: addDays(issueDate, s.kind === 'invoice' ? business.paymentTermsDays : business.quoteValidDays),
      currency: business.currency,
      items: s.items.map((it) => ({ ...it, id: `${it.id}-${i}` })),
      taxRate: business.defaultTaxRate,
      discount: s.discount ?? { type: 'percent', value: 0 },
      notes: business.defaultNotes,
      terms: s.kind === 'invoice' ? business.defaultTerms : 'This quote is valid for 30 days.',
      sentAt: s.status !== 'draft' ? stamp : undefined,
      paidAt: s.paidAfter !== undefined ? `${addDays(issueDate, s.paidAfter)}T12:00:00.000Z` : undefined,
      createdAt: stamp,
      updatedAt: stamp,
    }
  })
}
