import { ATTRIBUTE_IDS, type AttributeId } from '@/config/attributes'
import { LEVEL_CURVES } from '@/config/xp'
import type { Tables } from '@/lib/supabase/database.types'
import { levelFromXp, type LevelInfo } from '@/features/xp/levels'

export type BranchRow = Tables<'branches'>

export type BranchXp = {
  branch_id: string
  xp: number
  entry_count: number
  last_on: string | null
}

export type BranchNode = BranchRow & {
  children: BranchNode[]
  depth: number
  /** Preci od korena do ove grane (bez nje). */
  ancestors: BranchRow[]
  /** XP samo iz upisa direktno u ovoj grani. */
  ownXp: number
  /** XP ove grane i svih podgrana. */
  totalXp: number
  entryCount: number
  lastOn: string | null
  attributeResolved: AttributeId | null
  level: LevelInfo
}

const byPosition = (a: BranchRow, b: BranchRow) =>
  a.position - b.position || a.name.localeCompare(b.name, 'sr')

/**
 * Pravi stablo od ravne liste grana i sabira XP odozdo nagore.
 * Grana čiji roditelj ne postoji tretira se kao glavna grana.
 */
export function buildBranchTree(rows: BranchRow[], xpRows: BranchXp[] = []): BranchNode[] {
  const xpById = new Map(xpRows.map((r) => [r.branch_id, r]))
  const ids = new Set(rows.map((r) => r.id))
  const childrenOf = new Map<string | null, BranchRow[]>()

  for (const row of rows) {
    const parent = row.parent_id && ids.has(row.parent_id) ? row.parent_id : null
    const list = childrenOf.get(parent) ?? []
    list.push(row)
    childrenOf.set(parent, list)
  }

  const visit = (
    row: BranchRow,
    ancestors: BranchRow[],
    inheritedAttribute: AttributeId | null,
    seen: Set<string>,
  ): BranchNode => {
    seen.add(row.id)
    const attributeResolved = row.attribute ?? inheritedAttribute
    const children = (childrenOf.get(row.id) ?? [])
      .filter((child) => !seen.has(child.id))
      .sort(byPosition)
      .map((child) => visit(child, [...ancestors, row], attributeResolved, seen))

    const own = xpById.get(row.id)
    const ownXp = Number(own?.xp ?? 0)
    const totalXp = ownXp + children.reduce((sum, c) => sum + c.totalXp, 0)
    const entryCount =
      Number(own?.entry_count ?? 0) + children.reduce((sum, c) => sum + c.entryCount, 0)
    const lastOn = [own?.last_on ?? null, ...children.map((c) => c.lastOn)]
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? null

    return {
      ...row,
      children,
      depth: ancestors.length,
      ancestors,
      ownXp,
      totalXp,
      entryCount,
      lastOn,
      attributeResolved,
      level: levelFromXp(totalXp, LEVEL_CURVES.branch),
    }
  }

  const seen = new Set<string>()
  return (childrenOf.get(null) ?? []).sort(byPosition).map((root) => visit(root, [], null, seen))
}

/** Sve grane redom (roditelj pa deca), za liste i padajuće menije. */
export function flattenTree(roots: BranchNode[]): BranchNode[] {
  const out: BranchNode[] = []
  const walk = (nodes: BranchNode[]) => {
    for (const node of nodes) {
      out.push(node)
      walk(node.children)
    }
  }
  walk(roots)
  return out
}

export function findBranch(roots: BranchNode[], predicate: (node: BranchNode) => boolean) {
  return flattenTree(roots).find(predicate) ?? null
}

/** "Sport › Tenis" */
export function branchPath(node: Pick<BranchNode, 'ancestors' | 'name'>, separator = ' › '): string {
  return [...node.ancestors.map((a) => a.name), node.name].join(separator)
}

/** XP i nivo po atributu. Svaki XP se računa tačno jednom (po grani u kojoj je upis). */
export function attributeStats(roots: BranchNode[]): Record<AttributeId, LevelInfo> {
  const totals = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, 0])) as Record<AttributeId, number>
  for (const node of flattenTree(roots)) {
    if (node.attributeResolved) totals[node.attributeResolved] += node.ownXp
  }
  return Object.fromEntries(
    ATTRIBUTE_IDS.map((id) => [id, levelFromXp(totals[id], LEVEL_CURVES.attribute)]),
  ) as Record<AttributeId, LevelInfo>
}

export function characterLevel(roots: BranchNode[]): LevelInfo {
  const total = roots.reduce((sum, r) => sum + r.totalXp, 0)
  return levelFromXp(total, LEVEL_CURVES.character)
}

/** Titula lika po najjačem atributu ("Mag", "Ratnik"...). */
export function strongestAttribute(stats: Record<AttributeId, LevelInfo>): AttributeId | null {
  let best: AttributeId | null = null
  for (const id of ATTRIBUTE_IDS) {
    if (stats[id].xp > 0 && (!best || stats[id].xp > stats[best].xp)) best = id
  }
  return best
}

export type BranchInfo = { id: string; slug: string; name: string; icon: string; path: string; role: BranchRow['role'] }
export type BranchIndex = Record<string, BranchInfo>

/** Brz pristup podacima o grani po id-ju (za kartice upisa). */
export function indexBranches(roots: BranchNode[]): BranchIndex {
  const index: BranchIndex = {}
  for (const node of flattenTree(roots)) {
    index[node.id] = { id: node.id, slug: node.slug, name: node.name, icon: node.icon, path: branchPath(node), role: node.role }
  }
  return index
}
