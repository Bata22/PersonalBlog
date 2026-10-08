import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EmptyState, PageHeader, Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { requireOwner } from '@/features/auth/session'
import { BookSearch } from '@/features/books/components/book-search'
import { BookShelf } from '@/features/books/components/book-shelf'
import { getOwnerBooks } from '@/features/books/queries'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.books.title }

export default function AdminBooksPage() {
  return (
    <div className="grid gap-8">
      <PageHeader title={t.books.title} intro={t.books.intro} />
      <Panel>
        <BookSearch />
      </Panel>
      <Suspense fallback={<AdminSkeleton />}>
        <Shelf />
      </Suspense>
    </div>
  )
}

async function Shelf() {
  const { supabase } = await requireOwner()
  const books = await getOwnerBooks(supabase)
  return books.length > 0 ? (
    <BookShelf books={books} hrefFor={(b) => `/admin/knjige/${b.id}`} showVisibility />
  ) : (
    <EmptyState title={t.books.empty} />
  )
}
