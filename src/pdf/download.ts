import { createElement } from 'react'
import { download } from '@/lib/csv'
import type { Business, Client, Doc } from '@/lib/types'

/** Loads the PDF renderer on demand (it is large) and downloads the document. */
export async function downloadPdf(doc: Doc, client: Client | undefined, business: Business) {
  const [{ pdf }, { DocPdf }] = await Promise.all([import('@react-pdf/renderer'), import('./DocPdf')])
  const blob = await pdf(createElement(DocPdf, { doc, client, business }) as never).toBlob()
  const who = client?.name ? `-${client.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}` : ''
  download(`${doc.number}${who}.pdf`, blob)
}
