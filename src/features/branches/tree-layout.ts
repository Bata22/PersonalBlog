/**
 * Geometrija limunovog drveta, bez React-a (da bi se lako testirala).
 * Jedinice su SVG jedinice; (0, 0) je središte krošnje, y raste naniže.
 *
 * Glavne grane su raspoređene po luku krošnje, svaka sa limunom na kraju.
 * Natpisi idu ka spolja (levo, desno ili iznad ploda), pa se ne preklapaju
 * sa granama; ako se dva natpisa ipak dodiruju, razmaknu se po visini.
 */

export type Point = { x: number; y: number }
export type Box = { minX: number; minY: number; maxX: number; maxY: number }
export type Anchor = 'start' | 'middle' | 'end'

export type TreeNodeLike = {
  id: string
  slug: string
  name: string
  icon: string
  level: { level: number }
}

export type TwigLayout<N> = { node: N; from: Point; to: Point; r: number; angle: number }

export type LabelLayout = { x: number; y: number; anchor: Anchor; text: string }

export type FruitLayout<N> = {
  node: N
  /** Ugao od središta krošnje, u stepenima (180 = levo, 270 = gore, 360 = desno). */
  angle: number
  center: Point
  r: number
  /** Kontrolna tačka krive grane (od vrha debla do ploda). */
  control: Point
  badge: Point
  label: LabelLayout
  leaves: { at: Point; angle: number }[]
  twigs: TwigLayout<N>[]
}

export type TreeLayout<N> = {
  fruits: FruitLayout<N>[]
  /** Krošnja: krugovi iste boje koji zajedno daju oblak lišća. */
  canopy: (Point & { r: number })[]
  /** Okvir sa natpisima (širi ekrani). */
  wide: Box
  /** Okvir bez natpisa (telefon: natpisi su ispod stabla, kao lista). */
  narrow: Box
}

export const CROWN = { rx: 170, ry: 156 }
export const TRUNK = { top: 26, ground: 150, groundRx: 128 }
export const ORIGIN: Point = { x: 0, y: TRUNK.top }
export const BADGE_R = 10
export const LABEL_SIZE = 15
export const MAX_ROOTS = 12
const MAX_TWIGS = 3
const CANOPY_ANGLES = [190, 213, 236, 259, 281, 304, 327, 350]
const LABEL_CHARS = 13
/** Procena prosečne širine slova (u em) za natpise, sa malom rezervom. */
const CHAR_WIDTH = 0.6

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/** Tačka na grani (kvadratna kriva od vrha debla do ploda). */
export function pointOnBranch(control: Point, end: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * ORIGIN.x + 2 * u * t * control.x + t * t * end.x,
    y: u * u * ORIGIN.y + 2 * u * t * control.y + t * t * end.y,
  }
}

function branchDirection(control: Point, end: Point, t: number): number {
  const dx = 2 * (1 - t) * (control.x - ORIGIN.x) + 2 * t * (end.x - control.x)
  const dy = 2 * (1 - t) * (control.y - ORIGIN.y) + 2 * t * (end.y - control.y)
  return toDeg(Math.atan2(dy, dx))
}

function move(from: Point, angleDeg: number, distance: number): Point {
  const a = toRad(angleDeg)
  return { x: from.x + distance * Math.cos(a), y: from.y + distance * Math.sin(a) }
}

export function truncateLabel(text: string, max = LABEL_CHARS) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export function labelBox(label: LabelLayout): Box {
  const width = label.text.length * LABEL_SIZE * CHAR_WIDTH
  const minX = label.anchor === 'start' ? label.x : label.anchor === 'end' ? label.x - width : label.x - width / 2
  return { minX, maxX: minX + width, minY: label.y - LABEL_SIZE * 0.6, maxY: label.y + LABEL_SIZE * 0.6 }
}

export function boxesOverlap(a: Box, b: Box) {
  return a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY
}

function circleBox(c: Point, r: number): Box {
  return { minX: c.x - r, maxX: c.x + r, minY: c.y - r, maxY: c.y + r }
}

function unionBox(boxes: Box[], pad: number): Box {
  return {
    minX: Math.min(...boxes.map((b) => b.minX)) - pad,
    minY: Math.min(...boxes.map((b) => b.minY)) - pad,
    maxX: Math.max(...boxes.map((b) => b.maxX)) + pad,
    maxY: Math.max(...boxes.map((b) => b.maxY)) + pad,
  }
}

/** Natpis ide od ploda ka spolja: sa strane za bočne grane, iznad za gornje. */
function placeLabel(text: string, center: Point, r: number, cos: number): LabelLayout {
  if (Math.abs(cos) >= 0.42) {
    const dir = cos < 0 ? -1 : 1
    return { x: center.x + dir * (r * 1.14 + 8), y: center.y, anchor: dir < 0 ? 'end' : 'start', text }
  }
  const anchor: Anchor = cos < -0.12 ? 'end' : cos > 0.12 ? 'start' : 'middle'
  const x = anchor === 'end' ? center.x + r * 0.5 : anchor === 'start' ? center.x - r * 0.5 : center.x
  return { x, y: center.y - r - BADGE_R - 7, anchor, text }
}

/**
 * Razmiče natpise po visini: natpis koji zalazi u tuđi plod pomera se od njega,
 * a od dva natpisa koji se preklapaju gornji ide naviše, donji naniže.
 */
function separateLabels(labels: LabelLayout[], bodies: Box[]) {
  for (let pass = 0; pass < 40; pass++) {
    let moved = false
    for (let a = 0; a < labels.length; a++) {
      for (let b = 0; b < bodies.length; b++) {
        const box = labelBox(labels[a])
        if (a === b || !boxesOverlap(box, bodies[b])) continue
        const bodyMid = (bodies[b].minY + bodies[b].maxY) / 2
        labels[a].y += labels[a].y < bodyMid ? bodies[b].minY - box.maxY - 0.5 : bodies[b].maxY - box.minY + 0.5
        moved = true
      }
      for (let b = a + 1; b < labels.length; b++) {
        const boxA = labelBox(labels[a])
        const boxB = labelBox(labels[b])
        if (!boxesOverlap(boxA, boxB)) continue
        const push = (Math.min(boxA.maxY, boxB.maxY) - Math.max(boxA.minY, boxB.minY)) / 2 + 0.5
        const [upper, lower] = labels[a].y <= labels[b].y ? [labels[a], labels[b]] : [labels[b], labels[a]]
        upper.y -= push
        lower.y += push
        moved = true
      }
    }
    if (!moved) return
  }
}

export function layoutTree<N extends TreeNodeLike & { children: N[] }>(roots: N[]): TreeLayout<N> {
  const shown = roots.slice(0, MAX_ROOTS)
  const count = shown.length
  // Što je više grana, to je luk širi (najviše 164°) i plodovi manji.
  const spread = count <= 1 ? 0 : Math.min(164, 44 * (count - 1))
  const step = count <= 1 ? 0 : spread / (count - 1)
  const spacing = count <= 1 ? Infinity : ((CROWN.rx + CROWN.ry) / 2) * toRad(step)
  const maxR = Math.min(23, spacing * 0.4)

  const fruits: FruitLayout<N>[] = shown.map((node, i) => {
    const angle = count === 1 ? 270 : 270 - spread / 2 + i * step
    const cos = Math.cos(toRad(angle))
    const center = { x: CROWN.rx * cos, y: CROWN.ry * Math.sin(toRad(angle)) }
    const level = node.level.level
    const r = maxR * (0.74 + (0.26 * Math.min(level, 20)) / 20)
    // grana prvo raste naviše, pa se širi u stranu
    const control = { x: center.x * 0.2, y: ORIGIN.y + (center.y - ORIGIN.y) * 0.88 }

    const leafCount = 1 + Math.min(3, Math.floor((level - 1) / 3))
    const leaves = Array.from({ length: leafCount }, (_, k) => {
      const t = 0.3 + k * 0.15
      const side = k % 2 === 0 ? 1 : -1
      const along = branchDirection(control, center, t)
      return { at: move(pointOnBranch(control, center, t), along + side * 90, 6.5), angle: along + side * 50 }
    })

    const twigs = node.children.slice(0, MAX_TWIGS).map((child, k) => {
      const t = 0.5 + k * 0.13
      const from = pointOnBranch(control, center, t)
      const twigAngle = branchDirection(control, center, t) + (k % 2 === 0 ? -40 : 40)
      return {
        node: child,
        from,
        to: move(from, twigAngle, 20),
        r: 5 + Math.min(child.level.level, 10) * 0.3,
        angle: twigAngle,
      }
    })

    return {
      node,
      angle,
      center,
      r,
      control,
      badge: { x: center.x + r * 0.82, y: center.y - r * 0.82 },
      label: placeLabel(truncateLabel(node.name), center, r, cos),
      leaves,
      twigs,
    }
  })

  separateLabels(
    fruits.map((f) => f.label),
    fruits.map((f) => circleBox(f.center, f.r * 1.14)),
  )

  // Krošnja je uvek puna, bez obzira na broj grana: drvo sa malo limunova je i dalje drvo.
  const canopy =
    count === 0
      ? []
      : [
          { x: 0, y: -CROWN.ry * 0.35, r: CROWN.ry * 0.62 },
          ...CANOPY_ANGLES.map((angle) => ({
            x: CROWN.rx * 0.66 * Math.cos(toRad(angle)),
            y: CROWN.ry * 0.66 * Math.sin(toRad(angle)),
            r: 60,
          })),
        ]

  const ground: Box = { minX: -TRUNK.groundRx, maxX: TRUNK.groundRx, minY: TRUNK.top, maxY: TRUNK.ground + 8 }
  // prazno stablo: izdanak pri dnu, a iznad prostor u koji će drvo da poraste
  const sky: Box = { minX: -CROWN.rx, maxX: CROWN.rx, minY: -CROWN.ry * 0.4, maxY: TRUNK.ground }
  const artBoxes = [
    ...canopy.map((c) => circleBox(c, c.r)),
    ...fruits.flatMap((f) => [
      circleBox(f.center, f.r * 1.14 + 3),
      circleBox(f.badge, BADGE_R),
      ...f.twigs.map((tw) => circleBox(tw.to, tw.r * 1.15)),
    ]),
  ]
  const narrow = unionBox([ground, ...(count === 0 ? [sky] : artBoxes)], 12)
  const wide = unionBox([narrow, ...fruits.map((f) => labelBox(f.label))], 10)

  return { fruits, canopy, wide, narrow }
}

export const fruitColor = (ripeness: number) =>
  `color-mix(in oklab, var(--ripe) ${Math.round(ripeness * 100)}%, var(--unripe))`
