import { describe, expect, it } from 'vitest'
import { boxesOverlap, labelBox, layoutTree, MAX_ROOTS, truncateLabel, type Box, type TreeNodeLike } from './tree-layout'

const NAMES = ['Doktorat', 'Projekti', 'Knjige', 'Muzika', 'Sport', 'Planinarenje', 'Odmor', 'Igre', 'Anime', 'Dnevnik', 'ESP32 platforma', 'Fotografija']

type Node = TreeNodeLike & { children: Node[] }

function node(i: number, level: number, children: Node[] = []): Node {
  return { id: `n${i}`, slug: `s${i}`, name: NAMES[i % NAMES.length], icon: '🍋', level: { level }, children }
}

function roots(count: number): Node[] {
  return Array.from({ length: count }, (_, i) =>
    node(i, 1 + ((i * 7) % 20), [node(100 + i, 3), node(200 + i, 8)]),
  )
}

const fruitBox = (c: { x: number; y: number }, r: number): Box => ({
  minX: c.x - r * 1.14,
  maxX: c.x + r * 1.14,
  minY: c.y - r * 1.14,
  maxY: c.y + r * 1.14,
})

const inside = (inner: Box, outer: Box) =>
  inner.minX >= outer.minX && inner.maxX <= outer.maxX && inner.minY >= outer.minY && inner.maxY <= outer.maxY

describe('layoutTree', () => {
  it('crta najviše MAX_ROOTS glavnih grana', () => {
    expect(layoutTree(roots(MAX_ROOTS + 3)).fruits).toHaveLength(MAX_ROOTS)
    expect(layoutTree([]).fruits).toHaveLength(0)
  })

  for (let count = 1; count <= MAX_ROOTS; count++) {
    it(`${count} grana: plodovi i natpisi se ne preklapaju i staju u okvir`, () => {
      const { fruits, wide, narrow } = layoutTree(roots(count))
      const labels = fruits.map((f) => labelBox(f.label))
      const bodies = fruits.map((f) => fruitBox(f.center, f.r))
      const problems: string[] = []

      for (let a = 0; a < fruits.length; a++) {
        if (!inside(labels[a], wide)) problems.push(`natpis ${a} van okvira`)
        if (!inside(bodies[a], narrow)) problems.push(`plod ${a} van uskog okvira`)
        for (let b = 0; b < fruits.length; b++) {
          if (a === b) continue
          const gap = Math.hypot(fruits[a].center.x - fruits[b].center.x, fruits[a].center.y - fruits[b].center.y)
          if (b > a && boxesOverlap(labels[a], labels[b])) problems.push(`natpisi ${a} i ${b}`)
          if (b > a && gap < 1.14 * (fruits[a].r + fruits[b].r)) problems.push(`plodovi ${a} i ${b}`)
          if (boxesOverlap(labels[a], bodies[b])) problems.push(`natpis ${a} preko ploda ${b}`)
        }
      }
      expect(problems).toEqual([])
    })
  }

  it('skraćuje predugačka imena', () => {
    expect(truncateLabel('Kratko')).toBe('Kratko')
    expect(truncateLabel('Veoma dugačko ime grane')).toBe('Veoma dugačk…')
  })
})
