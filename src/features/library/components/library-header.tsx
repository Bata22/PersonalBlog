import type { ReactNode } from 'react'
import { Cover } from './cover'

/** Zaglavlje stranice knjige / igre / anime-a: korica + naslov + činjenice. */
export function LibraryHeader({
  cover,
  title,
  fallback,
  wide,
  subtitle,
  facts,
  actions,
}: {
  cover: string | null
  title: string
  fallback: string
  wide?: boolean
  subtitle?: ReactNode
  facts: [string, ReactNode][]
  actions?: ReactNode
}) {
  const visible = facts.filter(([, value]) => value !== null && value !== undefined && value !== '')
  return (
    <header className={wide ? 'grid gap-6' : 'grid gap-6 sm:grid-cols-[12rem_1fr] sm:items-start'}>
      <Cover src={cover} title={title} fallback={fallback} wide={wide} className={wide ? 'max-w-xl' : 'max-w-48'} />
      <div className="grid gap-3">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
        {subtitle ? <p className="text-lg text-ink-soft">{subtitle}</p> : null}
        {visible.length > 0 ? (
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            {visible.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {actions ? <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div> : null}
      </div>
    </header>
  )
}
