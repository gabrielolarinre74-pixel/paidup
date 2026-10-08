import { FilePlus2, Moon, Sun } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/documents', label: 'Invoices & quotes' },
  { href: '/clients', label: 'Clients' },
  { href: '/settings', label: 'Settings' },
]

function isActive(href: string, path: string) {
  return href === '/' ? path === '/' : path.startsWith(href)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [path, navigate] = useLocation()
  const createDoc = useStore((s) => s.createDoc)
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'))

  return (
    <div className='min-h-svh'>
      <header className='sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md'>
        <div className='mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6'>
          <Link href='/' aria-label='PaidUp home'>
            <Logo />
          </Link>
          <nav className='hidden items-center gap-1 md:flex' aria-label='Main'>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground',
                  isActive(n.href, path) && 'bg-muted text-foreground'
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className='ml-auto flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(dark ? 'light' : 'dark')}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
            <Button variant='primary' onClick={() => navigate(`/documents/${createDoc('invoice')}`)}>
              <FilePlus2 /> <span className='hidden sm:inline'>New invoice</span>
              <span className='sm:hidden'>New</span>
            </Button>
          </div>
        </div>
        <nav className='flex gap-1 overflow-x-auto px-3 pb-2 md:hidden' aria-label='Main mobile'>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-muted-foreground',
                isActive(n.href, path) && 'bg-muted text-foreground'
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6'>{children}</main>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className='mb-7 flex flex-wrap items-end justify-between gap-4'>
      <div>
        {eyebrow && (
          <p className='mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-foreground'>
            <span className='size-1.5 rounded-full bg-primary-strong' />
            {eyebrow}
          </p>
        )}
        <h1 className='text-3xl font-extrabold tracking-tight sm:text-[34px]'>{title}</h1>
        {description && <p className='mt-1.5 max-w-2xl text-muted-foreground'>{description}</p>}
      </div>
      {actions && <div className='flex flex-wrap gap-2'>{actions}</div>}
    </div>
  )
}
