import type { Metadata } from 'next'
import { EmptyState, PageHeader, Panel } from '@/components/ui/misc'
import { siteConfig } from '@/config/site'
import { BranchList } from '@/features/branches/components/branch-list'
import { getPublicBranchTree } from '@/features/branches/queries'
import { attributeStats } from '@/features/branches/tree'
import { getSiteProfile } from '@/features/profile/queries'
import { AttributeRadar } from '@/features/xp/components/attribute-radar'
import { CharacterHero } from '@/features/xp/components/character-hero'
import { t } from '@/i18n/sr'

export const metadata: Metadata = {
  title: t.character.title,
  description: t.character.intro,
  alternates: { canonical: '/lik' },
}

export default async function CharacterPage() {
  const [profile, tree] = await Promise.all([getSiteProfile(), getPublicBranchTree()])
  const name = profile?.displayName ?? siteConfig.author.name

  if (profile && !profile.showStatsPublicly) {
    return (
      <div className="grid gap-8">
        <PageHeader title={t.character.title} />
        <EmptyState title={t.character.hidden} />
      </div>
    )
  }

  return (
    <div className="grid gap-12">
      <CharacterHero name={name} headline={profile?.headline} tree={tree} treeLegend={false}>
        <p className="max-w-prose text-ink-soft">{t.character.intro}</p>
      </CharacterHero>

      {/* dijagram ostaje na ekranu dok se lista grana skroluje */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start">
        <Panel className="md:sticky md:top-6">
          <h2 className="text-2xl font-bold">{t.character.attributes}</h2>
          <AttributeRadar stats={attributeStats(tree)} />
        </Panel>
        <Panel>
          <h2 className="mb-3 text-2xl font-bold">{t.character.branches}</h2>
          {tree.length > 0 ? <BranchList roots={tree} /> : <p className="text-ink-soft">{t.character.noBranches}</p>}
        </Panel>
      </div>
    </div>
  )
}
