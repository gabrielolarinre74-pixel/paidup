import { formatDate, daysBetween } from './dates'
import { totals, displayStatus, kindLabel } from './documents'
import { formatMoney } from './money'
import type { Business, Client, Doc } from './types'

/**
 * Plain-text message for a document: a polite send note, a gentle reminder before
 * the due date, or a firmer follow-up once it is overdue.
 */
export function reminderMessage(doc: Doc, client: Client | undefined, business: Business, todayISO: string) {
  const name = client?.contact?.split(' ')[0] || client?.name || 'there'
  const amount = formatMoney(totals(doc).total, doc.currency)
  const label = kindLabel(doc.kind).toLowerCase()
  const sign = business.owner || business.name || ''
  const status = displayStatus(doc, todayISO)
  const pay = business.paymentDetails ? `\n\nPayment details:\n${business.paymentDetails}` : ''

  if (doc.kind === 'quote') {
    return `Hi ${name},\n\nHere is quote ${doc.number} for ${amount}, valid until ${formatDate(doc.dueDate)}. Reply to this message to approve it and I'll get started.\n\nThanks,\n${sign}`.trim()
  }
  if (status === 'paid') {
    return `Hi ${name},\n\nThanks for paying invoice ${doc.number} (${amount}). It was a pleasure working with you.\n\n${sign}`.trim()
  }
  if (status === 'overdue') {
    const late = daysBetween(doc.dueDate, todayISO)
    return `Hi ${name},\n\nA quick follow-up: invoice ${doc.number} for ${amount} was due on ${formatDate(doc.dueDate)} (${late} day${late === 1 ? '' : 's'} ago). Could you let me know when payment is planned?${pay}\n\nThank you,\n${sign}`.trim()
  }
  if (status === 'sent') {
    const left = daysBetween(todayISO, doc.dueDate)
    const when = left <= 0 ? 'today' : `in ${left} day${left === 1 ? '' : 's'} (${formatDate(doc.dueDate)})`
    return `Hi ${name},\n\nFriendly reminder that invoice ${doc.number} for ${amount} is due ${when}.${pay}\n\nThanks,\n${sign}`.trim()
  }
  return `Hi ${name},\n\nPlease find ${label} ${doc.number} for ${amount}, due ${formatDate(doc.dueDate)}.${pay}\n\nThanks,\n${sign}`.trim()
}

/** wa.me link; strips everything but digits from the phone number. */
export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '')
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}

export function mailtoLink(email: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
