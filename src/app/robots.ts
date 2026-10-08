import type { MetadataRoute } from 'next'
import { absoluteUrl, siteOrigin } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/prijava'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteOrigin(),
  }
}
