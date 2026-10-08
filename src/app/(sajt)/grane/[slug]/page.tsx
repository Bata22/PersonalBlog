import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { EmptyState, XpBar } from '@/components/ui/misc'
import { Pagination, parsePage } from '@/components/ui/pagination'
import { ATTRIBUTES } from '@/config/attributes'
import { BranchList } from '@/features/branches/components/branch-list'
import { getPublicBranch, getPublicBranchTree, subtreeIds } from '@/features/branches/queries'
import { indexBranches } from '@/features/branches/tree'
import { EntryFeed } from '@/features/entries/components/entry-feed'
import { FeedSkeleton } from '@/features/entries/components/feed-skeleton'
import { getPublicFeed } from '@/features/entries/queries'
import { getSiteProfile } from '@/features/profile/queries'
import { breadcrumbJsonLd, JsonLd } from '@/features/seo/json-ld'
import { t } from '@/i18n/sr'
import { formatNumber, pluralize } from '@/lib/format'

const LIBRARY_PAGES = { books: '/knjige', games: '/igre', anime: '/anime' } as const

export async function generateMetadata({ params }: PageProps<'/grane/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const branch = await getPublicBranch(slug)
  if (!branch) return { title: t.errors.notFound, robots: { index: false } }
  return {
    title: branch.name,
    description: branch.description ?? `${branch.name}: upisi i napredak u ovoj grani.`,
    alternates: { canonical: `/grane/${slug}` },
  }
}

export default function BranchPage({ params, searchParams }: PageProps<'/grane/[slug]'>) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <BranchContent params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function BranchContent({ params, searchParams }: Pick<PageProps<'/grane/[slug]'>, 'params' | 'searchParams'>) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const page = parsePage(query.strana)
  const [tree, profile] = await Promise.all([getPublicBranchTree(), getSiteProfile()])
  const branch = await getPublicBranch(slug)
  if (!branch) notFound()

  const feed = await getPublicFeed({ page, branchIds: subtreeIds(branch) })
  const showStats = profile?.showStatsPublicly ?? true
  const attribute = branch.attributeResolved ? ATTRIBUTES[branch.attributeResolved] : null
  const libraryHref = branch.role && branch.role !== 'journal' ? LIBRARY_PAGES[branch.role] : null

  return (
    <div className="grid max-w-3xl gap-10">
      <JsonLd
        data={breadcrumbJsonLd([
          ...branch.ancestors.map((a) => ({ name: a.name, path: `/grane/${a.slug}` })),
          { name: branch.name, path: `/grane/${branch.slug}` },
        ])}
      />

      <header className="grid gap-4">
        {branch.ancestors.length > 0 ? (
          <nav aria-label="Putanja" className="text-sm font-semibold text-ink-soft">
            {branch.ancestors.map((a) => (
              <span key={a.id}>
                <Link href={`/grane/${a.slug}`} className="hover:text-ink">
                  {a.name}
                </Link>
                <span aria-hidden> › </span>
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-4xl" aria-hidden>
            {branch.icon}
          </span>
          <div className="min-w-0">
            <h1 className="text-4xl font-extrabold sm:text-5xl">{branch.name}</h1>
            {attribute ? (
              <p className="mt-1 text-ink-soft">
                {t.character.attributes}: {attribute.label}
              </p>
            ) : null}
          </div>
        </div>
        {branch.description ? <p className="max-w-prose text-lg text-ink-soft">{branch.description}</p> : null}

        {showStats ? (
          <div className="grid gap-1.5 rounded-[20px] border border-line bg-surface p-4">
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-display text-2xl font-extrabold">
                {t.character.level} {branch.level.level}
              </span>
              <span className="text-sm text-ink-soft tabular-nums">
                {formatNumber(branch.totalXp)} XP, {pluralize(branch.entryCount, t.character.entries)}
              </span>
            </p>
            <XpBar progress={branch.level.progress} label={`${branch.name}, ${t.character.level} ${branch.level.level}`} />
          </div>
        ) : null}

        {libraryHref ? (
          <Link href={libraryHref} className="font-semibold text-leaf hover:underline">
            {t.branches.special[branch.role as 'books']}
          </Link>
        ) : null}
      </header>

      {branch.focus_note ? (
        <section className="rounded-[20px] bg-accent px-5 py-4 text-accent-ink" aria-labelledby="gde-sam-stao">
          <h2 id="gde-sam-stao" className="text-lg font-bold">
            {t.branches.focusTitle}
          </h2>
          <p className="mt-1 whitespace-pre-line">{branch.focus_note}</p>
        </section>
      ) : null}

      {branch.children.length > 0 ? (
        <section className="grid gap-3" aria-labelledby="podgrane">
          <h2 id="podgrane" className="text-2xl font-bold">
            {t.branches.subBranches}
          </h2>
          <BranchList roots={branch.children} />
        </section>
      ) : null}

      <section className="grid gap-3" aria-labelledby="upisi-grane">
        <h2 id="upisi-grane" className="text-2xl font-bold">
          {t.branches.entriesHere}
        </h2>
        {feed.items.length > 0 ? (
          <EntryFeed items={feed.items} branches={indexBranches(tree)} hrefFor={(e) => `/objave/${e.slug}`} />
        ) : (
          <EmptyState title={t.entries.emptyBranch} />
        )}
        <Pagination
          page={page}
          hasMore={feed.hasMore}
          hrefFor={(p) => (p > 1 ? `/grane/${branch.slug}?strana=${p}` : `/grane/${branch.slug}`)}
        />
      </section>
    </div>
  )
}
