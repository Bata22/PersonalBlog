import type { Metadata } from 'next'
import { EmptyState, PageHeader } from '@/components/ui/misc'
import { GameGrid } from '@/features/games/components/game-grid'
import { getPublicGames } from '@/features/games/queries'
import { t } from '@/i18n/sr'

export const metadata: Metadata = {
  title: t.games.title,
  description: t.games.intro,
  alternates: { canonical: '/igre' },
}

export default async function GamesPage() {
  const games = await getPublicGames()
  return (
    <div className="grid gap-10">
      <PageHeader title={t.games.title} intro={t.games.intro} />
      {games.length > 0 ? <GameGrid games={games} hrefFor={(g) => `/igre/${g.slug}`} /> : <EmptyState title={t.games.empty} />}
      <p className="text-xs text-ink-soft">
        <a href="https://rawg.io" rel="noopener noreferrer" className="underline underline-offset-2">
          {t.games.attribution}
        </a>
      </p>
    </div>
  )
}
