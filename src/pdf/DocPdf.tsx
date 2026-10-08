import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import regular from '@fontsource/manrope/files/manrope-latin-400-normal.woff?url'
import bold from '@fontsource/manrope/files/manrope-latin-700-normal.woff?url'
import extra from '@fontsource/manrope/files/manrope-latin-800-normal.woff?url'
import { formatDate } from '@/lib/dates'
import { kindLabel, lineTotal, totals } from '@/lib/documents'
import { formatMoney } from '@/lib/money'
import type { Business, Client, Doc } from '@/lib/types'

// Fonts are bundled with the app, so PDFs render offline and look identical everywhere.
Font.register({
  family: 'Manrope',
  fonts: [
    { src: regular, fontWeight: 400 },
    { src: bold, fontWeight: 700 },
    { src: extra, fontWeight: 800 },
  ],
})
Font.registerHyphenationCallback((word) => [word])

const ink = '#0A0A0A'
const grey = '#6B6B6B'
const light = '#A3A3A3'

const s = StyleSheet.create({
  page: { fontFamily: 'Manrope', fontSize: 9.5, color: ink, padding: 40, paddingTop: 46, lineHeight: 1.45 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#FACC15' },
  row: { flexDirection: 'row' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 7.5, fontWeight: 700, color: light, textTransform: 'uppercase', letterSpacing: 0.8 },
  muted: { color: grey },
  title: { fontSize: 24, fontWeight: 800, textTransform: 'uppercase', textAlign: 'right', lineHeight: 1.1, marginBottom: 4 },
  amountBox: { backgroundColor: '#FEF9C3', borderRadius: 6, padding: 10, width: 150, textAlign: 'right' },
  th: { fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, paddingVertical: 6 },
  td: { paddingVertical: 6 },
  footer: { position: 'absolute', left: 40, right: 40, bottom: 36, borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingTop: 10, flexDirection: 'row', gap: 24, color: grey },
})

export function DocPdf({ doc, client, business }: { doc: Doc; client?: Client; business: Business }) {
  const t = totals(doc)
  const money = (n: number) => formatMoney(n, doc.currency)
  const items = doc.items.filter((i) => i.description.trim() || i.rate)
  return (
    <Document title={`${kindLabel(doc.kind)} ${doc.number}`} author={business.name} creator='PaidUp' producer='PaidUp'>
      <Page size='A4' style={s.page}>
        <View style={s.bar} fixed />
        <View style={s.between}>
          <View style={{ maxWidth: 260 }}>
            {business.logo ? (
              <Image src={business.logo} style={{ width: Math.min(business.logoWidth, 180), maxHeight: 60, objectFit: 'contain', marginBottom: 8 }} />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{business.name || 'Your business'}</Text>
            )}
            <Text style={s.muted}>
              {[business.logo ? business.name : '', business.address, business.email, business.phone].filter(Boolean).join('\n')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.title}>{kindLabel(doc.kind)}</Text>
            <Text style={[s.muted, { textAlign: 'right', fontWeight: 700 }]}>{doc.number}</Text>
          </View>
        </View>

        <View style={[s.between, { marginTop: 36 }]}>
          <View style={{ width: 170 }}>
            <Text style={s.label}>Bill to</Text>
            <Text style={{ fontWeight: 700, marginTop: 3 }}>{client?.name || '-'}</Text>
            <Text style={s.muted}>{[client?.contact, client?.address, client?.email].filter(Boolean).join('\n')}</Text>
          </View>
          <View style={{ width: 120 }}>
            <Text style={s.label}>Issued</Text>
            <Text style={{ fontWeight: 700, marginTop: 3 }}>{formatDate(doc.issueDate)}</Text>
            <Text style={[s.label, { marginTop: 8 }]}>{doc.kind === 'quote' ? 'Valid until' : 'Due'}</Text>
            <Text style={{ fontWeight: 700, marginTop: 3 }}>{formatDate(doc.dueDate)}</Text>
          </View>
          <View style={s.amountBox}>
            <Text style={[s.label, { color: grey }]}>{doc.kind === 'quote' ? 'Quote total' : 'Amount due'}</Text>
            <Text style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{money(t.total)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <View style={[s.row, { borderBottomWidth: 1.5, borderBottomColor: ink }]} fixed>
            <Text style={[s.th, { flex: 1 }]}>Description</Text>
            <Text style={[s.th, { width: 40, textAlign: 'right' }]}>Qty</Text>
            <Text style={[s.th, { width: 80, textAlign: 'right' }]}>Rate</Text>
            <Text style={[s.th, { width: 90, textAlign: 'right' }]}>Amount</Text>
          </View>
          {items.map((i) => (
            <View key={i.id} style={[s.row, { borderBottomWidth: 0.6, borderBottomColor: '#E5E5E5' }]} wrap={false}>
              <Text style={[s.td, { flex: 1, paddingRight: 8 }]}>{i.description || '-'}</Text>
              <Text style={[s.td, { width: 40, textAlign: 'right' }]}>{i.quantity}</Text>
              <Text style={[s.td, { width: 80, textAlign: 'right' }]}>{money(i.rate)}</Text>
              <Text style={[s.td, { width: 90, textAlign: 'right', fontWeight: 700 }]}>{money(lineTotal(i))}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginLeft: 'auto', width: 220, marginTop: 12 }} wrap={false}>
          <View style={[s.between, s.muted]}>
            <Text>Subtotal</Text>
            <Text>{money(t.subtotal)}</Text>
          </View>
          {t.discount > 0 && (
            <View style={[s.between, s.muted, { marginTop: 3 }]}>
              <Text>{doc.discount.type === 'percent' ? `Discount (${doc.discount.value}%)` : 'Discount'}</Text>
              <Text>-{money(t.discount)}</Text>
            </View>
          )}
          {doc.taxRate > 0 && (
            <View style={[s.between, s.muted, { marginTop: 3 }]}>
              <Text>{`${business.taxLabel || 'Tax'} (${doc.taxRate}%)`}</Text>
              <Text>{money(t.tax)}</Text>
            </View>
          )}
          <View style={[s.between, { borderTopWidth: 1.5, borderTopColor: ink, marginTop: 6, paddingTop: 6 }]}>
            <Text style={{ fontWeight: 800, fontSize: 11 }}>Total</Text>
            <Text style={{ fontWeight: 800, fontSize: 11 }}>{money(t.total)}</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <View style={{ flex: 1 }}>
            {doc.kind === 'invoice' && business.paymentDetails ? (
              <>
                <Text style={s.label}>How to pay</Text>
                <Text style={{ marginTop: 3 }}>{business.paymentDetails}</Text>
              </>
            ) : null}
            {doc.notes ? <Text style={{ marginTop: 6 }}>{doc.notes}</Text> : null}
          </View>
          {doc.terms ? (
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Terms</Text>
              <Text style={{ marginTop: 3 }}>{doc.terms}</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  )
}
