import type { ReactNode } from 'react'
import { LemonTree } from '@/features/branches/components/lemon-tree'
import { attributeStats, characterLevel, strongestAttribute, type BranchNode } from '@/features/branches/tree'
import { CharacterCard } from './character-card'

/**
 * Glavni prizor sajta: limunovo stablo na tačkastom papiru i karta lika.
 * Na telefonu prvo ime i nivo, pa stablo.
 */
export function CharacterHero({
  name,
  headline,
  tree,
  treeLinkPrefix,
  treeLegend = true,
  children,
}: {
  name: string
  headline?: string | null
  tree: BranchNode[]
  treeLinkPrefix?: string
  /** Imena grana ispod stabla na telefonu; isključi kad je spisak grana već na stranici. */
  treeLegend?: boolean
  children?: ReactNode
}) {
  const stats = attributeStats(tree)
  return (
    <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12">
      <div className="dot-paper order-2 rounded-[28px] border border-line p-3 sm:p-6 md:order-1">
        <LemonTree roots={tree} linkPrefix={treeLinkPrefix} legend={treeLegend} />
      </div>
      <div className="order-1 grid gap-6 md:order-2">
        <CharacterCard name={name} headline={headline} level={characterLevel(tree)} strongest={strongestAttribute(stats)} />
        {children}
      </div>
    </section>
  )
}
