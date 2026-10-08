import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { isSupabaseConfigured } from '@/lib/env'
import type { Tables } from '@/lib/supabase/database.types'
import { createPublicClient } from '@/lib/supabase/public'
import type { SessionClient } from '@/lib/supabase/server'

export type Anime = Tables<'anime'>

export const ANIME_STATUS_ORDER = ['watching', 'completed', 'on_hold', 'plan_to_watch', 'dropped'] as const

export async function getPublicAnime(): Promise<Anime[]> {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.anime)
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient()
    .from('anime')
    .select('*')
    .eq('is_public', true)
    .order('mal_updated_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data
}

export async function getPublicAnimeBySlug(slug: string): Promise<Anime | null> {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.anime)
  if (!isSupabaseConfigured()) return null
  const { data, error } = await createPublicClient().from('anime').select('*').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (error) throw error
  return data
}

export async function getOwnerAnime(supabase: SessionClient): Promise<Anime[]> {
  const { data, error } = await supabase.from('anime').select('*').order('mal_updated_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data
}

export async function getOwnerAnimeById(supabase: SessionClient, id: string): Promise<Anime | null> {
  const { data, error } = await supabase.from('anime').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
