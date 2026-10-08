import { round2 } from './money'
import { daysBetween } from './dates'
import type { Client, DisplayStatus, Doc, DocKind, LineItem } from './types'

export function lineTotal(item: Pick<LineItem, 'quantity' | 'rate'>) {
  return round2((item.quantity || 0) * (item.rate || 0))
}

/**
 * Subtotal -> discount -> tax on the discounted amount -> total.
 * Discounts are capped so a document can never go below zero.
 */
export function totals(doc: Pick<Doc, 'items' | 'taxRate' | 'discount'>) {
  const subtotal = round2(doc.items.reduce((s, i) => s + lineTotal(i), 0))
  const rawDiscount =
    doc.discount.type === 'percent'
      ? (subtotal * Math.min(Math.max(doc.discount.value, 0), 100)) / 100
      : Math.max(doc.discount.value, 0)
  const discount = round2(Math.min(rawDiscount, subtotal))
  const taxable = round2(subtotal - discount)
  const tax = round2((taxable * Math.max(doc.taxRate, 0)) / 100)
  return { subtotal, discount, taxable, tax, total: round2(taxable + tax) }
}

export function displayStatus(doc: Pick<Doc, 'kind' | 'status' | 'dueDate'>, todayISO: string): DisplayStatus {
  if (doc.kind === 'invoice' && doc.status === 'sent' && doc.dueDate && daysBetween(doc.dueDate, todayISO) > 0) {
    return 'overdue'
  }
  return doc.status
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  overdue: 'Overdue',
  paid: 'Paid',
  accepted: 'Accepted',
  declined: 'Declined',
}

/** Next number for a prefix, e.g. INV-0007 after INV-0006. Ignores other prefixes. */
export function nextNumber(docs: Pick<Doc, 'number'>[], prefix: string) {
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`)
  const max = docs.reduce((m, d) => {
    const hit = re.exec(d.number)
    return hit ? Math.max(m, Number(hit[1])) : m
  }, 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export function kindLabel(kind: DocKind) {
  return kind === 'invoice' ? 'Invoice' : 'Quote'
}

/** Money summary for the overview. Only invoices count towards money owed or received. */
export function summary(docs: Doc[], todayISO: string) {
  const month = todayISO.slice(0, 7)
  let outstanding = 0
  let overdue = 0
  let overdueCount = 0
  let paidThisMonth = 0
  let draftCount = 0
  let openQuotes = 0
  const payDays: number[] = []
  for (const d of docs) {
    const t = totals(d).total
    const s = displayStatus(d, todayISO)
    if (d.kind === 'quote') {
      if (s === 'sent') openQuotes += t
      continue
    }
    if (s === 'draft') draftCount++
    if (s === 'sent' || s === 'overdue') outstanding += t
    if (s === 'overdue') {
      overdue += t
      overdueCount++
    }
    if (s === 'paid' && d.paidAt) {
      if (d.paidAt.slice(0, 7) === month) paidThisMonth += t
      payDays.push(Math.max(0, daysBetween(d.issueDate, d.paidAt.slice(0, 10))))
    }
  }
  const avgDaysToPay = payDays.length ? Math.round(payDays.reduce((a, b) => a + b, 0) / payDays.length) : null
  return {
    outstanding: round2(outstanding),
    overdue: round2(overdue),
    overdueCount,
    paidThisMonth: round2(paidThisMonth),
    draftCount,
    openQuotes: round2(openQuotes),
    avgDaysToPay,
  }
}

/** Paid invoice totals per month for the last `months` months, oldest first. */
export function paidByMonth(docs: Doc[], todayISO: string, months = 6) {
  const [y, m] = todayISO.split('-').map(Number)
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(y, m - 1 - (months - 1 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { key, label: d.toLocaleDateString('en-US', { month: 'short' }), total: 0 }
  })
  const index = new Map(buckets.map((b, i) => [b.key, i]))
  for (const d of docs) {
    if (d.kind !== 'invoice' || d.status !== 'paid' || !d.paidAt) continue
    const i = index.get(d.paidAt.slice(0, 7))
    if (i !== undefined) buckets[i].total = round2(buckets[i].total + totals(d).total)
  }
  return buckets
}

export function clientStats(client: Client, docs: Doc[], todayISO: string) {
  let billed = 0
  let owed = 0
  let count = 0
  for (const d of docs) {
    if (d.kind !== 'invoice' || d.clientId !== client.id) continue
    count++
    const t = totals(d).total
    const s = displayStatus(d, todayISO)
    if (s === 'paid') billed += t
    if (s === 'sent' || s === 'overdue') owed += t
  }
  return { paid: round2(billed), owed: round2(owed), invoices: count }
}
