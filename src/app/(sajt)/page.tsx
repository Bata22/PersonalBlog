import { LinkButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { siteConfig } from '@/config/site'
import { getPublicBranchTree } from '@/features/branches/queries'
import { indexBranches } from '@/features/branches/tree'
import { EntryFeed } from '@/features/entries/components/entry-feed'
import { getPublicFeed } from '@/features/entries/queries'
import { getSiteProfile } from '@/features/profile/queries'
import { JsonLd, personJsonLd, websiteJsonLd } from '@/features/seo/json-ld'
import { CharacterHero } from '@/features/xp/components/character-hero'
import { t } from '@/i18n/sr'

export default async function HomePage() {
  const [profile, tree, feed] = await Promise.all([
    getSiteProfile(),
    getPublicBranchTree(),
    getPublicFeed({ pageSize: 6 }),
  ])
  const name = profile?.displayName ?? siteConfig.author.name
  const showStats = profile?.showStatsPublicly ?? true

  return (
    <>
      <JsonLd data={[websiteJsonLd(), personJsonLd({ name, description: profile?.headline, image: profile?.avatarUrl })]} />

      {showStats ? (
        <CharacterHero name={name} headline={profile?.headline} tree={tree}>
          {profile?.bio ? <p className="max-w-prose whitespace-pre-line text-ink-soft">{profile.bio}</p> : null}
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/lik">{t.nav.character}</LinkButton>
            <LinkButton href="/objave" variant="secondary">
              {t.entries.allPublic}
            </LinkButton>
          </div>
        </CharacterHero>
      ) : (
        <section className="grid max-w-2xl gap-3">
          <h1 className="text-5xl font-extrabold">{name}</h1>
          {profile?.headline ? <p className="text-lg text-ink-soft">{profile.headline}</p> : null}
          {profile?.bio ? <p className="whitespace-pre-line text-ink-soft">{profile.bio}</p> : null}
        </section>
      )}

      <section className="mt-16 grid max-w-3xl gap-4" aria-labelledby="skorasnji">
        <div className="flex items-end justify-between gap-4">
          <h2 id="skorasnji" className="text-3xl font-extrabold">
            {t.entries.recent}
          </h2>
          {feed.items.length > 0 ? (
            <LinkButton href="/objave" variant="ghost" size="sm">
              {t.entries.allPublic}
            </LinkButton>
          ) : null}
        </div>
        {feed.items.length > 0 ? (
          <EntryFeed items={feed.items} branches={indexBranches(tree)} hrefFor={(e) => `/objave/${e.slug}`} />
        ) : (
          <EmptyState title={t.entries.empty} />
        )}
      </section>
    </>
  )
}
