'use server'

import { z } from 'zod'
import { ATTRIBUTE_IDS } from '@/config/attributes'
import { DEFAULT_BRANCHES, type SeedBranch } from '@/config/default-branches'
import { BRANCH_KINDS, type EntryKind } from '@/config/entry-kinds'
import { ownerOrNull } from '@/features/auth/session'
import { t } from '@/i18n/sr'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { invalidate } from '@/lib/invalidate'
import { fail, ok, zodFieldErrors, type ActionResult } from '@/lib/result'
import { slugify, uniqueSlug } from '@/lib/slug'

/** Sadi početno stablo iz src/config/default-branches.ts (samo ako je prazno). */
export async function plantDefaultBranches(): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const { supabase, userId } = owner

  const { count } = await supabase.from('branches').select('id', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return ok(null)

  type Pending = { seed: SeedBranch; parentId: string | null; inheritedKind: EntryKind }
  let level: Pending[] = DEFAULT_BRANCHES.map((seed) => ({ seed, parentId: null, inheritedKind: 'post' }))

  while (level.length > 0) {
    const rows = level.map(({ seed, parentId, inheritedKind }, index) => ({
      owner_id: userId,
      parent_id: parentId,
      slug: seed.slug,
      name: seed.name,
      icon: seed.icon,
      description: seed.description ?? null,
      attribute: seed.attribute ?? null,
      entry_kind: seed.kind ?? inheritedKind,
      role: seed.role ?? null,
      position: index,
    }))
    const { data, error } = await supabase.from('branches').insert(rows).select('id, slug')
    if (error) return fail(t.errors.generic)

    const idBySlug = new Map(data.map((r) => [r.slug, r.id]))
    level = level.flatMap(({ seed, inheritedKind }) =>
      (seed.children ?? []).map((child) => ({
        seed: child,
        parentId: idBySlug.get(seed.slug) ?? null,
        inheritedKind: seed.kind ?? inheritedKind,
      })),
    )
  }

  invalidate(CACHE_TAGS.branches)
  return ok(null)
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .optional()

const branchSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, 'Upiši naziv.').max(60),
  icon: z.string().trim().min(1, 'Izaberi ikonicu.').max(16),
  description: optionalText(500),
  parentId: z.uuid().nullable(),
  attribute: z.enum(ATTRIBUTE_IDS).nullable(),
  entryKind: z.enum(BRANCH_KINDS),
  focusNote: optionalText(1000),
  position: z.number().int().min(0).max(1000),
})

export type BranchInput = z.input<typeof branchSchema>

export async function saveBranch(input: BranchInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = branchSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation, zodFieldErrors(parsed.error))
  const data = parsed.data
  const { supabase, userId } = owner

  if (data.id && data.parentId === data.id) return fail(t.errors.validation, { parentId: 'Grana ne može biti sama sebi roditelj.' })

  const fields = {
    name: data.name,
    icon: data.icon,
    description: data.description ?? null,
    parent_id: data.parentId,
    attribute: data.attribute,
    focus_note: data.focusNote ?? null,
    position: data.position,
  }

  if (data.id) {
    const { data: existing } = await supabase.from('branches').select('id, slug, role').eq('id', data.id).maybeSingle()
    if (!existing) return fail(t.errors.notFound)
    // posebne grane (dnevnik, biblioteka) zadržavaju svoju vrstu upisa
    const update = existing.role ? fields : { ...fields, entry_kind: data.entryKind }
    const { error } = await supabase.from('branches').update(update).eq('id', data.id)
    if (error) return fail(error.message.includes('predak') ? 'Grana ne može da bude ispod sopstvene podgrane.' : t.errors.generic)
    invalidate(CACHE_TAGS.branches)
    return ok({ id: existing.id, slug: existing.slug })
  }

  const base = slugify(data.name) || 'grana'
  const { data: taken } = await supabase.from('branches').select('slug').like('slug', `${base}%`)
  const slug = uniqueSlug(base, (taken ?? []).map((r) => r.slug), 'grana')

  const { data: created, error } = await supabase
    .from('branches')
    .insert({ ...fields, owner_id: userId, slug, entry_kind: data.entryKind })
    .select('id, slug')
    .single()
  if (error) return fail(t.errors.generic)
  invalidate(CACHE_TAGS.branches)
  return ok(created)
}

export async function deleteBranch(id: string): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  if (!z.uuid().safeParse(id).success) return fail(t.errors.notFound)

  const { error } = await owner.supabase.from('branches').delete().eq('id', id)
  if (error) {
    // 23503 = postoje upisi koji pokazuju na ovu granu (ili podgranu)
    return fail(error.code === '23503' ? t.branches.hasEntries : t.errors.generic)
  }
  invalidate(CACHE_TAGS.branches, CACHE_TAGS.xp)
  return ok(null)
}

/** Brza izmena "Gde sam stao" sa stranice grane. */
export async function saveFocusNote(id: string, note: string): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = z.object({ id: z.uuid(), note: z.string().trim().max(1000) }).safeParse({ id, note })
  if (!parsed.success) return fail(t.errors.validation)

  const { error } = await owner.supabase
    .from('branches')
    .update({ focus_note: parsed.data.note || null })
    .eq('id', parsed.data.id)
  if (error) return fail(t.errors.generic)
  invalidate(CACHE_TAGS.branches)
  return ok(null)
}
