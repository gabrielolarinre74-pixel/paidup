export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'SGD', 'AED', 'INR', 'ZAR'] as const

/** Rounds to cents without floating point drift (1.005 -> 1.01). */
export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const cache = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number, currency = 'USD', opts: { compact?: boolean } = {}) {
  const key = `${currency}-${opts.compact ? 'c' : 'f'}`
  let f = cache.get(key)
  if (!f) {
    try {
      f = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: opts.compact ? 0 : 2,
        minimumFractionDigits: opts.compact ? 0 : 2,
      })
    } catch {
      f = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
    }
    cache.set(key, f)
  }
  return f.format(round2(amount))
}

/** Parses user input like "1,250.50" or "$90" into a number; returns 0 for junk. */
export function parseAmount(input: string | number) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0
  const n = parseFloat(input.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}
