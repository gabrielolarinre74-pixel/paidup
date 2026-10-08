import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, title, description, children, className }: Props) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className='fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]' />
        <D.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 shadow-pop focus:outline-none',
            className
          )}
        >
          <D.Title className='text-lg font-bold tracking-tight'>{title}</D.Title>
          {description ? (
            <D.Description className='mt-1 text-sm text-muted-foreground'>{description}</D.Description>
          ) : (
            <D.Description className='sr-only'>{title}</D.Description>
          )}
          <D.Close className='absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted' aria-label='Close'>
            <X className='size-4' />
          </D.Close>
          <div className='mt-5'>{children}</div>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
