import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-strong shadow-[0_1px_0_rgb(0_0_0/0.08),0_6px_16px_-8px_rgb(234_179_8/0.8)]',
  ink: 'bg-ink text-ink-foreground hover:opacity-90',
  outline: 'border bg-card hover:bg-muted',
  ghost: 'hover:bg-muted',
  danger: 'bg-danger text-white hover:opacity-90',
} as const

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'size-9 justify-center',
} as const

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'outline', size = 'md', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center rounded-xl font-semibold whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
