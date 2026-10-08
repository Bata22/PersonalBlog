import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EmptyState, PageHeader, Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { AnimeList } from '@/features/anime/components/anime-list'
import { AnimeSyncButton } from '@/features/anime/components/anime-sync-button'
import { getOwnerAnime } from '@/features/anime/queries'
import { requireOwner } from '@/features/auth/session'
import { getOwnerProfile } from '@/features/profile/queries'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.anime.title }

export default function AdminAnimePage() {
  return (
    <div className="grid gap-8">
      <PageHeader title={t.anime.title} intro={t.anime.intro} />
      <Suspense fallback={<AdminSkeleton />}>
        <AnimeAdmin />
      </Suspense>
    </div>
  )
}

async function AnimeAdmin() {
  const { supabase, userId } = await requireOwner()
  const [items, profile] = await Promise.all([getOwnerAnime(supabase), getOwnerProfile(supabase, userId)])

  return (
    <>
      <Panel>
        {profile?.malUsername ? (
          <div className="grid gap-3">
            <p className="text-ink-soft">
              MyAnimeList: <strong className="text-ink">{profile.malUsername}</strong>
            </p>
            <AnimeSyncButton />
          </div>
        ) : (
          <p>
            {t.anime.needUsername}{' '}
            <Link href="/admin/podesavanja" className="font-semibold text-leaf hover:underline">
              {t.settings.title}
            </Link>
          </p>
        )}
      </Panel>
      {items.length > 0 ? (
        <AnimeList items={items} hrefFor={(a) => `/admin/anime/${a.id}`} showVisibility />
      ) : (
        <EmptyState title={t.anime.empty} />
      )}
    </>
  )
}
