import type { Metadata } from 'next'
import { AdminSectionList } from '@/components/layout/admin-shell'
import { PageHeader } from '@/components/ui/misc'

export const metadata: Metadata = { title: 'Meni' }

/** Na telefonu: sve sekcije admin dela na jednom mestu ("Još" u donjoj traci). */
export default function AdminMenuPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Meni" />
      <nav aria-label="Admin meni">
        <AdminSectionList />
      </nav>
    </div>
  )
}
