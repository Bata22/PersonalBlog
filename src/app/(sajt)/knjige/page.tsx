import type { Metadata } from 'next'
import { EmptyState, PageHeader } from '@/components/ui/misc'
import { BookShelf } from '@/features/books/components/book-shelf'
import { getPublicBooks } from '@/features/books/queries'
import { t } from '@/i18n/sr'

export const metadata: Metadata = {
  title: t.books.title,
  description: t.books.intro,
  alternates: { canonical: '/knjige' },
}

export default async function BooksPage() {
  const books = await getPublicBooks()
  return (
    <div className="grid gap-10">
      <PageHeader title={t.books.title} intro={t.books.intro} />
      {books.length > 0 ? <BookShelf books={books} hrefFor={(b) => `/knjige/${b.slug}`} /> : <EmptyState title={t.books.empty} />}
    </div>
  )
}
