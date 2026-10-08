import { t } from '@/i18n/sr'
import { getBrowserClient } from '@/lib/supabase/browser'
import { registerMedia } from './actions'
import { compressImage, MediaError } from './compress'
import type { DraftMedia } from './types'

/**
 * Smanji → okači direktno u Supabase Storage (privatni bucket) → zapiši u bazu.
 * Fajlovi idu pravo iz pregledača, ne preko Vercel funkcije (nema limita od 4 MB).
 */
export async function uploadImage(file: File, ownerId: string): Promise<DraftMedia> {
  const image = await compressImage(file)
  const id = crypto.randomUUID()
  const path = `${ownerId}/${id}.${image.extension}`
  const thumbPath = `${ownerId}/${id}-thumb.${image.extension}`
  const contentType = image.extension === 'webp' ? 'image/webp' : 'image/jpeg'

  const bucket = getBrowserClient().storage.from('media-private')
  const options = { contentType, cacheControl: '31536000', upsert: false }

  const [full, thumb] = await Promise.all([
    bucket.upload(path, image.full, options),
    bucket.upload(thumbPath, image.thumb, options),
  ])
  if (full.error || thumb.error) {
    await bucket.remove([path, thumbPath])
    throw new MediaError(t.media.failed)
  }

  const result = await registerMedia({
    path,
    thumbPath,
    width: image.width,
    height: image.height,
    bytes: image.full.size,
  })
  if (!result.ok) {
    await bucket.remove([path, thumbPath])
    throw new MediaError(result.error)
  }

  return {
    id: result.data.id,
    src: URL.createObjectURL(image.full),
    width: image.width,
    height: image.height,
    alt: '',
  }
}
