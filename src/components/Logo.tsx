import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 32 32' aria-hidden className={cn('size-8', className)}>
      <rect width='32' height='32' rx='9' fill='#FACC15' />
      <path d='M11 23V9h6.2a4.6 4.6 0 0 1 0 9.2H11' fill='none' stroke='#0A0A0A' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />
      <circle cx='22.5' cy='22.5' r='2' fill='#0A0A0A' />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className='text-[17px] font-extrabold tracking-tight'>PaidUp</span>
    </span>
  )
}
