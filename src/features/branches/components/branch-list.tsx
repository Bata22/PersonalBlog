import Link from 'next/link'
import { XpBar } from '@/components/ui/misc'
import { t } from '@/i18n/sr'
import { formatNumber, pluralize } from '@/lib/format'
import type { BranchNode } from '../tree'

/**
 * Stablo kao lista (čitljivo na telefonu i za čitače ekrana): nivo, XP i
 * napredak svake grane, sa podgranama uvučenim ispod.
 */
const publicHref = (node: BranchNode) => `/grane/${node.slug}`

export function BranchList({ roots, hrefFor = publicHref }: { roots: BranchNode[]; hrefFor?: (node: BranchNode) => string }) {
  return (
    <ul className="grid gap-2">
      {roots.map((node) => (
        <BranchListItem key={node.id} node={node} hrefFor={hrefFor} />
      ))}
    </ul>
  )
}

function BranchListItem({ node, hrefFor }: { node: BranchNode; hrefFor: (node: BranchNode) => string }) {
  return (
    <li>
      {/* ime i nivo u prvom redu, traka cele širine, pa XP — trake su iste dužine */}
      <Link
        href={hrefFor(node)}
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-sunken"
      >
        <span className="row-span-3 grid size-10 place-items-center rounded-full bg-sunken text-xl" aria-hidden>
          {node.icon}
        </span>
        <span className="truncate font-semibold">{node.name}</span>
        <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
          {t.character.levelShort} {node.level.level}
        </span>
        <XpBar
          progress={node.level.progress}
          label={`${node.name}, ${t.character.level} ${node.level.level}`}
          className="col-span-2 mt-1.5 h-1.5"
        />
        <span className="col-span-2 mt-1 text-xs text-ink-soft tabular-nums">
          {formatNumber(node.totalXp)} XP, {pluralize(node.entryCount, t.character.entries)}
        </span>
      </Link>
      {node.children.length > 0 ? (
        <ul className="ml-8 grid gap-1 border-l border-dashed border-line-strong pl-2">
          {node.children.map((child) => (
            <BranchListItem key={child.id} node={child} hrefFor={hrefFor} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
