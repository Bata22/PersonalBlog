import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { isSupabaseConfigured } from '@/lib/env'
import type { Tables } from '@/lib/supabase/database.types'
import { createPublicClient } from '@/lib/supabase/public'
import type { SessionClient } from '@/lib/supabase/server'

export type Book = Tables<'books'>

export const BOOK_STATUS_ORDER = ['citam', 'procitano', 'zelim', 'odustao'] as const

export async function getPublicBooks(): Promise<Book[]> {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.books)
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient()
    .from('books')
    .select('*')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPublicBook(slug: string): Promise<Book | null> {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.books)
  if (!isSupabaseConfigured()) return null
  const { data, error } = await createPublicClient().from('books').select('*').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (error) throw error
  return data
}

export async function getOwnerBooks(supabase: SessionClient): Promise<Book[]> {
  const { data, error } = await supabase.from('books').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOwnerBook(supabase: SessionClient, id: string): Promise<Book | null> {
  const { data, error } = await supabase.from('books').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
