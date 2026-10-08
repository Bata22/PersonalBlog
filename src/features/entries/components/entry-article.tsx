import type { ReactNode } from 'react'
import Link from 'next/link'
import { ENTRY_KINDS } from '@/config/entry-kinds'
import type { BranchIndex } from '@/features/branches/tree'
import { RichText } from '@/features/editor/rich-text'
import { collectMediaIds, type DocNode } from '@/features/editor/doc'
import { Gallery } from '@/features/media/components/gallery'
import type { ResolvedMedia } from '@/features/media/types'
import { t } from '@/i18n/sr'
import { formatDate, weekdayName } from '@/lib/dates'
import type { FullEntry } from '../queries'
import { EntryDetails } from './entry-details'
import { VideoList } from './video-list'

type Props = {
  entry: FullEntry
  branches: BranchIndex
  media: Record<string, ResolvedMedia>
  branchHref: (slug: string) => string
  /** Dugmad za vlasnika (izmena, vidljivost) — samo u admin delu. */
  actions?: ReactNode
  /** Dodatak ispod naslova (npr. knjiga na koju se beleška odnosi). */
  subject?: ReactNode
}

/** Ceo upis — isti prikaz na javnoj stranici i u admin delu. */
export function EntryArticle({ entry, branches, media, branchHref, actions, subject }: Props) {
  const branch = branches[entry.branch_id]
  const doc = (entry.content ?? null) as DocNode | null
  const inline = new Set(collectMediaIds(doc))
  const gallery = entry.media.filter((m) => !inline.has(m.id)).map((m) => media[m.id]).filter((m): m is ResolvedMedia => Boolean(m))

  return (
    <article className="grid gap-8">
      <header className="grid gap-3">
        {branch ? (
          <Link
            href={branchHref(branch.slug)}
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sunken px-3 py-1 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            <span aria-hidden>{branch.icon}</span>
            {branch.path}
          </Link>
        ) : null}
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          {entry.kind === 'milestone' ? <span aria-hidden>🏆 </span> : null}
          {entry.title}
        </h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-soft">
          <time dateTime={entry.occurred_on}>
            {weekdayName(entry.occurred_on)}, {formatDate(entry.occurred_on)}
          </time>
          <span>{ENTRY_KINDS[entry.kind].label}</span>
          <span className="font-semibold text-leaf tabular-nums">{t.entries.xpGained(entry.xp)}</span>
        </p>
        {subject}
        {actions ? <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div> : null}
      </header>

      <EntryDetails kind={entry.kind} metadata={entry.metadata} branches={branches} />

      <RichText doc={doc} media={media} className="max-w-[68ch]" />

      {entry.video_urls.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-xl font-bold">{t.entries.videos}</h2>
          <VideoList urls={entry.video_urls} title={entry.title} />
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-xl font-bold">{t.entries.gallery}</h2>
          <Gallery items={gallery} title={entry.title} />
        </section>
      ) : null}
    </article>
  )
}
