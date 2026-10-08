import { totals, displayStatus, STATUS_LABEL, kindLabel } from './documents'
import type { Client, Doc } from './types'

function escape(v: unknown) {
  const s = v === undefined || v === null ? '' : String(v)
  // Neutralise spreadsheet formula injection
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  return [cols.join(','), ...rows.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\n')
}

export function documentsCsv(docs: Doc[], clients: Client[], todayISO: string) {
  const byId = new Map(clients.map((c) => [c.id, c]))
  return toCsv(
    docs.map((d) => {
      const t = totals(d)
      return {
        type: kindLabel(d.kind),
        number: d.number,
        client: d.clientId ? (byId.get(d.clientId)?.name ?? '') : '',
        status: STATUS_LABEL[displayStatus(d, todayISO)],
        issue_date: d.issueDate,
        due_date: d.dueDate,
        currency: d.currency,
        subtotal: t.subtotal.toFixed(2),
        discount: t.discount.toFixed(2),
        tax: t.tax.toFixed(2),
        total: t.total.toFixed(2),
        paid_on: d.paidAt?.slice(0, 10) ?? '',
      }
    })
  )
}

export function download(filename: string, content: string | Blob, type = 'text/csv;charset=utf-8') {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
