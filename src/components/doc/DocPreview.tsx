import { formatDate } from '@/lib/dates'
import { kindLabel, lineTotal, totals } from '@/lib/documents'
import { formatMoney } from '@/lib/money'
import type { Business, Client, Doc } from '@/lib/types'

/** On-screen paper preview. Mirrors the PDF layout so what you see is what the client gets. */
export function DocPreview({ doc, client, business }: { doc: Doc; client?: Client; business: Business }) {
  const t = totals(doc)
  const money = (n: number) => formatMoney(n, doc.currency)
  const items = doc.items.filter((i) => i.description.trim() || i.rate)
  return (
    <article
      aria-label={`${kindLabel(doc.kind)} preview`}
      className='relative mx-auto aspect-[1/1.414] w-full max-w-[720px] overflow-hidden rounded-xl bg-white p-[6%] text-[11px] leading-relaxed text-neutral-900 shadow-pop ring-1 ring-black/5 sm:text-[12px]'
    >
      <div className='absolute inset-x-0 top-0 h-1.5 bg-[#FACC15]' />
      <header className='flex items-start justify-between gap-6'>
        <div>
          {business.logo ? (
            <img src={business.logo} alt={`${business.name} logo`} style={{ width: business.logoWidth }} className='mb-3 max-h-16 object-contain object-left' />
          ) : (
            <p className='mb-1 text-[15px] font-extrabold tracking-tight'>{business.name || 'Your business'}</p>
          )}
          <p className='whitespace-pre-line text-neutral-500'>
            {[business.logo ? business.name : '', business.address, business.email, business.phone].filter(Boolean).join('\n')}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-[22px] font-extrabold tracking-tight uppercase sm:text-[26px]'>{kindLabel(doc.kind)}</p>
          <p className='font-semibold text-neutral-500'>{doc.number}</p>
        </div>
      </header>

      <section className='mt-[7%] grid grid-cols-3 gap-4'>
        <div>
          <p className='text-[10px] font-bold tracking-wider text-neutral-400 uppercase'>Bill to</p>
          <p className='mt-1 font-bold'>{client?.name || 'Choose a client'}</p>
          <p className='whitespace-pre-line text-neutral-500'>{[client?.contact, client?.address, client?.email].filter(Boolean).join('\n')}</p>
        </div>
        <div>
          <p className='text-[10px] font-bold tracking-wider text-neutral-400 uppercase'>Issued</p>
          <p className='mt-1 font-semibold'>{formatDate(doc.issueDate)}</p>
          <p className='mt-2 text-[10px] font-bold tracking-wider text-neutral-400 uppercase'>{doc.kind === 'quote' ? 'Valid until' : 'Due'}</p>
          <p className='mt-1 font-semibold'>{formatDate(doc.dueDate)}</p>
        </div>
        <div className='rounded-lg bg-[#FEF9C3] p-3 text-right'>
          <p className='text-[10px] font-bold tracking-wider text-neutral-500 uppercase'>{doc.kind === 'quote' ? 'Quote total' : 'Amount due'}</p>
          <p className='mt-1 text-[17px] font-extrabold tracking-tight sm:text-[20px]'>{money(t.total)}</p>
        </div>
      </section>

      <table className='mt-[6%] w-full'>
        <thead>
          <tr className='border-b-2 border-neutral-900 text-left text-[10px] font-bold tracking-wider uppercase'>
            <th className='py-2'>Description</th>
            <th className='w-12 py-2 text-right'>Qty</th>
            <th className='w-20 py-2 text-right'>Rate</th>
            <th className='w-24 py-2 text-right'>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className='py-4 text-center text-neutral-400'>
                Add a line item to get started
              </td>
            </tr>
          )}
          {items.map((i) => (
            <tr key={i.id} className='border-b border-neutral-200'>
              <td className='py-2 pr-3'>{i.description || '—'}</td>
              <td className='py-2 text-right tabular-nums'>{i.quantity}</td>
              <td className='py-2 text-right tabular-nums'>{money(i.rate)}</td>
              <td className='py-2 text-right font-semibold tabular-nums'>{money(lineTotal(i))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className='mt-4 ml-auto w-1/2 space-y-1.5'>
        <Row label='Subtotal' value={money(t.subtotal)} />
        {t.discount > 0 && (
          <Row label={doc.discount.type === 'percent' ? `Discount (${doc.discount.value}%)` : 'Discount'} value={`−${money(t.discount)}`} />
        )}
        {doc.taxRate > 0 && <Row label={`${business.taxLabel || 'Tax'} (${doc.taxRate}%)`} value={money(t.tax)} />}
        <div className='flex justify-between border-t-2 border-neutral-900 pt-2 text-[13px] font-extrabold'>
          <span>Total</span>
          <span className='tabular-nums'>{money(t.total)}</span>
        </div>
      </section>

      <footer className='absolute inset-x-[6%] bottom-[5%] grid grid-cols-2 gap-6 border-t border-neutral-200 pt-4 text-neutral-600'>
        <div>
          {business.paymentDetails && doc.kind === 'invoice' && (
            <>
              <p className='text-[10px] font-bold tracking-wider text-neutral-400 uppercase'>How to pay</p>
              <p className='mt-1 whitespace-pre-line'>{business.paymentDetails}</p>
            </>
          )}
          {doc.notes && <p className='mt-2 whitespace-pre-line'>{doc.notes}</p>}
        </div>
        {doc.terms && (
          <div>
            <p className='text-[10px] font-bold tracking-wider text-neutral-400 uppercase'>Terms</p>
            <p className='mt-1 whitespace-pre-line'>{doc.terms}</p>
          </div>
        )}
      </footer>
    </article>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex justify-between text-neutral-600'>
      <span>{label}</span>
      <span className='tabular-nums'>{value}</span>
    </div>
  )
}
