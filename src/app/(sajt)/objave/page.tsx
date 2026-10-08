import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EmptyState, PageHeader } from '@/components/ui/misc'
import { Pagination, parsePage } from '@/components/ui/pagination'
import { getPublicBranchTree, subtreeIds } from '@/features/branches/queries'
import { findBranch, indexBranches } from '@/features/branches/tree'
import { EntryFeed } from '@/features/entries/components/entry-feed'
import { FeedSkeleton } from '@/features/entries/components/feed-skeleton'
import { getPublicFeed } from '@/features/entries/queries'
import { t } from '@/i18n/sr'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  title: t.entries.title,
  description: t.entries.intro,
  alternates: { canonical: '/objave' },
}

export default function EntriesPage({ searchParams }: PageProps<'/objave'>) {
  return (
    <div className="grid max-w-3xl gap-8">
      <PageHeader title={t.entries.title} intro={t.entries.intro} />
      <Suspense fallback={<FeedSkeleton />}>
        <Feed searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function Feed({ searchParams }: Pick<PageProps<'/objave'>, 'searchParams'>) {
  const params = await searchParams
  const page = parsePage(params.strana)
  const branchSlug = typeof params.grana === 'string' ? params.grana : undefined

  const tree = await getPublicBranchTree()
  const branch = branchSlug ? findBranch(tree, (n) => n.slug === branchSlug) : null
  const feed = await getPublicFeed({ page, branchIds: branch ? subtreeIds(branch) : undefined })

  const hrefFor = (p: number) => {
    const query = new URLSearchParams()
    if (branch) query.set('grana', branch.slug)
    if (p > 1) query.set('strana', String(p))
    const qs = query.toString()
    return qs ? `/objave?${qs}` : '/objave'
  }

  return (
    <>
      <nav aria-label="Grane" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 pb-1">
          <li>
            <FilterLink href="/objave" active={!branch}>
              {t.entries.filterAll}
            </FilterLink>
          </li>
          {tree.map((root) => (
            <li key={root.id}>
              <FilterLink href={`/objave?grana=${root.slug}`} active={branch?.id === root.id}>
                <span aria-hidden>{root.icon}</span> {root.name}
              </FilterLink>
            </li>
          ))}
        </ul>
      </nav>
      {feed.items.length > 0 ? (
        <EntryFeed items={feed.items} branches={indexBranches(tree)} hrefFor={(e) => `/objave/${e.slug}`} />
      ) : (
        <EmptyState title={branch ? t.entries.emptyBranch : t.entries.empty} />
      )}
      <Pagination page={page} hasMore={feed.hasMore} hrefFor={hrefFor} />
    </>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
        active ? 'bg-btn text-btn-ink' : 'border border-line text-ink-soft hover:text-ink',
      )}
    >
      {children}
    </Link>
  )
}
