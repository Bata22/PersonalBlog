import { t } from '@/i18n/sr'

/**
 * Smanjuje sliku u pregledaču pre slanja: telefon šalje ~300 KB umesto 5 MB,
 * a Storage od 1 GB traje hiljadama slika. Pravi i malu sličicu za liste.
 */

const MAX_INPUT_BYTES = 30 * 1024 * 1024
const FULL = { maxSide: 1920, quality: 0.82 }
const THUMB = { maxSide: 560, quality: 0.76 }

export class MediaError extends Error {}

export type CompressedImage = {
  full: Blob
  thumb: Blob
  width: number
  height: number
  extension: 'webp' | 'jpg'
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

async function encode(bitmap: ImageBitmap, { maxSide, quality }: { maxSide: number; quality: number }, preferWebp: boolean) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new MediaError(t.media.failed)
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)

  // Neki pregledači (stariji Safari) ne umeju WebP pa vrate PNG — tada JPEG.
  let blob = preferWebp ? await toBlob(canvas, 'image/webp', quality) : null
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
  if (!blob) throw new MediaError(t.media.failed)
  return { blob, width, height }
}

export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) throw new MediaError(t.media.notImage)
  if (file.size > MAX_INPUT_BYTES) throw new MediaError(t.media.tooLarge)

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new MediaError(t.media.notImage)
  }

  try {
    const full = await encode(bitmap, FULL, true)
    const extension = full.blob.type === 'image/webp' ? 'webp' : 'jpg'
    const thumb = await encode(bitmap, THUMB, extension === 'webp')
    return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height, extension }
  } finally {
    bitmap.close()
  }
}
