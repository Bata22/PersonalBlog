import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/env'
import { createSessionClient, type SessionClient } from '@/lib/supabase/server'

export type Viewer = {
  userId: string
  isOwner: boolean
  displayName: string
  supabase: SessionClient
}

/**
 * Ko je prijavljen (jednom po zahtevu). Identitet dolazi iz potpisanog JWT-a
 * (getClaims), a uloga vlasnika iz baze.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured()) return null
  const supabase = await createSessionClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_owner, display_name')
    .eq('id', userId)
    .maybeSingle()

  return {
    userId,
    isOwner: profile?.is_owner ?? false,
    displayName: profile?.display_name ?? '',
    supabase,
  }
})

/** Za admin stranice: ko nije vlasnik, ide na prijavu. */
export async function requireOwner(): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) redirect('/prijava')
  if (!viewer.isOwner) redirect('/prijava?greska=nije-vlasnik')
  return viewer
}

/** Za server akcije: vraća vlasnika ili null (akcija onda vraća grešku). */
export async function ownerOrNull(): Promise<Viewer | null> {
  const viewer = await getViewer()
  return viewer?.isOwner ? viewer : null
}
