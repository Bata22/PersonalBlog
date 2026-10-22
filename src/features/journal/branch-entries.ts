import 'server-only'
import type { Viewer } from '@/features/auth/session'
import { docToPlainText, type DocNode } from '@/features/editor/doc'
import { removeEntryMedia } from '@/features/media/server'
import { readMetadata, type JournalMeta } from '@/features/entries/metadata'
import { persistEntry } from '@/features/entries/persist'
import { formatDate } from '@/lib/dates'

/**
 * Iz dnevnika u grane: svaka grana označena u "Na čemu sam radio?" dobija
 * svoj upis za taj dan (sa beleškom ako postoji) i svoj XP. Upis posle
 * možeš da dopuniš slikama ili videom kao bilo koji drugi.
 *
 * Ponovno čuvanje dana ažurira te upise, a odčekirana grana gubi svoj upis,
 * osim ako si ga u međuvremenu dopunio (slike, video, ručno menjan tekst).
 */

const TITLE_MAX = 90

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
const plainOf = (content: unknown) => normalize(docToPlainText(content as DocNode | null))

function noteDoc(text: string): DocNode | null {
  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) return null
  return { type: 'doc', content: paragraphs.map((line) => ({ type: 'paragraph', content: [{ type: 'text', text: line }] })) }
}

function titleFor(branchName: string, day: string, note: string) {
  const firstLine = note.split('\n')[0]?.trim() ?? ''
  if (!firstLine) return `${branchName}, ${formatDate(day)}`
  const title = `${branchName}: ${firstLine}`
  return title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1).trimEnd()}…` : title
}

export async function syncJournalBranchEntries(
  owner: Viewer,
  params: { day: string; isPublic: boolean; meta: JournalMeta },
): Promise<{ xp: number; slugs: string[] }> {
  const { supabase } = owner
  const { day, isPublic, meta } = params

  const [{ data: existing, error }, { data: branches, error: branchError }] = await Promise.all([
    supabase
      .from('entries')
      .select('id, slug, branch_id, metadata, content, video_urls, xp, media(id, position)')
      .eq('kind', 'post')
      .eq('occurred_on', day)
      .contains('metadata', { fromJournal: day }),
    meta.workedOn.length > 0
      ? supabase.from('branches').select('id, slug, name, role').in('id', meta.workedOn)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (error) throw error
  if (branchError) throw branchError

  const byBranch = new Map(existing.map((row) => [row.branch_id, row]))
  const slugs: string[] = []
  let xp = 0

  for (const branch of branches ?? []) {
    if (branch.role === 'journal') continue
    const note = (meta.notes[branch.id] ?? '').trim()
    const before = byBranch.get(branch.id)
    const beforeMeta = before ? readMetadata('post', before.metadata) : null
    const mediaIds = (before?.media ?? []).sort((a, b) => a.position - b.position).map((m) => m.id)

    // upis koji si posle dnevnika ručno menjao (tekst) ostaje kakav jeste
    const beforePlain = before ? plainOf(before.content) : ''
    if (before && beforePlain !== '' && beforePlain !== normalize(beforeMeta?.journalNote ?? '')) {
      xp += before.xp
      byBranch.delete(branch.id)
      continue
    }

    const result = await persistEntry(
      owner,
      {
        id: before?.id,
        kind: 'post',
        branchId: branch.id,
        title: titleFor(branch.name, day, note),
        occurredOn: day,
        isPublic,
        content: noteDoc(note),
        metadata: { fromJournal: day, journalNote: note },
        videoUrls: before?.video_urls ?? [],
        mediaIds,
      },
      { slugBase: `dan-${day}-${branch.slug}` },
    )
    xp += result.xp
    slugs.push(result.slug)
    byBranch.delete(branch.id)
  }

  // odčekirane grane: briši samo ono što nisi dopunio
  for (const row of byBranch.values()) {
    const rowMeta = readMetadata('post', row.metadata)
    const untouched =
      row.media.length === 0 && row.video_urls.length === 0 && plainOf(row.content) === normalize(rowMeta?.journalNote ?? '')
    if (!untouched) continue
    await removeEntryMedia(supabase, row.id)
    const { error: deleteError } = await supabase.from('entries').delete().eq('id', row.id)
    if (deleteError) throw deleteError
    slugs.push(row.slug)
  }

  return { xp, slugs }
}
