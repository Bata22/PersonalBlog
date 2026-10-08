'use server'

import { z } from 'zod'
import { ownerOrNull } from '@/features/auth/session'
import { t } from '@/i18n/sr'
import { fail, ok, type ActionResult } from '@/lib/result'
import { removeMedia } from './server'
import { MEDIA_PATH } from './types'

const registerSchema = z.object({
  path: z.string().regex(MEDIA_PATH),
  thumbPath: z.string().regex(MEDIA_PATH),
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
  bytes: z.number().int().min(1).max(10 * 1024 * 1024),
})

/**
 * Pregledač je već okačio fajlove u privatni bucket; ovde se zapisuje red u
 * tabeli media (još nepovezan sa upisom — povezuje se pri čuvanju upisa).
 */
export async function registerMedia(input: z.input<typeof registerSchema>): Promise<ActionResult<{ id: string }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)

  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) return fail(t.media.failed)
  const { path, thumbPath, width, height, bytes } = parsed.data

  const prefix = `${owner.userId}/`
  if (!path.startsWith(prefix) || !thumbPath.startsWith(prefix)) return fail(t.errors.forbidden)

  const { data, error } = await owner.supabase
    .from('media')
    .insert({ bucket: 'media-private', path, thumb_path: thumbPath, width, height, bytes, owner_id: owner.userId })
    .select('id')
    .single()
  if (error) return fail(t.media.failed)
  return ok({ id: data.id })
}

/** Uklanja sliku koja još nije sačuvana uz upis (npr. pogrešno izabrana). */
export async function discardDraftMedia(id: string): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  if (!z.uuid().safeParse(id).success) return fail(t.errors.notFound)

  const { data } = await owner.supabase
    .from('media')
    .select('id, bucket, path, thumb_path')
    .eq('id', id)
    .is('entry_id', null)
    .maybeSingle()
  if (data) await removeMedia(owner.supabase, [data])
  return ok(null)
}

/** Briše slike okačene pre više od 24 sata koje nikad nisu sačuvane uz upis. */
export async function cleanOrphanMedia(): Promise<ActionResult<{ removed: number }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await owner.supabase
    .from('media')
    .select('id, bucket, path, thumb_path')
    .is('entry_id', null)
    .lt('created_at', cutoff)
    .limit(200)
  if (error) return fail(t.errors.generic)
  await removeMedia(owner.supabase, data)
  return ok({ removed: data.length })
}
