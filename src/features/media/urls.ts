import { publicEnv } from '@/lib/env'

/** Adresa fajla iz javnog bucketa (ne treba poziv ka Supabase-u). */
export function publicStorageUrl(path: string): string {
  const { supabaseUrl } = publicEnv()
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${supabaseUrl}/storage/v1/object/public/media-public/${encoded}`
}
