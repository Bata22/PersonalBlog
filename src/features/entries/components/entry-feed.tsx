import type { BranchIndex } from '@/features/branches/tree'
import { resolveMedia } from '@/features/media/server'
import type { SessionClient } from '@/lib/supabase/server'
import type { EntryCard } from '../queries'
import { EntryCardItem } from './entry-card'

/**
 * Spisak upisa kao stranice dnevnika. Bez `supabase` klijenta prikazuje samo
 * javne slike (javni sajt); sa njim i privatne, preko potpisanih adresa (admin).
 */
export async function EntryFeed({
  items,
  branches,
  hrefFor,
  showVisibility,
  supabase,
}: {
  items: EntryCard[]
  branches: BranchIndex
  hrefFor: (entry: EntryCard) => string
  showVisibility?: boolean
  supabase?: SessionClient
}) {
  const media = await resolveMedia(
    items.flatMap((item) => item.media),
    supabase,
  )
  return (
    <div>
      {items.map((entry) => (
        <EntryCardItem
          key={entry.id}
          entry={entry}
          href={hrefFor(entry)}
          branches={branches}
          media={media}
          showVisibility={showVisibility}
        />
      ))}
    </div>
  )
}
