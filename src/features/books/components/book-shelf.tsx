import Link from 'next/link'
import { VisibilityBadge } from '@/components/ui/misc'
import { Cover } from '@/features/library/components/cover'
import { t } from '@/i18n/sr'
import { groupByStatus } from '@/features/library/group'
import { BOOK_STATUS_ORDER, type Book } from '../queries'

/** Police po statusu: Čitam, Pročitano, Želim, Odustao. */
export function BookShelf({ books, hrefFor, showVisibility }: { books: Book[]; hrefFor: (book: Book) => string; showVisibility?: boolean }) {
  return (
    <div className="grid gap-10">
      {groupByStatus(books, BOOK_STATUS_ORDER).map(({ status, items }) => (
        <section key={status} aria-labelledby={`polica-${status}`}>
          <h2 id={`polica-${status}`} className="mb-4 text-2xl font-bold">
            {t.books.statuses[status]} <span className="text-base font-semibold text-ink-soft tabular-nums">{items.length}</span>
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
            {items.map((book) => (
              <li key={book.id}>
                <Link href={hrefFor(book)} className="group grid gap-2">
                  <Cover src={book.cover_url} title={book.title} fallback="📕" className="transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none" />
                  <span className="grid gap-0.5">
                    <span className="line-clamp-2 font-semibold leading-snug">{book.title}</span>
                    {book.authors.length ? <span className="line-clamp-1 text-sm text-ink-soft">{book.authors.join(', ')}</span> : null}
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      {book.rating ? <span className="font-semibold">★ {book.rating}/10</span> : null}
                      {showVisibility ? <VisibilityBadge isPublic={book.is_public} compact /> : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
