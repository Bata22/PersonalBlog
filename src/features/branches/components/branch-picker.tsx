import Link from 'next/link'
import { ENTRY_KINDS } from '@/config/entry-kinds'
import { t } from '@/i18n/sr'
import { newEntryHref } from '../links'
import type { BranchNode } from '../tree'

/**
 * Prvi korak upisa: izbor grane. Glavne grane su velike pločice, a njihove
 * podgrane dugmići ispod — tako se odmah vidi gde ide XP.
 */
export function BranchPicker({ roots }: { roots: BranchNode[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {roots.map((root) => (
        <li key={root.id} className="rounded-[20px] border border-line bg-surface p-3">
          <Link href={newEntryHref(root)} className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-sunken">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-2xl" aria-hidden>
              {root.icon}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg font-bold">{root.name}</span>
              <span className="block text-sm text-ink-soft">
                {root.role ? t.branches.special[root.role] : ENTRY_KINDS[root.entry_kind].label}, {t.character.levelShort}{' '}
                {root.level.level}
              </span>
            </span>
          </Link>
          {root.children.length > 0 ? <ChildChips nodes={root.children} /> : null}
        </li>
      ))}
    </ul>
  )
}

function ChildChips({ nodes }: { nodes: BranchNode[] }) {
  return (
    <ul className="mt-1 flex flex-wrap gap-2 px-2 pb-1">
      {nodes.flatMap((node) => [node, ...node.children]).map((node) => (
        <li key={node.id}>
          <Link
            href={newEntryHref(node)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold transition-colors hover:border-ink"
          >
            <span aria-hidden>{node.icon}</span>
            {node.depth > 1 ? `${node.ancestors.at(-1)?.name} › ${node.name}` : node.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
