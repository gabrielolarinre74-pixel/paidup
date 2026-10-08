import { useState } from 'react'
import { Copy, Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/field'
import { today } from '@/lib/dates'
import { displayStatus, kindLabel } from '@/lib/documents'
import { mailtoLink, reminderMessage, whatsappLink } from '@/lib/reminders'
import type { Business, Client, Doc } from '@/lib/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: Doc
  client?: Client
  business: Business
  /** Called after the message leaves PaidUp (copied or opened in an app). */
  onSent?: () => void
}

export function SendDialog(props: Props) {
  const status = displayStatus(props.doc, today())
  const title =
    status === 'overdue' ? 'Chase this payment' : status === 'sent' ? 'Send a reminder' : `Send ${kindLabel(props.doc.kind).toLowerCase()}`
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} title={title} description='Edit the message, then copy it or open it in WhatsApp or your email app. Attach the PDF from the download button.'>
      {props.open && <SendForm {...props} />}
    </Dialog>
  )
}

function SendForm({ doc, client, business, onSent, onOpenChange }: Props) {
  const [text, setText] = useState(() => reminderMessage(doc, client, business, today()))
  const subject = `${kindLabel(doc.kind)} ${doc.number} from ${business.name}`
  const done = (msg: string) => {
    onSent?.()
    toast.success(msg)
    onOpenChange(false)
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      done('Message copied')
    } catch {
      toast.error('Copy failed. Select the text and copy it manually.')
    }
  }
  return (
    <div className='space-y-4'>
      <Textarea aria-label='Message' rows={9} value={text} onChange={(e) => setText(e.target.value)} className='font-medium' />
      <div className='flex flex-wrap justify-end gap-2'>
        <Button onClick={copy}>
          <Copy /> Copy
        </Button>
        <a
          className='inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold hover:bg-muted [&_svg]:size-4'
          href={mailtoLink(client?.email ?? '', subject, text)}
          onClick={() => done('Opening your email app')}
        >
          <Mail /> Email
        </a>
        <a
          className='inline-flex h-10 items-center gap-2 rounded-xl bg-[#0a0a0a] px-4 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black [&_svg]:size-4'
          href={whatsappLink(client?.phone ?? '', text)}
          target='_blank'
          rel='noreferrer'
          onClick={() => done('Opening WhatsApp')}
        >
          <MessageCircle /> WhatsApp
        </a>
      </div>
    </div>
  )
}
