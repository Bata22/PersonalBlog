import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/ui/misc'
import { Pagination, parsePage } from '@/components/ui/pagination'
import { AdminSkeleton } from '@/features/admin/components'
import { requireOwner } from '@/features/auth/session'
import { loadBranchTree, subtreeIds } from '@/features/branches/queries'
import { findBranch, indexBranches } from '@/features/branches/tree'
import { EntryFeed } from '@/features/entries/components/entry-feed'
import { getOwnerFeed } from '@/features/entries/queries'
import { t } from '@/i18n/sr'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: t.entries.adminTitle }

export default function AdminEntriesPage({ searchParams }: PageProps<'/admin/upisi'>) {
  return (
    <div className="grid gap-6">
      <PageHeader
        title={t.entries.adminTitle}
        intro={t.entries.adminIntro}
        actions={
          <LinkButton href="/admin/novo">
            <Plus className="size-4" aria-hidden />
            {t.entries.newEntry}
          </LinkButton>
        }
      />
      <Suspense fallback={<AdminSkeleton />}>
        <EntriesList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

const VISIBILITY = { javno: 'public', privatno: 'private' } as const

async function EntriesList({ searchParams }: Pick<PageProps<'/admin/upisi'>, 'searchParams'>) {
  const { supabase } = await requireOwner()
  const params = await searchParams
  const page = parsePage(params.strana)
  const visibilityKey = params.vidljivost === 'javno' || params.vidljivost === 'privatno' ? params.vidljivost : undefined
  const branchSlug = typeof params.grana === 'string' ? params.grana : undefined

  const tree = await loadBranchTree(supabase)
  const branch = branchSlug ? findBranch(tree, (n) => n.slug === branchSlug) : null
  const feed = await getOwnerFeed(supabase, {
    page,
    visibility: visibilityKey ? VISIBILITY[visibilityKey] : undefined,
    branchIds: branch ? subtreeIds(branch) : undefined,
  })

  const href = (overrides: { strana?: number; vidljivost?: string | null; grana?: string | null }) => {
    const q = new URLSearchParams()
    const vis = overrides.vidljivost === undefined ? visibilityKey : overrides.vidljivost
    const gr = overrides.grana === undefined ? branch?.slug : overrides.grana
    if (vis) q.set('vidljivost', vis)
    if (gr) q.set('grana', gr)
    if (overrides.strana && overrides.strana > 1) q.set('strana', String(overrides.strana))
    const qs = q.toString()
    return qs ? `/admin/upisi?${qs}` : '/admin/upisi'
  }

  const chip = (active: boolean) =>
    cn(
      'inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap',
      active ? 'bg-btn text-btn-ink' : 'border border-line text-ink-soft hover:text-ink',
    )

  return (
    <div className="grid gap-5">
      <div className="-mx-4 grid gap-2 overflow-x-auto px-4">
        <ul className="flex gap-2">
          <li>
            <Link href={href({ vidljivost: null })} className={chip(!visibilityKey)}>
              {t.common.all}
            </Link>
          </li>
          <li>
            <Link href={href({ vidljivost: 'javno' })} className={chip(visibilityKey === 'javno')}>
              {t.entries.filterPublic}
            </Link>
          </li>
          <li>
            <Link href={href({ vidljivost: 'privatno' })} className={chip(visibilityKey === 'privatno')}>
              {t.entries.filterPrivate}
            </Link>
          </li>
        </ul>
        <ul className="flex gap-2">
          <li>
            <Link href={href({ grana: null })} className={chip(!branch)}>
              {t.entries.filterAll}
            </Link>
          </li>
          {tree.map((root) => (
            <li key={root.id}>
              <Link href={href({ grana: root.slug })} className={chip(branch?.id === root.id)}>
                <span aria-hidden>{root.icon}</span> {root.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {feed.items.length > 0 ? (
        <EntryFeed
          items={feed.items}
          branches={indexBranches(tree)}
          hrefFor={(e) => `/admin/upisi/${e.id}`}
          showVisibility
          supabase={supabase}
        />
      ) : (
        <EmptyState title={t.admin.dashboard.recentEmpty} />
      )}
      <Pagination page={page} hasMore={feed.hasMore} hrefFor={(p) => href({ strana: p })} />
    </div>
  )
}
