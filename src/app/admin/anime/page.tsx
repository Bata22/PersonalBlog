import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EmptyState, FormMessage, PageHeader, Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { AnimeAdd } from '@/features/anime/components/anime-add'
import { AnimeList } from '@/features/anime/components/anime-list'
import { AnimeSyncButton } from '@/features/anime/components/anime-sync-button'
import { MalConnectLink, MalDisconnectButton } from '@/features/anime/components/mal-connection'
import { isMalConnected } from '@/features/anime/mal-auth'
import { malNotice } from '@/features/anime/mal-notice'
import { getOwnerAnime } from '@/features/anime/queries'
import { requireOwner } from '@/features/auth/session'
import { getOwnerProfile } from '@/features/profile/queries'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.anime.title }

export default function AdminAnimePage({ searchParams }: PageProps<'/admin/anime'>) {
  return (
    <div className="grid gap-8">
      <PageHeader title={t.anime.title} intro={t.anime.intro} />
      <Suspense fallback={<AdminSkeleton />}>
        <AnimeAdmin searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function AnimeAdmin({ searchParams }: Pick<PageProps<'/admin/anime'>, 'searchParams'>) {
  const { supabase, userId } = await requireOwner()
  const [items, profile, connected, params] = await Promise.all([
    getOwnerAnime(supabase),
    getOwnerProfile(supabase, userId),
    isMalConnected(userId),
    searchParams,
  ])
  const notice = malNotice(params.mal)

  return (
    <>
      {notice ? <FormMessage tone={notice.tone}>{notice.text}</FormMessage> : null}

      <Panel className="grid gap-4">
        <h2 className="text-xl font-bold">{t.anime.add}</h2>
        {connected ? (
          <AnimeAdd />
        ) : (
          <div className="grid justify-items-start gap-3">
            <p className="text-ink-soft">{t.anime.malConnectHint}</p>
            <MalConnectLink />
          </div>
        )}
      </Panel>

      <Panel className="grid gap-4">
        {connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">{t.anime.malConnectedAs(profile?.malUsername ?? 'MyAnimeList')}</p>
            <MalDisconnectButton />
          </div>
        ) : null}
        {profile?.malUsername ? (
          <AnimeSyncButton />
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
