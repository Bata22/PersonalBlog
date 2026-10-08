import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { EmptyState, PageHeader } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { PlantDefaultsButton } from '@/features/admin/action-buttons'
import { getOwnerAnimeById } from '@/features/anime/queries'
import { requireOwner } from '@/features/auth/session'
import { getOwnerBook } from '@/features/books/queries'
import { BranchPicker } from '@/features/branches/components/branch-picker'
import { loadBranchTree } from '@/features/branches/queries'
import { branchPath, findBranch } from '@/features/branches/tree'
import { EntryForm } from '@/features/entries/components/entry-form'
import { asFormKind, defaultMetadata } from '@/features/entries/defaults'
import { getOwnerGame } from '@/features/games/queries'
import { t } from '@/i18n/sr'
import type { SessionClient } from '@/lib/supabase/server'
import { nowInZone } from '@/lib/today'

export const metadata: Metadata = { title: t.entries.newEntry }

const one = (value: string | string[] | undefined) => (typeof value === 'string' ? value : undefined)
const UUID = /^[0-9a-f-]{36}$/i

export default function NewEntryPage({ searchParams }: PageProps<'/admin/novo'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewEntry searchParams={searchParams} />
    </Suspense>
  )
}

type Subject = {
  ids: { bookId?: string; gameId?: string; animeId?: string }
  label: string
  title: string
  returnTo: string
  showChapter?: boolean
}

/** Beleška o knjizi, utisak o igri ili komentar na anime. */
async function loadSubject(supabase: SessionClient, params: Record<string, string | string[] | undefined>): Promise<Subject | null> {
  const bookId = one(params.knjiga)
  const gameId = one(params.igra)
  const animeId = one(params.anime)
  if (bookId && UUID.test(bookId)) {
    const book = await getOwnerBook(supabase, bookId)
    if (book) return { ids: { bookId: book.id }, label: `📕 ${book.title}`, title: `${book.title}: `, returnTo: `/admin/knjige/${book.id}`, showChapter: true }
  }
  if (gameId && UUID.test(gameId)) {
    const game = await getOwnerGame(supabase, gameId)
    if (game) return { ids: { gameId: game.id }, label: `🎮 ${game.name}`, title: `${game.name}: `, returnTo: `/admin/igre/${game.id}` }
  }
  if (animeId && UUID.test(animeId)) {
    const anime = await getOwnerAnimeById(supabase, animeId)
    if (anime) return { ids: { animeId: anime.id }, label: `🌸 ${anime.title}`, title: `${anime.title}: `, returnTo: `/admin/anime/${anime.id}` }
  }
  return null
}

async function NewEntry({ searchParams }: Pick<PageProps<'/admin/novo'>, 'searchParams'>) {
  const { supabase, userId } = await requireOwner()
  const [params, tree, { today }] = await Promise.all([searchParams, loadBranchTree(supabase), nowInZone()])

  if (tree.length === 0) {
    return <EmptyState title={t.admin.dashboard.emptyTreeTitle} action={<PlantDefaultsButton />} />
  }

  const branchId = one(params.grana)
  const node = branchId ? findBranch(tree, (n) => n.id === branchId) : null
  if (!node) {
    return (
      <div className="grid gap-6">
        <PageHeader title={t.entryForm.pickBranchTitle} intro={t.entryForm.pickBranchHint} />
        <BranchPicker roots={tree} />
      </div>
    )
  }
  if (node.role === 'journal') redirect('/admin/dnevnik')

  const subject = await loadSubject(supabase, params)
  const kind = asFormKind(node.entry_kind)

  return (
    <div className="grid gap-6">
      <PageHeader title={t.entries.newEntry} intro={subject ? subject.label : undefined} />
      <EntryForm
        ownerId={userId}
        branch={{ icon: node.icon, path: branchPath(node) }}
        changeBranchHref={subject ? undefined : '/admin/novo'}
        showChapter={subject?.showChapter}
        showLink={kind === 'post'}
        returnTo={subject?.returnTo}
        initial={{
          kind,
          branchId: node.id,
          title: subject?.title ?? '',
          occurredOn: today,
          isPublic: false,
          content: null,
          metadata: defaultMetadata(kind),
          videoUrls: [],
          media: [],
          ...subject?.ids,
        }}
      />
    </div>
  )
}
