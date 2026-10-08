import { describe, expect, it } from 'vitest'
import { sampleBusiness, sampleClients, sampleDocs } from '@/store/sample'
import { makeBackup, parseBackup } from './backup'

describe('backup', () => {
  it('round-trips the sample workspace', () => {
    const data = { business: sampleBusiness, clients: sampleClients, docs: sampleDocs('2026-10-08') }
    const parsed = parseBackup(JSON.stringify(makeBackup(data)))
    expect(parsed.docs).toEqual(data.docs)
    expect(parsed.clients).toHaveLength(5)
  })

  it('rejects junk, other apps and remote logo URLs', () => {
    expect(() => parseBackup('nope')).toThrow(/not valid JSON/)
    expect(() => parseBackup('{"app":"other"}')).toThrow(/not a PaidUp backup/)
    const bad = makeBackup({ business: { ...sampleBusiness, logo: 'https://evil.example/x.png' }, clients: [], docs: [] })
    expect(() => parseBackup(JSON.stringify(bad))).toThrow()
  })
})
