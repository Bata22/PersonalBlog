import 'server-only'
import type { Viewer } from '@/features/auth/session'
import { slugify, uniqueSlug } from '@/lib/slug'

type MilestoneEvent = 'book_finished' | 'game_finished' | 'anime_completed' | 'anime_import'
type Subject = { book_id: string } | { game_id: string } | { anime_id: string }

/**
 * Dostignuće ("Pročitao: Dina", "Prešao: Elden Ring") — poseban upis koji
 * nosi XP iz XP_RULES.milestones. Za isti predmet i događaj pravi se samo jednom.
 */
export async function createMilestone(
  owner: Viewer,
  params: {
    role: 'books' | 'games' | 'anime'
    event: MilestoneEvent
    title: string
    xp: number
    occurredOn: string
    isPublic: boolean
    subject?: Subject
    count?: number
  },
): Promise<{ slug: string } | null> {
  const { supabase, userId } = owner
  const { data: branch } = await supabase.from('branches').select('id').eq('role', params.role).maybeSingle()
  if (!branch) return null

  if (params.subject) {
    const [column, id] = Object.entries(params.subject)[0] as [keyof Subject & string, string]
    const { count } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'milestone')
      .eq(column as 'book_id', id)
      .contains('metadata', { event: params.event })
    if ((count ?? 0) > 0) return null
  }

  const base = slugify(params.title) || 'dostignuce'
  const { data: taken } = await supabase.from('entries').select('slug').like('slug', `${base}%`)
  const slug = uniqueSlug(base, (taken ?? []).map((r) => r.slug))

  const { error } = await supabase.from('entries').insert({
    owner_id: userId,
    branch_id: branch.id,
    kind: 'milestone',
    title: params.title.slice(0, 160),
    slug,
    xp: Math.min(5000, Math.max(0, Math.round(params.xp))),
    is_public: params.isPublic,
    occurred_on: params.occurredOn,
    metadata: { event: params.event, ...(params.count !== undefined ? { count: params.count } : {}) },
    ...(params.subject ?? {}),
  })
  if (error) throw error
  return { slug }
}
