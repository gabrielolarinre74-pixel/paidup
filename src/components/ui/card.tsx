import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border bg-card shadow-card', className)} {...props} />
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className='min-w-0'>
        <h2 className='text-[15px] font-bold tracking-tight'>{title}</h2>
        {description && <p className='mt-0.5 text-sm text-muted-foreground'>{description}</p>}
      </div>
      {action}
    </div>
  )
}
