import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getPublicAnimeBySlug } from '@/features/anime/queries'
import { FeedSkeleton } from '@/features/entries/components/feed-skeleton'
import { getPublicFeed } from '@/features/entries/queries'
import { LibraryHeader } from '@/features/library/components/library-header'
import { NotesList } from '@/features/library/components/notes-list'
import { t } from '@/i18n/sr'

export async function generateMetadata({ params }: PageProps<'/anime/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const anime = await getPublicAnimeBySlug(slug)
  if (!anime) return { title: t.errors.notFound, robots: { index: false } }
  return {
    title: anime.title,
    description: `Komentari na ${anime.title}.`,
    alternates: { canonical: `/anime/${slug}` },
  }
}

export default function AnimeDetailPage({ params }: PageProps<'/anime/[slug]'>) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      {params.then(({ slug }) => (
        <AnimeContent slug={slug} />
      ))}
    </Suspense>
  )
}

async function AnimeContent({ slug }: { slug: string }) {
  const anime = await getPublicAnimeBySlug(slug)
  if (!anime) notFound()
  const notes = await getPublicFeed({ subject: { column: 'anime_id', id: anime.id }, pageSize: 200 })

  return (
    <div className="grid max-w-3xl gap-10">
      <LibraryHeader
        cover={anime.image_url}
        title={anime.title}
        fallback="🌸"
        facts={[
          ['Status', t.anime.statuses[anime.status]],
          [t.anime.score, anime.score ? `★ ${anime.score}/10` : null],
          [t.anime.episodes, `${anime.episodes_watched}/${anime.episodes_total ?? '?'}`],
        ]}
      />
      <section className="grid gap-4" aria-labelledby="komentari">
        <h2 id="komentari" className="text-2xl font-bold">
          {t.anime.comments}
        </h2>
        <NotesList notes={notes.items} hrefFor={(n) => `/objave/${n.slug}`} emptyText={t.anime.commentsEmpty} />
      </section>
      {anime.mal_id ? (
        <p className="text-xs text-ink-soft">
          <a href={`https://myanimelist.net/anime/${anime.mal_id}`} rel="noopener noreferrer" className="underline underline-offset-2">
            MyAnimeList
          </a>
        </p>
      ) : null}
    </div>
  )
}
