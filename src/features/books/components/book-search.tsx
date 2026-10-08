'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/controls'
import { FormMessage } from '@/components/ui/misc'
import { Cover } from '@/features/library/components/cover'
import { SearchBox } from '@/features/library/components/search-box'
import { StatusPills } from '@/features/library/components/status-pills'
import { t } from '@/i18n/sr'
import { addBook } from '../actions'
import type { BookCandidate } from '../openlibrary'

type Status = 'zelim' | 'citam' | 'procitano' | 'odustao'

export function BookSearch() {
  const id = useId()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<Status>('citam')
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [manual, setManual] = useState({ title: '', authors: '' })

  function run(input: Parameters<typeof addBook>[0]) {
    setMessage(null)
    startTransition(async () => {
      const result = await addBook(input)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setMessage({ tone: 'success', text: t.books.added })
      router.push(`/admin/knjige/${result.data.id}`)
    })
  }

  return (
    <div className="grid gap-5">
      <StatusPills value={status} onChange={setStatus} labels={t.books.statuses} legend="Status" />

      <SearchBox<BookCandidate>
        endpoint="/api/admin/knjige/pretraga"
        label={t.books.add}
        placeholder={t.books.searchPlaceholder}
        emptyText={t.books.noResults}
        getKey={(book) => book.key}
        renderItem={(book) => (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
            <Cover src={book.coverUrl} title={book.title} fallback="📕" className="w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{book.title}</p>
              <p className="truncate text-sm text-ink-soft">
                {[book.authors.join(', '), book.year].filter(Boolean).join(', ')}
              </p>
            </div>
            <Button size="sm" onClick={() => run({ source: 'openlibrary', candidate: book, status })} disabled={pending}>
              <Plus className="size-4" aria-hidden />
              {t.common.add}
            </Button>
          </div>
        )}
      />
      <p className="text-xs text-ink-soft">{t.books.source}</p>

      <details className="rounded-2xl border border-line bg-surface p-4">
        <summary className="cursor-pointer font-semibold">{t.books.addManually}</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field id={`${id}-title`} label={t.books.manualTitle}>
            <Input id={`${id}-title`} value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} maxLength={300} />
          </Field>
          <Field id={`${id}-authors`} label={t.books.manualAuthors}>
            <Input id={`${id}-authors`} value={manual.authors} onChange={(e) => setManual({ ...manual, authors: e.target.value })} maxLength={300} />
          </Field>
          <div>
            <Button onClick={() => run({ source: 'rucno', ...manual, status })} disabled={pending || !manual.title.trim()}>
              {t.common.add}
            </Button>
          </div>
        </div>
      </details>

      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
    </div>
  )
}
