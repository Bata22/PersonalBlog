import { siteConfig } from '@/config/site'
import { absoluteUrl } from '@/lib/site-url'

type JsonLdData = Record<string, unknown>

/** Strukturirani podaci za Google (schema.org). "<" se escape-uje zbog XSS-a. */
export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function personJsonLd(params: { name: string; description?: string | null; image?: string | null }): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: params.name,
    url: absoluteUrl('/'),
    ...(params.description ? { description: params.description } : {}),
    ...(params.image ? { image: params.image } : {}),
    sameAs: [siteConfig.author.github],
  }
}

export function websiteJsonLd(): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: absoluteUrl('/'),
    inLanguage: siteConfig.lang,
    description: siteConfig.description,
  }
}

export function blogPostingJsonLd(params: {
  title: string
  description: string | null
  path: string
  datePublished: string
  dateModified: string
  image?: string | null
  section?: string
}): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.title,
    ...(params.description ? { description: params.description } : {}),
    url: absoluteUrl(params.path),
    mainEntityOfPage: absoluteUrl(params.path),
    datePublished: params.datePublished,
    dateModified: params.dateModified,
    inLanguage: siteConfig.lang,
    ...(params.section ? { articleSection: params.section } : {}),
    image: params.image ?? absoluteUrl(`${params.path}/opengraph-image`),
    author: { '@type': 'Person', name: siteConfig.author.name, url: absoluteUrl('/') },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
