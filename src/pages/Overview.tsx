import { useMemo, useState } from 'react'
import { ArrowRight, BellRing, Clock3, FileText, PenLine } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { SendDialog } from '@/components/doc/SendDialog'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { daysBetween, formatDate, today } from '@/lib/dates'
import { displayStatus, paidByMonth, summary, totals } from '@/lib/documents'
import { formatMoney } from '@/lib/money'
import type { Doc } from '@/lib/types'
import { useStore } from '@/store'

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Overview() {
  const docs = useStore((s) => s.docs)
  const clients = useStore((s) => s.clients)
  const business = useStore((s) => s.business)
  const [, navigate] = useLocation()
  const [nudge, setNudge] = useState<Doc | null>(null)
  const [now] = useState(() => new Date())
  const todayISO = today()
  const money = (n: number, compact = false) => formatMoney(n, business.currency, { compact })

  const s = useMemo(() => summary(docs, todayISO), [docs, todayISO])
  const months = useMemo(() => paidByMonth(docs, todayISO, 6), [docs, todayISO])
  const maxMonth = Math.max(1, ...months.map((m) => m.total))
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])

  const needsNudge = useMemo(
    () =>
      docs
        .filter((d) => d.kind === 'invoice' && d.status === 'sent' && daysBetween(todayISO, d.dueDate) <= 3)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [docs, todayISO]
  )
  const recent = useMemo(() => [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6), [docs])
  const first = business.owner.split(' ')[0]

  return (
    <>
      <PageHeader
        eyebrow={now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`${greeting(now.getHours())}${first ? `, ${first}` : ''}`}
        description='Here is what you are owed, what came in, and who needs a friendly nudge.'
      />

      <div className='grid gap-4 lg:grid-cols-3'>
        <section className='relative overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground lg:col-span-2'>
          <div aria-hidden className='absolute -right-20 -bottom-24 size-80 rounded-full bg-white/25 blur-2xl' />
          <div aria-hidden className='absolute top-6 right-8 hidden font-extrabold text-black/[0.06] select-none sm:block' style={{ fontSize: 160, lineHeight: 1 }}>
            $
          </div>
          <p className='relative text-sm font-bold'>Waiting to be paid</p>
          <p className='tabular relative mt-2 text-5xl font-extrabold tracking-tight sm:text-6xl'>{money(s.outstanding)}</p>
          <div className='relative mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold'>
            <span className='rounded-full bg-black px-3 py-1 text-white'>
              {money(s.overdue)} overdue
            </span>
            <span className='rounded-full bg-black/10 px-3 py-1'>
              {s.overdueCount} {s.overdueCount === 1 ? 'invoice needs' : 'invoices need'} chasing
            </span>
          </div>
          <div className='relative mt-7 flex flex-wrap gap-2'>
            <Button variant='ink' className='bg-[#0a0a0a] text-white' onClick={() => navigate('/documents')}>
              See all invoices <ArrowRight />
            </Button>
            {needsNudge[0] && (
              <Button className='border-black/15 bg-white/60 hover:bg-white' onClick={() => setNudge(needsNudge[0])}>
                <BellRing /> Nudge {clientById.get(needsNudge[0].clientId ?? '')?.name ?? needsNudge[0].number}
              </Button>
            )}
          </div>
        </section>

        <section className='rounded-3xl bg-[#0a0a0a] p-7 text-white ring-1 ring-white/10'>
          <p className='text-sm font-bold text-white/60'>Paid this month</p>
          <p className='tabular mt-2 text-4xl font-extrabold tracking-tight'>{money(s.paidThisMonth)}</p>
          <div className='mt-8 flex h-28 items-end gap-2' role='img' aria-label='Paid per month, last six months'>
            {months.map((m, i) => (
              <div key={m.key} className='flex flex-1 flex-col items-center gap-1.5'>
                <div
                  title={`${m.label}: ${money(m.total)}`}
                  className={i === months.length - 1 ? 'w-full rounded-lg bg-[#FACC15]' : 'w-full rounded-lg bg-white/15'}
                  style={{ height: `${Math.max(6, (m.total / maxMonth) * 96)}px` }}
                />
                <span className='text-[11px] font-semibold text-white/50'>{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className='mt-4 grid gap-4 sm:grid-cols-3'>
        <Stat icon={Clock3} label='Average time to get paid' value={s.avgDaysToPay === null ? '—' : `${s.avgDaysToPay} days`} />
        <Stat icon={FileText} label='Quotes awaiting a yes' value={money(s.openQuotes)} />
        <Stat icon={PenLine} label='Drafts not sent yet' value={String(s.draftCount)} />
      </div>

      <div className='mt-6 grid gap-6 lg:grid-cols-5'>
        <Card className='lg:col-span-3'>
          <CardHeader title='Needs a nudge' description='Overdue or due within three days.' />
          <ul className='p-2'>
            {needsNudge.length === 0 && <li className='px-3 py-10 text-center text-sm text-muted-foreground'>Nobody to chase. Nice.</li>}
            {needsNudge.map((d) => {
              const late = daysBetween(d.dueDate, todayISO)
              const client = clientById.get(d.clientId ?? '')
              return (
                <li key={d.id} className='flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/60'>
                  <div className='min-w-0 flex-1'>
                    <Link href={`/documents/${d.id}`} className='font-bold hover:underline'>
                      {client?.name ?? 'No client'}
                    </Link>
                    <p className='text-xs text-muted-foreground'>
                      {d.number} · {late > 0 ? `${late} day${late === 1 ? '' : 's'} late` : late === 0 ? 'due today' : `due in ${-late} day${late === -1 ? '' : 's'}`}
                    </p>
                  </div>
                  <span className='tabular text-sm font-bold'>{formatMoney(totals(d).total, d.currency)}</span>
                  <StatusBadge status={displayStatus(d, todayISO)} className='hidden sm:inline-flex' />
                  <Button size='sm' variant={late > 0 ? 'ink' : 'outline'} onClick={() => setNudge(d)}>
                    <BellRing /> Remind
                  </Button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className='lg:col-span-2'>
          <CardHeader title='Recently updated' action={<Link href='/documents' className='text-sm font-semibold text-muted-foreground hover:text-foreground'>View all</Link>} />
          <ul className='p-2'>
            {recent.map((d) => (
              <li key={d.id}>
                <Link href={`/documents/${d.id}`} className='flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60'>
                  <span className='flex size-9 items-center justify-center rounded-lg bg-muted text-[11px] font-extrabold'>{d.kind === 'invoice' ? 'INV' : 'QTE'}</span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-bold'>{clientById.get(d.clientId ?? '')?.name ?? 'No client'}</span>
                    <span className='block text-xs text-muted-foreground'>
                      {d.number} · {formatDate(d.issueDate)}
                    </span>
                  </span>
                  <StatusBadge status={displayStatus(d, todayISO)} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {nudge && (
        <SendDialog
          open={!!nudge}
          onOpenChange={(o) => !o && setNudge(null)}
          doc={nudge}
          client={clientById.get(nudge.clientId ?? '')}
          business={business}
        />
      )}
    </>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card className='flex items-center gap-4 p-5'>
      <span className='flex size-11 items-center justify-center rounded-xl bg-primary-soft text-foreground'>
        <Icon className='size-5' />
      </span>
      <div>
        <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
        <p className='tabular text-2xl font-extrabold tracking-tight'>{value}</p>
      </div>
    </Card>
  )
}
