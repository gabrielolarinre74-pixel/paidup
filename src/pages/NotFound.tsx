import { FileQuestion } from 'lucide-react'
import { Link } from 'wouter'

export function NotFound({ title = 'Nothing to see here' }: { title?: string }) {
  return (
    <div className='mx-auto max-w-md py-20 text-center'>
      <span className='mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground'>
        <FileQuestion className='size-7' />
      </span>
      <h1 className='mt-6 text-2xl font-extrabold tracking-tight'>{title}</h1>
      <p className='mt-2 text-muted-foreground'>The link may be old, or the item was deleted.</p>
      <Link href='/' className='mt-6 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-ink-foreground'>
        Back to overview
      </Link>
    </div>
  )
}
