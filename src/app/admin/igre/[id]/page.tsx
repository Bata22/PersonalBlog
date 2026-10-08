import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ExternalLink } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { requireOwner } from '@/features/auth/session'
import { GameEditor } from '@/features/games/components/game-editor'
import { getOwnerGame } from '@/features/games/queries'
import { LibraryHeader } from '@/features/library/components/library-header'
import { LibraryNotesSection } from '@/features/library/components/library-notes-section'
import { VisibilityToggle } from '@/features/visibility/visibility-toggle'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.games.title }

export default function AdminGamePage({ params }: PageProps<'/admin/igre/[id]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminGame params={params} />
    </Suspense>
  )
}

async function AdminGame({ params }: Pick<PageProps<'/admin/igre/[id]'>, 'params'>) {
  const { supabase } = await requireOwner()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [game, branch] = await Promise.all([
    getOwnerGame(supabase, id),
    supabase.from('branches').select('id').eq('role', 'games').maybeSingle(),
  ])
  if (!game) notFound()

  return (
    <div className="grid gap-8">
      <LibraryHeader
        cover={game.cover_url}
        title={game.name}
        fallback="🎮"
        wide
        subtitle={game.platforms.join(', ')}
        facts={[]}
        actions={
          <>
            <VisibilityToggle target="game" id={game.id} isPublic={game.is_public} size="sm" />
            {game.is_public ? (
              <LinkButton href={`/igre/${game.slug}`} variant="secondary" size="sm">
                <ExternalLink className="size-4" aria-hidden />
                {t.common.viewAsVisitor}
              </LinkButton>
            ) : null}
          </>
        }
      />
      <Panel>
        <GameEditor
          initial={{
            id: game.id,
            status: game.status,
            rating: game.rating,
            hoursPlayed: game.hours_played === null ? null : Number(game.hours_played),
            startedOn: game.started_on ?? '',
            finishedOn: game.finished_on ?? '',
          }}
        />
      </Panel>
      <LibraryNotesSection
        supabase={supabase}
        subject={{ column: 'game_id', id: game.id }}
        title={t.games.notes}
        newLabel={t.games.newNote}
        newHref={branch.data ? `/admin/novo?grana=${branch.data.id}&igra=${game.id}` : null}
        emptyText={t.games.notesEmpty}
      />
    </div>
  )
}
