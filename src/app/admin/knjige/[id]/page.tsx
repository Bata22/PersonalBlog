import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ExternalLink } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { requireOwner } from '@/features/auth/session'
import { BookEditor } from '@/features/books/components/book-editor'
import { getOwnerBook } from '@/features/books/queries'
import { LibraryHeader } from '@/features/library/components/library-header'
import { LibraryNotesSection } from '@/features/library/components/library-notes-section'
import { VisibilityToggle } from '@/features/visibility/visibility-toggle'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.books.title }

export default function AdminBookPage({ params }: PageProps<'/admin/knjige/[id]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminBook params={params} />
    </Suspense>
  )
}

async function AdminBook({ params }: Pick<PageProps<'/admin/knjige/[id]'>, 'params'>) {
  const { supabase } = await requireOwner()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [book, branch] = await Promise.all([
    getOwnerBook(supabase, id),
    supabase.from('branches').select('id').eq('role', 'books').maybeSingle(),
  ])
  if (!book) notFound()

  return (
    <div className="grid gap-8">
      <LibraryHeader
        cover={book.cover_url}
        title={book.title}
        fallback="📕"
        subtitle={book.authors.join(', ')}
        facts={[]}
        actions={
          <>
            <VisibilityToggle target="book" id={book.id} isPublic={book.is_public} size="sm" />
            {book.is_public ? (
              <LinkButton href={`/knjige/${book.slug}`} variant="secondary" size="sm">
                <ExternalLink className="size-4" aria-hidden />
                {t.common.viewAsVisitor}
              </LinkButton>
            ) : null}
          </>
        }
      />
      <Panel>
        <BookEditor
          initial={{
            id: book.id,
            status: book.status,
            rating: book.rating,
            startedOn: book.started_on ?? '',
            finishedOn: book.finished_on ?? '',
          }}
        />
      </Panel>
      <LibraryNotesSection
        supabase={supabase}
        subject={{ column: 'book_id', id: book.id }}
        title={t.books.notes}
        newLabel={t.books.newNote}
        newHref={branch.data ? `/admin/novo?grana=${branch.data.id}&knjiga=${book.id}` : null}
        emptyText={t.books.notesEmpty}
      />
    </div>
  )
}
