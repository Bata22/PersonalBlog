import { Plus } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { getOwnerFeed, type SubjectFilter } from '@/features/entries/queries'
import type { SessionClient } from '@/lib/supabase/server'
import { NotesList } from './notes-list'

/** Admin: beleške o stavci biblioteke + dugme za novu. */
export async function LibraryNotesSection({
  supabase,
  subject,
  title,
  newLabel,
  newHref,
  emptyText,
}: {
  supabase: SessionClient
  subject: SubjectFilter
  title: string
  newLabel: string
  newHref: string | null
  emptyText: string
}) {
  const notes = await getOwnerFeed(supabase, { subject, pageSize: 200 })
  return (
    <section className="grid gap-4" aria-labelledby="beleske-admin">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="beleske-admin" className="text-2xl font-bold">
          {title}
        </h2>
        {newHref ? (
          <LinkButton href={newHref} size="sm">
            <Plus className="size-4" aria-hidden />
            {newLabel}
          </LinkButton>
        ) : null}
      </div>
      <NotesList notes={notes.items} hrefFor={(n) => `/admin/upisi/${n.id}`} showVisibility emptyText={emptyText} />
    </section>
  )
}
