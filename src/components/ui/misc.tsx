import type { ReactNode } from 'react'
import { Globe2, LockKeyhole } from 'lucide-react'
import { cn } from '@/lib/cn'
import { t } from '@/i18n/sr'

type Tone = 'neutral' | 'leaf' | 'private' | 'accent' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-soft',
  leaf: 'bg-leaf-soft text-leaf',
  private: 'bg-private-soft text-private',
  accent: 'bg-accent text-accent-ink',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.8rem] font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Oznaka vidljivosti: ljubičasto = samo za mene. */
export function VisibilityBadge({ isPublic, compact }: { isPublic: boolean; compact?: boolean }) {
  return isPublic ? (
    <Badge tone="leaf">
      <Globe2 className="size-3.5" aria-hidden />
      {compact ? <span className="sr-only">{t.visibility.public}</span> : t.visibility.public}
    </Badge>
  ) : (
    <Badge tone="private">
      <LockKeyhole className="size-3.5" aria-hidden />
      {compact ? <span className="sr-only">{t.visibility.private}</span> : t.visibility.private}
    </Badge>
  )
}

export function Panel({ children, className, as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' | 'aside' }) {
  return <Tag className={cn('rounded-[20px] border border-line bg-surface p-5 sm:p-6', className)}>{children}</Tag>
}

export function PageHeader({ title, intro, actions }: { title: ReactNode; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {intro ? <p className="mt-2 text-ink-soft">{intro}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-ink-soft">{children}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-sunken motion-reduce:animate-none', className)} />
}

/** Traka iskustva; boja ide od zelenog ka zrelom limunu. */
export function XpBar({ progress, label, className }: { progress: number; label: string; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('h-2.5 overflow-hidden rounded-full bg-sunken', className)}
    >
      <div className="xp-fill h-full rounded-full" style={{ width: `${Math.max(pct, 3)}%` }} />
    </div>
  )
}

export function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-xl px-3.5 py-2.5 text-sm font-medium',
        tone === 'error' ? 'bg-danger-soft text-danger' : 'bg-leaf-soft text-leaf',
      )}
    >
      {children}
    </p>
  )
}
