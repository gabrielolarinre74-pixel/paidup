export type DocKind = 'invoice' | 'quote'

/** Stored status. "overdue" is never stored: it is derived from the due date. */
export type StoredStatus = 'draft' | 'sent' | 'paid' | 'accepted' | 'declined'
export type DisplayStatus = StoredStatus | 'overdue'

export type LineItem = {
  id: string
  description: string
  quantity: number
  rate: number
}

export type Discount = { type: 'percent' | 'amount'; value: number }

export type Doc = {
  id: string
  kind: DocKind
  number: string
  status: StoredStatus
  clientId: string | null
  issueDate: string // yyyy-mm-dd
  dueDate: string // yyyy-mm-dd (valid-until date for quotes)
  currency: string
  items: LineItem[]
  taxRate: number // percent
  discount: Discount
  notes: string
  terms: string
  sentAt?: string
  paidAt?: string
  /** For invoices created from a quote */
  fromQuoteId?: string
  convertedInvoiceId?: string
  createdAt: string
  updatedAt: string
}

export type Client = {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export type Business = {
  name: string
  owner: string
  email: string
  phone: string
  address: string
  website: string
  logo: string // data URL
  logoWidth: number
  paymentDetails: string
  taxLabel: string
  defaultTaxRate: number
  currency: string
  invoicePrefix: string
  quotePrefix: string
  paymentTermsDays: number
  quoteValidDays: number
  defaultNotes: string
  defaultTerms: string
}
