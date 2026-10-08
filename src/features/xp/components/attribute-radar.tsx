import { ATTRIBUTE_IDS, ATTRIBUTES, type AttributeId } from '@/config/attributes'
import { t } from '@/i18n/sr'
import type { LevelInfo } from '../levels'

// široko zbog natpisa sa strane ("Kreativnost 12" mora da stane)
const SIZE = { width: 420, height: 310 }
const CENTER = { x: 210, y: 160 }
const RADIUS = 104

function vertex(index: number, scale: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / ATTRIBUTE_IDS.length
  return { x: CENTER.x + Math.cos(angle) * RADIUS * scale, y: CENTER.y + Math.sin(angle) * RADIUS * scale }
}

const points = (scales: number[]) =>
  scales.map((s, i) => vertex(i, s)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

/** Petougaoni dijagram atributa; dužina temena = nivo atributa. */
export function AttributeRadar({ stats }: { stats: Record<AttributeId, LevelInfo> }) {
  const levels = ATTRIBUTE_IDS.map((id) => stats[id].level)
  const max = Math.max(5, ...levels)
  const scales = levels.map((level) => Math.max(0.08, level / max))

  return (
    <figure>
      <svg viewBox={`0 0 ${SIZE.width} ${SIZE.height}`} className="h-auto w-full" role="img">
        <title>
          {ATTRIBUTE_IDS.map((id) => `${ATTRIBUTES[id].label} ${stats[id].level}`).join(', ')}
        </title>
        {[1, 0.66, 0.33].map((ring) => (
          <polygon key={ring} points={points(ATTRIBUTE_IDS.map(() => ring))} fill="none" stroke="var(--line)" strokeWidth={1} />
        ))}
        {ATTRIBUTE_IDS.map((id, i) => {
          const end = vertex(i, 1)
          return <line key={id} x1={CENTER.x} y1={CENTER.y} x2={end.x} y2={end.y} stroke="var(--line)" strokeWidth={1} />
        })}
        <polygon points={points(scales)} fill="var(--accent)" fillOpacity={0.75} stroke="var(--leaf)" strokeWidth={2} strokeLinejoin="round" />
        {ATTRIBUTE_IDS.map((id, i) => {
          const p = vertex(i, 1.24)
          const anchor = Math.abs(p.x - CENTER.x) < 10 ? 'middle' : p.x < CENTER.x ? 'end' : 'start'
          return (
            <text key={id} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="central" fill="var(--ink)">
              <tspan fontSize={12.5} fontWeight={650}>
                {ATTRIBUTES[id].label}
              </tspan>
              <tspan fontSize={12.5} fill="var(--ink-soft)" dx={5}>
                {stats[id].level}
              </tspan>
            </text>
          )
        })}
      </svg>
      <figcaption className="sr-only">{t.character.attributes}</figcaption>
    </figure>
  )
}
