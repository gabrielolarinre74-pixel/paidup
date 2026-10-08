import { STATUS_LABEL } from '@/lib/documents'
import type { DisplayStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STYLES: Record<DisplayStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  overdue: 'bg-red-500/10 text-red-700 dark:text-red-300',
  paid: 'bg-green-500/12 text-green-700 dark:text-green-300',
  accepted: 'bg-primary-soft text-yellow-800 dark:text-primary',
  declined: 'bg-muted text-muted-foreground line-through',
}

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap',
        STYLES[status],
        className
      )}
    >
      <span className='size-1.5 rounded-full bg-current opacity-70' />
      {STATUS_LABEL[status]}
    </span>
  )
}
