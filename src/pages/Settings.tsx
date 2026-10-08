import { useRef } from 'react'
import { Download, ImagePlus, Monitor, Moon, RotateCcw, Sun, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { makeBackup, parseBackup } from '@/lib/backup'
import { documentsCsv, download } from '@/lib/csv'
import { today } from '@/lib/dates'
import { CURRENCIES, parseAmount } from '@/lib/money'
import { useTheme, type Theme } from '@/lib/theme'
import type { Business } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const MAX_LOGO_BYTES = 400 * 1024

export function Settings() {
  const business = useStore((s) => s.business)
  const updateBusiness = useStore((s) => s.updateBusiness)
  const { theme, setTheme } = useTheme()
  const logoInput = useRef<HTMLInputElement>(null)
  const restoreInput = useRef<HTMLInputElement>(null)

  const text = (k: keyof Business) => ({
    value: business[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => updateBusiness({ [k]: e.target.value }),
  })
  const num = (k: keyof Business, max: number) => ({
    value: business[k] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateBusiness({ [k]: Math.min(max, Math.max(0, parseAmount(e.target.value))) }),
  })

  const onLogo = (file?: File) => {
    if (!file) return
    if (!/^image\/(png|jpe?g|svg\+xml|webp)$/.test(file.type)) return toast.error('Use a PNG, JPG, SVG or WebP image')
    if (file.size > MAX_LOGO_BYTES) return toast.error('Keep the logo under 400 KB')
    const reader = new FileReader()
    reader.onload = () => {
      updateBusiness({ logo: String(reader.result) })
      toast.success('Logo updated')
    }
    reader.readAsDataURL(file)
  }

  const exportCsv = () => {
    const { docs, clients } = useStore.getState()
    download(`paidup-all-documents-${today()}.csv`, documentsCsv(docs, clients, today()))
    toast.success('CSV downloaded')
  }
  const backup = () => {
    const { business, clients, docs } = useStore.getState()
    download(`paidup-backup-${today()}.json`, JSON.stringify(makeBackup({ business, clients, docs }), null, 2), 'application/json')
    toast.success('Backup downloaded')
  }
  const restore = async (file?: File) => {
    if (!file) return
    try {
      const data = parseBackup(await file.text())
      if (!window.confirm(`Replace everything in PaidUp with this backup (${data.docs.length} documents, ${data.clients.length} clients)?`)) return
      useStore.getState().replaceAll(data)
      toast.success('Backup restored')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read that file')
    } finally {
      if (restoreInput.current) restoreInput.current.value = ''
    }
  }

  return (
    <>
      <PageHeader eyebrow='Workspace' title='Settings' description='Your details appear on every invoice and quote. Everything is saved as you type.' />
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='space-y-6'>
          <Card>
            <CardHeader title='Business profile' description='Shown in the header of your documents.' />
            <div className='grid gap-4 p-5 sm:grid-cols-2'>
              <Field label='Business name' htmlFor='b-name'>
                <Input id='b-name' {...text('name')} />
              </Field>
              <Field label='Your name' htmlFor='b-owner' hint='Used to sign reminders'>
                <Input id='b-owner' {...text('owner')} />
              </Field>
              <Field label='Email' htmlFor='b-email'>
                <Input id='b-email' type='email' {...text('email')} />
              </Field>
              <Field label='Phone' htmlFor='b-phone'>
                <Input id='b-phone' {...text('phone')} />
              </Field>
              <Field label='Address' htmlFor='b-address' className='sm:col-span-2'>
                <Textarea id='b-address' rows={2} {...text('address')} />
              </Field>
              <div className='sm:col-span-2'>
                <p className='mb-1.5 text-[13px] font-semibold'>Logo</p>
                <div className='flex flex-wrap items-center gap-4 rounded-xl border border-dashed p-4'>
                  <div className='flex h-16 w-40 items-center justify-center rounded-lg bg-white ring-1 ring-black/5'>
                    {business.logo ? (
                      <img src={business.logo} alt='Your logo' style={{ width: Math.min(business.logoWidth, 150) }} className='max-h-14 object-contain' />
                    ) : (
                      <span className='text-xs font-semibold text-neutral-400'>No logo</span>
                    )}
                  </div>
                  <input ref={logoInput} type='file' accept='image/png,image/jpeg,image/svg+xml,image/webp' className='hidden' onChange={(e) => onLogo(e.target.files?.[0])} />
                  <Button size='sm' onClick={() => logoInput.current?.click()}>
                    <ImagePlus /> {business.logo ? 'Replace' : 'Upload'}
                  </Button>
                  {business.logo && (
                    <>
                      <label className='flex items-center gap-2 text-xs font-semibold'>
                        Width
                        <input type='range' min={60} max={180} value={business.logoWidth} onChange={(e) => updateBusiness({ logoWidth: Number(e.target.value) })} className='accent-[#EAB308]' />
                      </label>
                      <Button size='sm' variant='ghost' onClick={() => updateBusiness({ logo: '' })}>
                        <Trash2 /> Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title='Getting paid' description='Defaults for new documents. Existing ones keep their own values.' />
            <div className='grid gap-4 p-5 sm:grid-cols-2'>
              <Field label='Payment details' htmlFor='b-pay' hint='Bank or payment link, printed on invoices and reminders' className='sm:col-span-2'>
                <Textarea id='b-pay' rows={3} {...text('paymentDetails')} />
              </Field>
              <Field label='Currency' htmlFor='b-currency'>
                <Select id='b-currency' {...text('currency')}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <div className='grid grid-cols-2 gap-3'>
                <Field label='Tax name' htmlFor='b-taxlabel'>
                  <Input id='b-taxlabel' {...text('taxLabel')} />
                </Field>
                <Field label='Tax rate (%)' htmlFor='b-tax'>
                  <Input id='b-tax' type='number' step='any' min={0} max={100} {...num('defaultTaxRate', 100)} />
                </Field>
              </div>
              <Field label='Payment terms (days)' htmlFor='b-terms'>
                <Input id='b-terms' type='number' min={0} max={365} {...num('paymentTermsDays', 365)} />
              </Field>
              <Field label='Quotes valid for (days)' htmlFor='b-valid'>
                <Input id='b-valid' type='number' min={1} max={365} {...num('quoteValidDays', 365)} />
              </Field>
              <Field label='Invoice prefix' htmlFor='b-ip' hint='e.g. INV- gives INV-0001'>
                <Input id='b-ip' {...text('invoicePrefix')} />
              </Field>
              <Field label='Quote prefix' htmlFor='b-qp'>
                <Input id='b-qp' {...text('quotePrefix')} />
              </Field>
              <Field label='Default note' htmlFor='b-notes'>
                <Textarea id='b-notes' rows={2} {...text('defaultNotes')} />
              </Field>
              <Field label='Default invoice terms' htmlFor='b-dterms'>
                <Textarea id='b-dterms' rows={2} {...text('defaultTerms')} />
              </Field>
            </div>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader title='Appearance' />
            <div className='grid gap-2 p-5'>
              {([
                ['light', 'Light', Sun],
                ['dark', 'Dark', Moon],
                ['system', 'Match device', Monitor],
              ] as [Theme, string, React.ElementType][]).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type='button'
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition hover:bg-muted',
                    theme === value && 'border-primary-strong bg-primary-soft'
                  )}
                >
                  <Icon className='size-4' /> {label}
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title='Your data' description='Stored only in this browser. Back it up now and then.' />
            <div className='grid gap-2 p-5'>
              <Button onClick={exportCsv}>
                <Download /> Export all documents (CSV)
              </Button>
              <Button onClick={backup}>
                <Download /> Download full backup (JSON)
              </Button>
              <input ref={restoreInput} type='file' accept='application/json,.json' className='hidden' onChange={(e) => restore(e.target.files?.[0])} />
              <Button onClick={() => restoreInput.current?.click()}>
                <Upload /> Restore from backup
              </Button>
              <div className='my-2 border-t' />
              <Button
                onClick={() => {
                  if (!window.confirm('Replace your data with the sample studio?')) return
                  useStore.getState().resetDemo()
                  toast.success('Sample data restored')
                }}
              >
                <RotateCcw /> Load sample data
              </Button>
              <Button
                variant='ghost'
                className='text-danger'
                onClick={() => {
                  if (!window.confirm('Delete all clients, invoices and quotes? Your business profile stays.')) return
                  useStore.getState().clearAll()
                  toast.success('Start fresh: all documents and clients removed')
                }}
              >
                <Trash2 /> Start with an empty workspace
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
