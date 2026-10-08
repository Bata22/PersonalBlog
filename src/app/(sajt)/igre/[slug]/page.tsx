import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { FeedSkeleton } from '@/features/entries/components/feed-skeleton'
import { getPublicFeed } from '@/features/entries/queries'
import { getPublicGame } from '@/features/games/queries'
import { LibraryHeader } from '@/features/library/components/library-header'
import { NotesList } from '@/features/library/components/notes-list'
import { JsonLd } from '@/features/seo/json-ld'
import { t } from '@/i18n/sr'
import { formatDate } from '@/lib/dates'
import { formatNumber } from '@/lib/format'
import { absoluteUrl } from '@/lib/site-url'

export async function generateMetadata({ params }: PageProps<'/igre/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const game = await getPublicGame(slug)
  if (!game) return { title: t.errors.notFound, robots: { index: false } }
  return {
    title: game.name,
    description: `Utisci o igri ${game.name}.`,
    alternates: { canonical: `/igre/${slug}` },
  }
}

export default function GamePage({ params }: PageProps<'/igre/[slug]'>) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      {params.then(({ slug }) => (
        <GameContent slug={slug} />
      ))}
    </Suspense>
  )
}

async function GameContent({ slug }: { slug: string }) {
  const game = await getPublicGame(slug)
  if (!game) notFound()
  const notes = await getPublicFeed({ subject: { column: 'game_id', id: game.id }, pageSize: 200 })

  return (
    <div className="grid max-w-3xl gap-10">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'VideoGame', name: game.name, url: absoluteUrl(`/igre/${game.slug}`) }} />
      <LibraryHeader
        cover={game.cover_url}
        title={game.name}
        fallback="🎮"
        wide
        subtitle={game.platforms.join(', ')}
        facts={[
          ['Status', t.games.statuses[game.status]],
          [t.games.rating, game.rating ? `★ ${game.rating}/10` : null],
          [t.games.hours, game.hours_played ? formatNumber(Number(game.hours_played)) : null],
          [t.games.released, game.released ? formatDate(game.released) : null],
          [t.games.finished, game.finished_on ? formatDate(game.finished_on) : null],
        ]}
      />
      <section className="grid gap-4" aria-labelledby="utisci">
        <h2 id="utisci" className="text-2xl font-bold">
          {t.games.notes}
        </h2>
        <NotesList notes={notes.items} hrefFor={(n) => `/objave/${n.slug}`} emptyText={t.games.notesEmpty} />
      </section>
      {game.source === 'rawg' ? (
        <p className="text-xs text-ink-soft">
          <a href="https://rawg.io" rel="noopener noreferrer" className="underline underline-offset-2">
            {t.games.attribution}
          </a>
        </p>
      ) : null}
    </div>
  )
}
