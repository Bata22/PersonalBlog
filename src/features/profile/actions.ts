'use server'

import { z } from 'zod'
import { ownerOrNull } from '@/features/auth/session'
import { t } from '@/i18n/sr'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { invalidate } from '@/lib/invalidate'
import { fail, ok, zodFieldErrors, type ActionResult } from '@/lib/result'

const profileSchema = z.object({
  displayName: z.string().trim().max(80),
  headline: z.string().trim().max(160),
  bio: z.string().trim().max(2000),
  showStatsPublicly: z.boolean(),
  malUsername: z
    .string()
    .trim()
    .max(16)
    .refine((v) => v === '' || /^[A-Za-z0-9_-]{2,16}$/.test(v), 'Neispravno korisničko ime.'),
  reminderEnabled: z.boolean(),
  reminderHour: z.number().int().min(0).max(23),
})

export type ProfileInput = z.input<typeof profileSchema>

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation, zodFieldErrors(parsed.error))
  const data = parsed.data

  const { error } = await owner.supabase
    .from('profiles')
    .update({
      display_name: data.displayName,
      headline: data.headline || null,
      bio: data.bio || null,
      show_stats_publicly: data.showStatsPublicly,
      mal_username: data.malUsername || null,
      reminder_enabled: data.reminderEnabled,
      reminder_hour: data.reminderHour,
    })
    .eq('id', owner.userId)
  if (error) return fail(t.errors.generic)

  // xp: javni zbir XP-a zavisi od show_stats_publicly
  invalidate(CACHE_TAGS.profile, CACHE_TAGS.xp)
  return ok(null)
}
