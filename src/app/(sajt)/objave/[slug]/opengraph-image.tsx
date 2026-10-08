import { getPublicBranchTree } from '@/features/branches/queries'
import { indexBranches } from '@/features/branches/tree'
import { getPublicEntry } from '@/features/entries/queries'
import { OG_SIZE, ogImage } from '@/features/seo/og'
import { formatDate } from '@/lib/dates'

export const alt = 'Upis iz dnevnika'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [entry, tree] = await Promise.all([getPublicEntry(slug), getPublicBranchTree()])
  if (!entry) return ogImage({ title: 'Upis nije pronađen' })

  const branch = indexBranches(tree)[entry.branch_id]
  return ogImage({
    // bez emodžija: generator slika bi ih tražio sa spoljnog CDN-a
    eyebrow: branch?.path,
    title: entry.title,
    footer: `${formatDate(entry.occurred_on)}  +${entry.xp} XP`,
  })
}
