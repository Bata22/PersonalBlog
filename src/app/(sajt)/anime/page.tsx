import type { Metadata } from 'next'
import { EmptyState, PageHeader } from '@/components/ui/misc'
import { AnimeList } from '@/features/anime/components/anime-list'
import { getPublicAnime } from '@/features/anime/queries'
import { t } from '@/i18n/sr'

export const metadata: Metadata = {
  title: t.anime.title,
  description: t.anime.intro,
  alternates: { canonical: '/anime' },
}

export default async function AnimePage() {
  const items = await getPublicAnime()
  return (
    <div className="grid gap-10">
      <PageHeader title={t.anime.title} intro={t.anime.intro} />
      {items.length > 0 ? <AnimeList items={items} hrefFor={(a) => `/anime/${a.slug}`} /> : <EmptyState title={t.anime.empty} />}
      <p className="text-xs text-ink-soft">{t.anime.source}</p>
    </div>
  )
}
