import Link from 'next/link'
import { VisibilityBadge } from '@/components/ui/misc'
import type { BranchIndex } from '@/features/branches/tree'
import type { ResolvedMedia } from '@/features/media/types'
import { t } from '@/i18n/sr'
import { dateStamp, formatDate } from '@/lib/dates'
import type { EntryCard as EntryCardRow } from '../queries'

type Props = {
  entry: EntryCardRow
  href: string
  branches: BranchIndex
  media: Record<string, ResolvedMedia>
  showVisibility?: boolean
}

/** Jedan red dnevnika: pečat datuma levo, grana, naslov, izvod, XP. */
export function EntryCardItem({ entry, href, branches, media, showVisibility }: Props) {
  const stamp = dateStamp(entry.occurred_on)
  const branch = branches[entry.branch_id]
  const thumbs = entry.media.map((m) => media[m.id]).filter(Boolean).slice(0, 3)
  const isMilestone = entry.kind === 'milestone'

  return (
    <article className="grid grid-cols-[3.5rem_1fr] gap-x-4 border-t border-dashed border-line-strong py-5 first:border-t-0 first:pt-1">
      <time dateTime={entry.occurred_on} title={formatDate(entry.occurred_on)} className="pt-0.5 text-center leading-none">
        <span className="block font-display text-[2rem] font-extrabold tabular-nums">{stamp.day}</span>
        <span className="mt-1 block text-xs font-semibold text-ink-soft">
          {stamp.month} {stamp.year}
        </span>
      </time>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {branch ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-ink-soft">
              <span aria-hidden>{branch.icon}</span>
              <span className="truncate">{branch.path}</span>
            </span>
          ) : null}
          <span className="font-semibold text-leaf tabular-nums">{t.entries.xpGained(entry.xp)}</span>
          {showVisibility ? <VisibilityBadge isPublic={entry.is_public} /> : null}
        </div>

        <h2 className={isMilestone ? 'mt-1 text-lg font-bold' : 'mt-1 text-xl font-bold'}>
          <Link href={href} className="decoration-accent-strong decoration-2 underline-offset-4 hover:underline">
            {isMilestone ? <span aria-hidden>🏆 </span> : null}
            {entry.title}
          </Link>
        </h2>

        {entry.excerpt && !isMilestone ? <p className="mt-1.5 line-clamp-3 text-ink-soft">{entry.excerpt}</p> : null}

        {thumbs.length > 0 ? (
          <div className="mt-3 flex gap-2">
            {thumbs.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element -- sličice su već smanjene
              <img
                key={m!.id}
                src={m!.thumb}
                alt={m!.alt ?? ''}
                width={m!.width}
                height={m!.height}
                loading="lazy"
                decoding="async"
                className="size-20 rounded-xl object-cover sm:size-24"
              />
            ))}
          </div>
        ) : null}

        {entry.video_urls.length > 0 && thumbs.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-ink-soft">▶ {t.entries.videos}</p>
        ) : null}
      </div>
    </article>
  )
}
