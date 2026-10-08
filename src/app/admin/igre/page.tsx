import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EmptyState, PageHeader, Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { requireOwner } from '@/features/auth/session'
import { GameGrid } from '@/features/games/components/game-grid'
import { GameSearch } from '@/features/games/components/game-search'
import { getOwnerGames } from '@/features/games/queries'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.games.title }

export default function AdminGamesPage() {
  return (
    <div className="grid gap-8">
      <PageHeader title={t.games.title} intro={t.games.intro} />
      <Panel>
        <GameSearch />
      </Panel>
      <Suspense fallback={<AdminSkeleton />}>
        <Games />
      </Suspense>
    </div>
  )
}

async function Games() {
  const { supabase } = await requireOwner()
  const games = await getOwnerGames(supabase)
  return games.length > 0 ? (
    <GameGrid games={games} hrefFor={(g) => `/admin/igre/${g.id}`} showVisibility />
  ) : (
    <EmptyState title={t.games.empty} />
  )
}
