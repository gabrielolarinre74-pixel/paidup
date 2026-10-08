import { z } from 'zod'

const item = z.object({ id: z.string(), description: z.string(), quantity: z.number(), rate: z.number() })
const doc = z.object({
  id: z.string(),
  kind: z.enum(['invoice', 'quote']),
  number: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'accepted', 'declined']),
  clientId: z.string().nullable(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().min(3).max(3),
  items: z.array(item),
  taxRate: z.number().min(0).max(100),
  discount: z.object({ type: z.enum(['percent', 'amount']), value: z.number().min(0) }),
  notes: z.string(),
  terms: z.string(),
  sentAt: z.string().optional(),
  paidAt: z.string().optional(),
  fromQuoteId: z.string().optional(),
  convertedInvoiceId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
const client = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  createdAt: z.string(),
})
const business = z.object({
  name: z.string(),
  owner: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  website: z.string(),
  logo: z.string().refine((v) => v === '' || v.startsWith('data:image/'), 'Logo must be an embedded image'),
  logoWidth: z.number(),
  paymentDetails: z.string(),
  taxLabel: z.string(),
  defaultTaxRate: z.number(),
  currency: z.string(),
  invoicePrefix: z.string(),
  quotePrefix: z.string(),
  paymentTermsDays: z.number(),
  quoteValidDays: z.number(),
  defaultNotes: z.string(),
  defaultTerms: z.string(),
})

export const backupSchema = z.object({
  app: z.literal('paidup'),
  version: z.literal(1),
  exportedAt: z.string(),
  business,
  clients: z.array(client),
  docs: z.array(doc),
})

export type Backup = z.infer<typeof backupSchema>

export function makeBackup(data: Pick<Backup, 'business' | 'clients' | 'docs'>): Backup {
  return { app: 'paidup', version: 1, exportedAt: new Date().toISOString(), ...data }
}

/** Validates a backup file. Throws a readable error for anything that is not a PaidUp backup. */
export function parseBackup(text: string): Backup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  const result = backupSchema.safeParse(json)
  if (!result.success) throw new Error('That file is not a PaidUp backup, or it is damaged.')
  return result.data
}
