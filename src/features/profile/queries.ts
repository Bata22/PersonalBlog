import { cacheLife, cacheTag } from 'next/cache'
import { siteConfig } from '@/config/site'
import { publicStorageUrl } from '@/features/media/urls'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { isSupabaseConfigured } from '@/lib/env'
import type { Tables } from '@/lib/supabase/database.types'
import { createPublicClient } from '@/lib/supabase/public'
import type { SessionClient } from '@/lib/supabase/server'

export type SiteProfile = {
  id: string
  displayName: string
  headline: string | null
  bio: string | null
  avatarUrl: string | null
  showStatsPublicly: boolean
  malUsername: string | null
  reminderEnabled: boolean
  reminderHour: number
  timezone: string
}

export function toSiteProfile(row: Tables<'profiles'>): SiteProfile {
  return {
    id: row.id,
    displayName: row.display_name || siteConfig.author.name,
    headline: row.headline,
    bio: row.bio,
    avatarUrl: row.avatar_path ? publicStorageUrl(row.avatar_path) : null,
    showStatsPublicly: row.show_stats_publicly,
    malUsername: row.mal_username,
    reminderEnabled: row.reminder_enabled,
    reminderHour: row.reminder_hour,
    timezone: row.timezone,
  }
}

/** Profil vlasnika za javne stranice (keširan). */
export async function getSiteProfile(): Promise<SiteProfile | null> {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.profile)
  if (!isSupabaseConfigured()) return null

  const { data, error } = await createPublicClient().from('profiles').select('*').eq('is_owner', true).maybeSingle()
  if (error) throw error
  return data ? toSiteProfile(data) : null
}

export async function getOwnerProfile(supabase: SessionClient, userId: string): Promise<SiteProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data ? toSiteProfile(data) : null
}
