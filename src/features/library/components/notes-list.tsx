import Link from 'next/link'
import { VisibilityBadge } from '@/components/ui/misc'
import { readMetadata } from '@/features/entries/metadata'
import type { EntryCard } from '@/features/entries/queries'
import { t } from '@/i18n/sr'
import { formatDate } from '@/lib/dates'

/**
 * Beleške o knjizi/igri/anime-u, grupisane po poglavlju (ako je upisano).
 * Dostignuća ("Pročitao: …") idu na vrh.
 */
export function NotesList({
  notes,
  hrefFor,
  showVisibility,
  emptyText,
}: {
  notes: EntryCard[]
  hrefFor: (note: EntryCard) => string
  showVisibility?: boolean
  emptyText: string
}) {
  if (notes.length === 0) return <p className="text-ink-soft">{emptyText}</p>

  const groups = new Map<string, EntryCard[]>()
  for (const note of notes) {
    const chapter = note.kind === 'post' ? readMetadata('post', note.metadata)?.chapter : undefined
    const key = note.kind === 'milestone' ? '🏆' : (chapter ?? '')
    groups.set(key, [...(groups.get(key) ?? []), note])
  }
  const ordered = [...groups.entries()].sort(([a], [b]) =>
    a === '🏆' ? -1 : b === '🏆' ? 1 : a === '' ? -1 : b === '' ? 1 : a.localeCompare(b, 'sr', { numeric: true }),
  )

  return (
    <div className="grid gap-6">
      {ordered.map(([chapter, items]) => (
        <section key={chapter || 'opste'} className="grid gap-2">
          {chapter && chapter !== '🏆' ? <h3 className="text-lg font-bold">{chapter}</h3> : null}
          <ul className="grid gap-2">
            {items.map((note) => (
              <li key={note.id}>
                <Link href={hrefFor(note)} className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                    <time dateTime={note.occurred_on}>{formatDate(note.occurred_on)}</time>
                    <span className="font-semibold text-leaf">{t.entries.xpGained(note.xp)}</span>
                    {showVisibility ? <VisibilityBadge isPublic={note.is_public} compact /> : null}
                  </span>
                  <span className="mt-1 block font-semibold">
                    {note.kind === 'milestone' ? '🏆 ' : null}
                    {note.title}
                  </span>
                  {note.excerpt && note.kind !== 'milestone' ? (
                    <span className="mt-1 line-clamp-2 block text-ink-soft">{note.excerpt}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
