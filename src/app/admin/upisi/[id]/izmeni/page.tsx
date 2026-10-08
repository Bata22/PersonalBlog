import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { requireOwner } from '@/features/auth/session'
import { loadBranchTree } from '@/features/branches/queries'
import { branchPath, findBranch, flattenTree } from '@/features/branches/tree'
import { sanitizeDoc, withImageSources } from '@/features/editor/doc'
import { EntryForm } from '@/features/entries/components/entry-form'
import { asFormKind, defaultMetadata } from '@/features/entries/defaults'
import { readMetadata } from '@/features/entries/metadata'
import { getOwnerEntry } from '@/features/entries/queries'
import { resolveMedia } from '@/features/media/server'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.entries.editTitle }

export default function EditEntryPage({ params }: PageProps<'/admin/upisi/[id]/izmeni'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EditEntry params={params} />
    </Suspense>
  )
}

async function EditEntry({ params }: Pick<PageProps<'/admin/upisi/[id]/izmeni'>, 'params'>) {
  const { supabase, userId } = await requireOwner()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const [entry, tree] = await Promise.all([getOwnerEntry(supabase, id), loadBranchTree(supabase)])
  if (!entry) notFound()
  if (entry.kind === 'journal') redirect(`/admin/dnevnik?dan=${entry.occurred_on}`)
  if (entry.kind === 'milestone') redirect(`/admin/upisi/${entry.id}`)

  const kind = asFormKind(entry.kind)
  const branch = findBranch(tree, (n) => n.id === entry.branch_id)
  const media = await resolveMedia(entry.media, supabase)
  const doc = sanitizeDoc(entry.content)
  const srcById = Object.fromEntries(Object.values(media).map((m) => [m.id, m.src]))

  // premeštanje samo u grane iste vrste (polja ostaju smislena)
  const options = flattenTree(tree)
    .filter((n) => !n.role && n.entry_kind === entry.kind)
    .map((n) => ({ id: n.id, label: branchPath(n) }))

  const returnTo = entry.book_id
    ? `/admin/knjige/${entry.book_id}`
    : entry.game_id
      ? `/admin/igre/${entry.game_id}`
      : entry.anime_id
        ? `/admin/anime/${entry.anime_id}`
        : undefined

  return (
    <div className="grid gap-6">
      <PageHeader title={t.entries.editTitle} />
      <EntryForm
        ownerId={userId}
        branch={{ icon: branch?.icon ?? '🌱', path: branch ? branchPath(branch) : '' }}
        branchOptions={options}
        showChapter={Boolean(entry.book_id)}
        showLink={kind === 'post'}
        returnTo={returnTo}
        initial={{
          id: entry.id,
          kind,
          branchId: entry.branch_id,
          title: entry.title,
          occurredOn: entry.occurred_on,
          isPublic: entry.is_public,
          content: doc ? withImageSources(doc, srcById) : null,
          metadata: readMetadata(kind, entry.metadata) ?? defaultMetadata(kind),
          videoUrls: entry.video_urls,
          media: entry.media
            .filter((m) => media[m.id])
            .map((m) => ({ id: m.id, src: media[m.id].thumb, width: m.width, height: m.height, alt: m.alt ?? '' })),
          bookId: entry.book_id,
          gameId: entry.game_id,
          animeId: entry.anime_id,
        }}
      />
    </div>
  )
}
