import { siteConfig } from '@/config/site'
import { OG_SIZE, ogImage } from '@/features/seo/og'

export const alt = siteConfig.name
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return ogImage({ eyebrow: siteConfig.tagline, title: siteConfig.name, footer: 'XP, stablo veština, dnevnik' })
}
