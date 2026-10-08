import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getPublicBook } from '@/features/books/queries'
import { FeedSkeleton } from '@/features/entries/components/feed-skeleton'
import { getPublicFeed } from '@/features/entries/queries'
import { LibraryHeader } from '@/features/library/components/library-header'
import { NotesList } from '@/features/library/components/notes-list'
import { JsonLd } from '@/features/seo/json-ld'
import { t } from '@/i18n/sr'
import { formatDate } from '@/lib/dates'
import { absoluteUrl } from '@/lib/site-url'

export async function generateMetadata({ params }: PageProps<'/knjige/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const book = await getPublicBook(slug)
  if (!book) return { title: t.errors.notFound, robots: { index: false } }
  const by = book.authors.length ? ` (${book.authors.join(', ')})` : ''
  return {
    title: `${book.title}${by}`,
    description: `Utisci i beleške o knjizi ${book.title}${by}.`,
    alternates: { canonical: `/knjige/${slug}` },
  }
}

export default function BookPage({ params }: PageProps<'/knjige/[slug]'>) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      {params.then(({ slug }) => (
        <BookContent slug={slug} />
      ))}
    </Suspense>
  )
}

async function BookContent({ slug }: { slug: string }) {
  const book = await getPublicBook(slug)
  if (!book) notFound()
  const notes = await getPublicFeed({ subject: { column: 'book_id', id: book.id }, pageSize: 200 })

  return (
    <div className="grid max-w-3xl gap-10">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Book',
          name: book.title,
          url: absoluteUrl(`/knjige/${book.slug}`),
          ...(book.authors.length ? { author: book.authors.map((name) => ({ '@type': 'Person', name })) } : {}),
          ...(book.isbn ? { isbn: book.isbn } : {}),
        }}
      />
      <LibraryHeader
        cover={book.cover_url}
        title={book.title}
        fallback="📕"
        subtitle={book.authors.join(', ')}
        facts={[
          ['Status', t.books.statuses[book.status]],
          [t.books.rating, book.rating ? `★ ${book.rating}/10` : null],
          [t.books.pages, book.pages],
          [t.books.published, book.first_published],
          [t.books.started, book.started_on ? formatDate(book.started_on) : null],
          [t.books.finished, book.finished_on ? formatDate(book.finished_on) : null],
        ]}
      />
      <section className="grid gap-4" aria-labelledby="beleske">
        <h2 id="beleske" className="text-2xl font-bold">
          {t.books.notes}
        </h2>
        <NotesList notes={notes.items} hrefFor={(n) => `/objave/${n.slug}`} emptyText={t.books.notesEmpty} />
      </section>
      <p className="text-xs text-ink-soft">{t.books.source}</p>
    </div>
  )
}
