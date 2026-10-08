import type { Tables } from '@/lib/supabase/database.types'

export type MediaBucket = Tables<'media'>['bucket']

/** Ono što se čita uz upis (embed iz tabele media). */
export type MediaRef = Pick<
  Tables<'media'>,
  'id' | 'bucket' | 'path' | 'thumb_path' | 'width' | 'height' | 'alt' | 'position'
>

/** Slika spremna za prikaz: adrese su već izračunate (javne ili potpisane). */
export type ResolvedMedia = {
  id: string
  src: string
  thumb: string
  width: number
  height: number
  alt: string | null
}

/** Stavka u formularu dok pišeš upis. */
export type DraftMedia = {
  id: string
  src: string
  width: number
  height: number
  alt: string
}

export const MEDIA_SELECT = 'id, bucket, path, thumb_path, width, height, alt, position'
export const MAX_MEDIA_PER_ENTRY = 24

/** Putanja okačenog fajla: "<vlasnik>/<uuid>.webp" ili "...-thumb.webp". */
export const MEDIA_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}(-thumb)?\.(webp|jpg)$/
