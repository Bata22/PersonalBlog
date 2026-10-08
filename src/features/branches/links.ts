import type { BranchRole } from '@/config/default-branches'

/** Gde vodi "upiši u ovu granu": posebne grane imaju svoje stranice. */
export function newEntryHref(node: { id: string; role: BranchRole | null }): string {
  switch (node.role) {
    case 'journal':
      return '/admin/dnevnik'
    case 'books':
      return '/admin/knjige'
    case 'games':
      return '/admin/igre'
    case 'anime':
      return '/admin/anime'
    default:
      return `/admin/novo?grana=${node.id}`
  }
}
