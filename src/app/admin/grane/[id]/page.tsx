import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { PageHeader, Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { requireOwner } from '@/features/auth/session'
import { BranchForm } from '@/features/branches/components/branch-form'
import { newEntryHref } from '@/features/branches/links'
import { loadBranchTree } from '@/features/branches/queries'
import { branchPath, findBranch, flattenTree } from '@/features/branches/tree'
import { asFormKind } from '@/features/entries/defaults'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.branches.editBranch }

export default function EditBranchPage({ params }: PageProps<'/admin/grane/[id]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EditBranch params={params} />
    </Suspense>
  )
}

async function EditBranch({ params }: Pick<PageProps<'/admin/grane/[id]'>, 'params'>) {
  const { supabase } = await requireOwner()
  const { id } = await params
  const tree = await loadBranchTree(supabase)
  const node = findBranch(tree, (n) => n.id === id)
  if (!node) notFound()

  // roditelj ne sme biti sama grana ni neka njena podgrana
  const own = new Set(flattenTree([node]).map((n) => n.id))
  const parents = flattenTree(tree)
    .filter((n) => !own.has(n.id))
    .map((n) => ({ id: n.id, label: branchPath(n), attribute: n.attributeResolved }))
  return (
    <div className="grid gap-6">
      <PageHeader
        title={
          <span>
            <span aria-hidden>{node.icon}</span> {node.name}
          </span>
        }
        intro={branchPath(node)}
        actions={
          <>
            <LinkButton href={newEntryHref(node)} size="sm">
              <Plus className="size-4" aria-hidden />
              {t.branches.writeHere}
            </LinkButton>
            <LinkButton href={`/grane/${node.slug}`} variant="secondary" size="sm">
              <ExternalLink className="size-4" aria-hidden />
              {t.common.viewAsVisitor}
            </LinkButton>
          </>
        }
      />
      <Panel>
        <BranchForm
          special={Boolean(node.role)}
          parents={parents}
          initial={{
            id: node.id,
            name: node.name,
            icon: node.icon,
            description: node.description ?? '',
            parentId: node.parent_id,
            attribute: node.attribute,
            entryKind: node.role ? 'post' : asFormKind(node.entry_kind),
            focusNote: node.focus_note ?? '',
            position: node.position,
          }}
        />
      </Panel>
    </div>
  )
}
