import type { MetadataRoute } from 'next'
import { getPublicAnime } from '@/features/anime/queries'
import { getPublicBooks } from '@/features/books/queries'
import { getPublicBranchTree } from '@/features/branches/queries'
import { flattenTree } from '@/features/branches/tree'
import { getPublicEntryIndex } from '@/features/entries/queries'
import { getPublicGames } from '@/features/games/queries'
import { absoluteUrl } from '@/lib/site-url'

/** Mapa sajta za pretraživače — samo javni sadržaj. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, tree, books, games, anime] = await Promise.all([
    getPublicEntryIndex(),
    getPublicBranchTree(),
    getPublicBooks(),
    getPublicGames(),
    getPublicAnime(),
  ])

  const latest = entries[0]?.updated_at

  return [
    { url: absoluteUrl('/'), lastModified: latest, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/objave'), lastModified: latest, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/lik'), lastModified: latest, changeFrequency: 'weekly', priority: 0.6 },
    { url: absoluteUrl('/knjige'), changeFrequency: 'weekly', priority: 0.6 },
    { url: absoluteUrl('/igre'), changeFrequency: 'weekly', priority: 0.5 },
    { url: absoluteUrl('/anime'), changeFrequency: 'weekly', priority: 0.5 },
    ...entries.map((entry) => ({
      url: absoluteUrl(`/objave/${entry.slug}`),
      lastModified: entry.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...flattenTree(tree).map((branch) => ({
      url: absoluteUrl(`/grane/${branch.slug}`),
      lastModified: branch.lastOn ?? undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
    ...books.map((b) => ({ url: absoluteUrl(`/knjige/${b.slug}`), lastModified: b.updated_at, priority: 0.4 })),
    ...games.map((g) => ({ url: absoluteUrl(`/igre/${g.slug}`), lastModified: g.updated_at, priority: 0.4 })),
    ...anime.map((a) => ({ url: absoluteUrl(`/anime/${a.slug}`), lastModified: a.updated_at, priority: 0.3 })),
  ]
}
