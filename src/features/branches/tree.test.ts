import { describe, expect, it } from 'vitest'
import { attributeStats, branchPath, buildBranchTree, characterLevel, flattenTree, type BranchRow } from './tree'

function row(partial: Partial<BranchRow> & Pick<BranchRow, 'id' | 'name'>): BranchRow {
  return {
    owner_id: 'o',
    parent_id: null,
    slug: partial.id,
    description: null,
    icon: '🌱',
    attribute: null,
    entry_kind: 'post',
    role: null,
    focus_note: null,
    position: 0,
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

const rows: BranchRow[] = [
  row({ id: 'sport', name: 'Sport', attribute: 'snaga', position: 1 }),
  row({ id: 'tenis', name: 'Tenis', parent_id: 'sport', position: 2 }),
  row({ id: 'kal', name: 'Kalistenika', parent_id: 'sport', position: 1 }),
  row({ id: 'knjige', name: 'Knjige', attribute: 'intelekt', position: 0 }),
  row({ id: 'izgubljena', name: 'Bez roditelja', parent_id: 'ne-postoji', position: 9 }),
]

describe('stablo grana', () => {
  const tree = buildBranchTree(rows, [
    { branch_id: 'tenis', xp: 60, entry_count: 2, last_on: '2026-10-02' },
    { branch_id: 'kal', xp: 40, entry_count: 1, last_on: '2026-10-05' },
    { branch_id: 'sport', xp: 10, entry_count: 1, last_on: '2026-09-01' },
    { branch_id: 'knjige', xp: 100, entry_count: 1, last_on: '2026-08-01' },
  ])

  it('slaže po redosledu i tretira siročiće kao glavne grane', () => {
    expect(tree.map((n) => n.id)).toEqual(['knjige', 'sport', 'izgubljena'])
    expect(tree[1].children.map((n) => n.id)).toEqual(['kal', 'tenis'])
  })

  it('sabira XP odozdo nagore', () => {
    const sport = tree[1]
    expect(sport.ownXp).toBe(10)
    expect(sport.totalXp).toBe(110)
    expect(sport.entryCount).toBe(4)
    expect(sport.lastOn).toBe('2026-10-05')
  })

  it('podgrane nasleđuju atribut', () => {
    const tenis = flattenTree(tree).find((n) => n.id === 'tenis')
    expect(tenis?.attributeResolved).toBe('snaga')
    expect(tenis && branchPath(tenis)).toBe('Sport › Tenis')
  })

  it('atributi broje svaki XP tačno jednom', () => {
    const stats = attributeStats(tree)
    expect(stats.snaga.xp).toBe(110)
    expect(stats.intelekt.xp).toBe(100)
    expect(characterLevel(tree).xp).toBe(210)
  })
})
