import type { SessionClient } from '@/lib/supabase/server'

export async function getJournalBranchId(supabase: SessionClient): Promise<string | null> {
  const { data } = await supabase.from('branches').select('id').eq('role', 'journal').maybeSingle()
  return data?.id ?? null
}

/** Datumi dnevničkih upisa od `since` do danas (za niz i kalendar). */
export async function getJournalDates(supabase: SessionClient, since: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('occurred_on')
    .eq('kind', 'journal')
    .gte('occurred_on', since)
    .order('occurred_on', { ascending: false })
  if (error) throw error
  return data.map((row) => row.occurred_on)
}

export async function getJournalEntry(supabase: SessionClient, date: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('id, slug, metadata, is_public, xp')
    .eq('kind', 'journal')
    .eq('occurred_on', date)
    .maybeSingle()
  if (error) throw error
  return data
}
