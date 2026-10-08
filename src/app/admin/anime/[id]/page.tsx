import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ExternalLink } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { AdminSkeleton } from '@/features/admin/components'
import { getOwnerAnimeById } from '@/features/anime/queries'
import { requireOwner } from '@/features/auth/session'
import { LibraryHeader } from '@/features/library/components/library-header'
import { LibraryNotesSection } from '@/features/library/components/library-notes-section'
import { VisibilityToggle } from '@/features/visibility/visibility-toggle'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.anime.title }

export default function AdminAnimeDetailPage({ params }: PageProps<'/admin/anime/[id]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminAnime params={params} />
    </Suspense>
  )
}

async function AdminAnime({ params }: Pick<PageProps<'/admin/anime/[id]'>, 'params'>) {
  const { supabase } = await requireOwner()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [anime, branch] = await Promise.all([
    getOwnerAnimeById(supabase, id),
    supabase.from('branches').select('id').eq('role', 'anime').maybeSingle(),
  ])
  if (!anime) notFound()

  return (
    <div className="grid gap-8">
      <LibraryHeader
        cover={anime.image_url}
        title={anime.title}
        fallback="🌸"
        facts={[
          ['Status', t.anime.statuses[anime.status]],
          [t.anime.score, anime.score ? `★ ${anime.score}/10` : null],
          [t.anime.episodes, `${anime.episodes_watched}/${anime.episodes_total ?? '?'}`],
        ]}
        actions={
          <>
            <VisibilityToggle target="anime" id={anime.id} isPublic={anime.is_public} size="sm" />
            {anime.is_public ? (
              <LinkButton href={`/anime/${anime.slug}`} variant="secondary" size="sm">
                <ExternalLink className="size-4" aria-hidden />
                {t.common.viewAsVisitor}
              </LinkButton>
            ) : null}
          </>
        }
      />
      <LibraryNotesSection
        supabase={supabase}
        subject={{ column: 'anime_id', id: anime.id }}
        title={t.anime.comments}
        newLabel={t.anime.newComment}
        newHref={branch.data ? `/admin/novo?grana=${branch.data.id}&anime=${anime.id}` : null}
        emptyText={t.anime.commentsEmpty}
      />
    </div>
  )
}
