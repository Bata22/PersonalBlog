import type { CSSProperties } from 'react'
import Link from 'next/link'
import { t } from '@/i18n/sr'
import { cn } from '@/lib/cn'
import { ripeness } from '@/features/xp/levels'
import type { BranchNode } from '../tree'
import {
  BADGE_R,
  LABEL_SIZE,
  ORIGIN,
  TRUNK,
  fruitColor,
  layoutTree,
  type Box,
  type FruitLayout,
  type TreeLayout,
} from '../tree-layout'

/**
 * Stablo veština kao limunovo drvo: svaka glavna grana je grana drveta,
 * a limun na njenom kraju sazreva (od zelenog ka žutom) kako raste nivo.
 * Podgrane su grančice sa manjim plodovima. Sve je čist SVG sa linkovima.
 *
 * Na telefonu se crta uži isečak bez natpisa, a imena grana su ispod
 * stabla kao lista (natpisi u SVG-u bi bili presitni).
 */
export function LemonTree({
  roots,
  linkPrefix = '/grane',
  legend = true,
}: {
  roots: BranchNode[]
  linkPrefix?: string
  /** Lista grana ispod stabla na telefonu (isključi ako je spisak grana već na stranici). */
  legend?: boolean
}) {
  const layout = layoutTree(roots)
  const href = (node: BranchNode) => `${linkPrefix}/${node.slug}`
  const showLegend = legend && layout.fruits.length > 0

  return (
    <div>
      <TreeArt layout={layout} box={layout.wide} href={href} labels className="hidden sm:block" />
      <TreeArt layout={layout} box={layout.narrow} href={href} decorative={showLegend} className="sm:hidden" />
      {showLegend ? (
        <ul className="mt-2 flex flex-wrap gap-1.5 sm:hidden" aria-label={t.character.tree}>
          {layout.fruits.map(({ node }) => (
            <li key={node.id}>
              <Link
                href={href(node)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface pr-1 pl-2.5 text-sm font-semibold"
              >
                <span aria-hidden>{node.icon}</span>
                {node.name}
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-btn px-1 text-xs font-extrabold text-btn-ink tabular-nums">
                  <span className="sr-only">{t.character.levelShort}</span>
                  {node.level.level}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

const viewBox = (b: Box) => `${b.minX} ${b.minY} ${b.maxX - b.minX} ${b.maxY - b.minY}`
const delay = (i: number) => ({ ['--i' as string]: i }) as CSSProperties

function TreeArt({
  layout,
  box,
  href,
  labels = false,
  decorative = false,
  className,
}: {
  layout: TreeLayout<BranchNode>
  box: Box
  href: (node: BranchNode) => string
  labels?: boolean
  /** Ista slika postoji i u dostupnom obliku (lista ispod), pa je ova samo ukras. */
  decorative?: boolean
  className?: string
}) {
  const tabIndex = decorative ? -1 : undefined
  return (
    <svg
      viewBox={viewBox(box)}
      className={cn('h-auto w-full', className)}
      role={decorative ? undefined : 'group'}
      aria-label={decorative ? undefined : t.character.tree}
      aria-hidden={decorative || undefined}
    >
      <ellipse cx={0} cy={TRUNK.ground + 2} rx={TRUNK.groundRx} ry={7} fill="var(--sunken)" />
      {layout.fruits.length === 0 ? (
        <Sprout />
      ) : (
        <>
          <Trunk />
          <g fill="var(--leaf)" opacity={0.2}>
            {layout.canopy.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={c.r} />
            ))}
          </g>
        </>
      )}

      {/* prvo sve grane, pa plodovi, da nijedna grana ne pređe preko limuna */}
      {layout.fruits.map((fruit, i) => (
        <Branch key={fruit.node.id} fruit={fruit} index={i} href={href} tabIndex={tabIndex} />
      ))}
      {layout.fruits.map((fruit, i) => (
        <Fruit key={fruit.node.id} fruit={fruit} index={i} href={href} tabIndex={tabIndex} label={labels} />
      ))}
    </svg>
  )
}

function Trunk() {
  const { top, ground } = TRUNK
  return (
    <>
      <path
        d={`M-16,${ground} C-10,${ground - 40} -10,${top + 36} -8,${top + 4} L8,${top + 4} C10,${top + 36} 10,${ground - 40} 16,${ground} Z`}
        fill="var(--bark)"
      />
      <path
        d={`M-16,${ground} C-26,${ground - 2} -34,${ground + 3} -42,${ground + 4} M16,${ground} C28,${ground - 2} 34,${ground + 3} 43,${ground + 4}`}
        stroke="var(--bark)"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    </>
  )
}

/** Prazno stablo: tek izniklo, čeka prvu granu. */
function Sprout() {
  const base = TRUNK.ground
  const tip = base - 46
  return (
    <g>
      <path d={`M0,${base} C-2,${base - 16} 2,${tip + 14} 0,${tip}`} stroke="var(--bark)" strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d={`M0,${tip} q-22,-6 -30,-26 q22,-2 30,26`} fill="var(--unripe)" />
      <path d={`M0,${tip + 6} q20,-4 30,-20 q-22,-4 -30,20`} fill="var(--leaf)" opacity={0.7} />
    </g>
  )
}

type PartProps = {
  fruit: FruitLayout<BranchNode>
  index: number
  href: (node: BranchNode) => string
  tabIndex?: number
}

function Branch({ fruit, index, href, tabIndex }: PartProps) {
  const { center, control, leaves, twigs, node } = fruit
  // jača veština = deblja grana
  const thickness = 4 + Math.min(node.level.level, 15) * 0.25
  return (
    <g>
      <path
        d={`M${ORIGIN.x},${ORIGIN.y} Q${control.x},${control.y} ${center.x},${center.y}`}
        stroke="var(--bark)"
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
      />
      {leaves.map((leaf, k) => (
        <ellipse
          key={k}
          cx={leaf.at.x}
          cy={leaf.at.y}
          rx={8}
          ry={3.6}
          transform={`rotate(${leaf.angle} ${leaf.at.x} ${leaf.at.y})`}
          fill="var(--leaf)"
          opacity={0.42}
        />
      ))}
      {twigs.map((twig, k) => (
        <Link
          key={twig.node.id}
          href={href(twig.node)}
          tabIndex={tabIndex}
          aria-label={t.character.treeLabel(twig.node.name, twig.node.level.level)}
        >
          <line x1={twig.from.x} y1={twig.from.y} x2={twig.to.x} y2={twig.to.y} stroke="var(--bark)" strokeWidth={2.5} strokeLinecap="round" />
          {/* animacija je na <g>, a rotacija na elipsi (inače bi se poništile) */}
          <g className="fruit" style={delay(index + k + 1)}>
            <ellipse
              cx={twig.to.x}
              cy={twig.to.y}
              rx={twig.r * 1.12}
              ry={twig.r}
              transform={`rotate(${twig.angle} ${twig.to.x} ${twig.to.y})`}
              style={{ fill: fruitColor(ripeness(twig.node.level.level)) }}
              stroke="var(--bark)"
              strokeOpacity={0.45}
            />
          </g>
        </Link>
      ))}
    </g>
  )
}

function Fruit({ fruit, index, href, tabIndex, label }: PartProps & { label: boolean }) {
  const { node, center, r, angle, badge } = fruit
  const level = node.level.level
  const color = fruitColor(ripeness(level))
  const tipAngle = (angle * Math.PI) / 180
  const tip = { x: center.x + r * 1.14 * Math.cos(tipAngle), y: center.y + r * 1.14 * Math.sin(tipAngle) }

  return (
    <Link href={href(node)} tabIndex={tabIndex} aria-label={t.character.treeLabel(node.name, level)} className="group/fruit">
      <g className="fruit" style={delay(index)}>
        <ellipse
          cx={center.x}
          cy={center.y}
          rx={r * 1.14}
          ry={r}
          transform={`rotate(${angle} ${center.x} ${center.y})`}
          style={{ fill: color }}
          stroke="var(--bark)"
          strokeOpacity={0.5}
          strokeWidth={1.2}
        />
        <circle cx={tip.x} cy={tip.y} r={2.6} style={{ fill: color }} stroke="var(--bark)" strokeOpacity={0.5} />
        <text x={center.x} y={center.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.95} aria-hidden>
          {node.icon}
        </text>
        <circle cx={badge.x} cy={badge.y} r={BADGE_R} fill="var(--btn-bg)" />
        <text
          x={badge.x}
          y={badge.y + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11.5}
          fontWeight={800}
          fill="var(--btn-fg)"
          aria-hidden
        >
          {level}
        </text>
      </g>
      {label ? (
        <text
          x={fruit.label.x}
          y={fruit.label.y}
          textAnchor={fruit.label.anchor}
          dominantBaseline="central"
          fontSize={LABEL_SIZE}
          fontWeight={650}
          fill="var(--ink)"
          className="font-display group-hover/fruit:underline"
          aria-hidden
        >
          {fruit.label.text}
        </text>
      ) : null}
    </Link>
  )
}
