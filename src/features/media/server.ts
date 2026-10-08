import 'server-only'
import type { SessionClient } from '@/lib/supabase/server'
import type { MediaBucket, MediaRef, ResolvedMedia } from './types'
import { publicStorageUrl } from './urls'

const SIGNED_URL_TTL = 60 * 60 // 1 sat

/**
 * Pretvara redove iz tabele media u adrese za prikaz.
 * Javne slike dobijaju stalnu CDN adresu; privatne potpisanu (samo vlasniku).
 */
export async function resolveMedia(
  rows: MediaRef[],
  supabase?: SessionClient,
): Promise<Record<string, ResolvedMedia>> {
  const out: Record<string, ResolvedMedia> = {}
  const privateRows: MediaRef[] = []

  for (const row of rows) {
    if (row.bucket === 'media-public') {
      out[row.id] = {
        id: row.id,
        src: publicStorageUrl(row.path),
        thumb: publicStorageUrl(row.thumb_path),
        width: row.width,
        height: row.height,
        alt: row.alt,
      }
    } else {
      privateRows.push(row)
    }
  }

  if (supabase && privateRows.length > 0) {
    const paths = privateRows.flatMap((r) => [r.path, r.thumb_path])
    const { data } = await supabase.storage.from('media-private').createSignedUrls(paths, SIGNED_URL_TTL)
    const signed = new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
    for (const row of privateRows) {
      const src = signed.get(row.path)
      if (!src) continue
      out[row.id] = {
        id: row.id,
        src,
        thumb: signed.get(row.thumb_path) ?? src,
        width: row.width,
        height: row.height,
        alt: row.alt,
      }
    }
  }

  return out
}

type StoredMedia = Pick<MediaRef, 'id' | 'bucket' | 'path' | 'thumb_path'>

/** Briše fajlove iz Storage-a, pa redove iz baze. */
export async function removeMedia(supabase: SessionClient, rows: StoredMedia[]) {
  if (rows.length === 0) return
  const byBucket = new Map<MediaBucket, string[]>()
  for (const row of rows) {
    const list = byBucket.get(row.bucket) ?? []
    list.push(row.path, row.thumb_path)
    byBucket.set(row.bucket, list)
  }
  for (const [bucket, paths] of byBucket) {
    await supabase.storage.from(bucket).remove(paths)
  }
  const { error } = await supabase.from('media').delete().in('id', rows.map((r) => r.id))
  if (error) throw error
}

async function moveRow(supabase: SessionClient, row: StoredMedia, target: MediaBucket) {
  const storage = supabase.storage.from(row.bucket)
  const first = await storage.move(row.thumb_path, row.thumb_path, { destinationBucket: target })
  if (first.error) throw first.error
  const second = await storage.move(row.path, row.path, { destinationBucket: target })
  if (second.error) {
    // vrati sličicu nazad da fajlovi i baza ostanu usklađeni
    await supabase.storage.from(target).move(row.thumb_path, row.thumb_path, { destinationBucket: row.bucket })
    throw second.error
  }
}

/**
 * Usklađuje slike upisa posle čuvanja:
 *  - povezuje nove slike sa upisom i pamti redosled i opise,
 *  - briše slike koje su uklonjene iz upisa,
 *  - premešta fajlove u javni ili privatni bucket prema vidljivosti upisa.
 */
export async function syncEntryMedia(params: {
  supabase: SessionClient
  ownerId: string
  entryId: string
  mediaIds: string[]
  alts?: Record<string, string>
  isPublic: boolean
}) {
  const { supabase, ownerId, entryId, mediaIds, alts = {}, isPublic } = params
  const target: MediaBucket = isPublic ? 'media-public' : 'media-private'
  const select = 'id, bucket, path, thumb_path, entry_id'

  const { data: current, error } = await supabase.from('media').select(select).eq('entry_id', entryId)
  if (error) throw error

  let attached: typeof current = []
  if (mediaIds.length > 0) {
    const res = await supabase
      .from('media')
      .select(select)
      .in('id', mediaIds)
      .eq('owner_id', ownerId)
      .or(`entry_id.is.null,entry_id.eq.${entryId}`)
    if (res.error) throw res.error
    attached = res.data
  }

  const keep = new Set(mediaIds)
  await removeMedia(
    supabase,
    current.filter((row) => !keep.has(row.id)),
  )

  const byId = new Map([...current, ...attached].map((row) => [row.id, row]))
  await Promise.all(
    mediaIds.map(async (id, position) => {
      const row = byId.get(id)
      if (!row) return
      if (row.bucket !== target) await moveRow(supabase, row, target)
      const alt = alts[id]?.trim()
      const { error: updateError } = await supabase
        .from('media')
        .update({ entry_id: entryId, position, bucket: target, ...(alt !== undefined ? { alt: alt || null } : {}) })
        .eq('id', id)
      if (updateError) throw updateError
    }),
  )
}

/** Briše sve slike jednog upisa (pre brisanja upisa). */
export async function removeEntryMedia(supabase: SessionClient, entryId: string) {
  const { data, error } = await supabase.from('media').select('id, bucket, path, thumb_path').eq('entry_id', entryId)
  if (error) throw error
  await removeMedia(supabase, data)
}
