import { cacheLife, cacheTag } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { isSupabaseConfigured } from '@/lib/env'
import type { Database } from '@/lib/supabase/database.types'
import { createPublicClient } from '@/lib/supabase/public'
import { buildBranchTree, flattenTree, type BranchNode } from './tree'

type Client = SupabaseClient<Database>

/** Grane + XP po grani → stablo. Isto i za javni deo i za admin. */
export async function loadBranchTree(supabase: Client): Promise<BranchNode[]> {
  const [branches, xp] = await Promise.all([
    supabase.from('branches').select('*'),
    supabase.rpc('xp_by_branch'),
  ])
  if (branches.error) throw branches.error
  if (xp.error) throw xp.error
  return buildBranchTree(branches.data, xp.data)
}

/** Javno stablo (keširano; osvežava se kad se promeni grana ili XP). */
export async function getPublicBranchTree(): Promise<BranchNode[]> {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.branches, CACHE_TAGS.xp)
  if (!isSupabaseConfigured()) return []
  return loadBranchTree(createPublicClient())
}

export async function getPublicBranch(slug: string): Promise<BranchNode | null> {
  const tree = await getPublicBranchTree()
  return flattenTree(tree).find((node) => node.slug === slug) ?? null
}

/** Id grane i svih njenih podgrana (za upite "upisi u ovoj grani"). */
export function subtreeIds(node: BranchNode): string[] {
  return flattenTree([node]).map((n) => n.id)
}
