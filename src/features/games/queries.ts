import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { isSupabaseConfigured } from '@/lib/env'
import type { Tables } from '@/lib/supabase/database.types'
import { createPublicClient } from '@/lib/supabase/public'
import type { SessionClient } from '@/lib/supabase/server'

export type Game = Tables<'games'>

export const GAME_STATUS_ORDER = ['igram', 'presao', 'zelim', 'odustao'] as const

export async function getPublicGames(): Promise<Game[]> {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.games)
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient()
    .from('games')
    .select('*')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPublicGame(slug: string): Promise<Game | null> {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.games)
  if (!isSupabaseConfigured()) return null
  const { data, error } = await createPublicClient().from('games').select('*').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (error) throw error
  return data
}

export async function getOwnerGames(supabase: SessionClient): Promise<Game[]> {
  const { data, error } = await supabase.from('games').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOwnerGame(supabase: SessionClient, id: string): Promise<Game | null> {
  const { data, error } = await supabase.from('games').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
