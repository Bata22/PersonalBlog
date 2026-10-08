import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ExternalLink, Pencil } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { AdminSkeleton } from '@/features/admin/components'
import { DeleteEntryButton } from '@/features/admin/action-buttons'
import { requireOwner } from '@/features/auth/session'
import { loadBranchTree } from '@/features/branches/queries'
import { indexBranches } from '@/features/branches/tree'
import { EntryArticle } from '@/features/entries/components/entry-article'
import { getOwnerEntry } from '@/features/entries/queries'
import { resolveMedia } from '@/features/media/server'
import { VisibilityToggle } from '@/features/visibility/visibility-toggle'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.entries.adminTitle }

export default function AdminEntryPage({ params }: PageProps<'/admin/upisi/[id]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminEntry params={params} />
    </Suspense>
  )
}

async function AdminEntry({ params }: Pick<PageProps<'/admin/upisi/[id]'>, 'params'>) {
  const { supabase } = await requireOwner()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const [entry, tree] = await Promise.all([getOwnerEntry(supabase, id), loadBranchTree(supabase)])
  if (!entry) notFound()
  const media = await resolveMedia(entry.media, supabase)

  const editHref = entry.kind === 'journal' ? `/admin/dnevnik?dan=${entry.occurred_on}` : `/admin/upisi/${entry.id}/izmeni`

  return (
    <EntryArticle
      entry={entry}
      branches={indexBranches(tree)}
      media={media}
      branchHref={(slug) => `/grane/${slug}`}
      actions={
        <>
          {entry.kind !== 'milestone' ? (
            <LinkButton href={editHref} size="sm">
              <Pencil className="size-4" aria-hidden />
              {t.common.edit}
            </LinkButton>
          ) : null}
          <VisibilityToggle target="entry" id={entry.id} isPublic={entry.is_public} size="sm" />
          {entry.is_public ? (
            <LinkButton href={`/objave/${entry.slug}`} variant="secondary" size="sm">
              <ExternalLink className="size-4" aria-hidden />
              {t.common.viewAsVisitor}
            </LinkButton>
          ) : null}
          {entry.kind === 'milestone' ? <DeleteEntryButton id={entry.id} redirectTo="/admin/upisi" /> : null}
        </>
      }
    />
  )
}
