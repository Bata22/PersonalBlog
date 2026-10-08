import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EmptyState, PageHeader, Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { PlantDefaultsButton } from '@/features/admin/action-buttons'
import { requireOwner } from '@/features/auth/session'
import { BranchForm } from '@/features/branches/components/branch-form'
import { BranchList } from '@/features/branches/components/branch-list'
import { loadBranchTree } from '@/features/branches/queries'
import { branchPath, flattenTree } from '@/features/branches/tree'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.branches.title }

export default function BranchesPage() {
  return (
    <div className="grid gap-8">
      <PageHeader title={t.branches.title} intro={t.branches.intro} />
      <Suspense fallback={<AdminSkeleton />}>
        <Branches />
      </Suspense>
    </div>
  )
}

async function Branches() {
  const { supabase } = await requireOwner()
  const tree = await loadBranchTree(supabase)

  if (tree.length === 0) {
    return <EmptyState title={t.admin.dashboard.emptyTreeTitle} action={<PlantDefaultsButton />} />
  }

  return (
    <>
      <BranchList roots={tree} hrefFor={(node) => `/admin/grane/${node.id}`} />
      <Panel>
        <details>
          <summary className="cursor-pointer font-display text-xl font-bold">{t.branches.newBranch}</summary>
          <div className="mt-5">
            <BranchForm
              parents={flattenTree(tree).map((n) => ({ id: n.id, label: branchPath(n) }))}
              initial={{
                name: '',
                icon: '🌱',
                description: '',
                parentId: null,
                attribute: null,
                entryKind: 'post',
                focusNote: '',
                position: tree.length,
              }}
            />
          </div>
        </details>
      </Panel>
    </>
  )
}
