import { siteConfig } from '@/config/site'
import { getPublicEntryIndex } from '@/features/entries/queries'
import { absoluteUrl } from '@/lib/site-url'

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

/** RSS za čitače vesti (Feedly i sl.) — poslednjih 50 javnih upisa. */
export async function GET() {
  const entries = (await getPublicEntryIndex()).slice(0, 50)

  const items = entries
    .map((entry) => {
      const url = absoluteUrl(`/objave/${entry.slug}`)
      const date = new Date(entry.published_at ?? `${entry.occurred_on}T12:00:00Z`).toUTCString()
      return [
        '<item>',
        `<title>${escape(entry.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${date}</pubDate>`,
        entry.excerpt ? `<description>${escape(entry.excerpt)}</description>` : '',
        '</item>',
      ].join('')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escape(siteConfig.name)}</title>
<link>${absoluteUrl('/')}</link>
<description>${escape(siteConfig.description)}</description>
<language>sr</language>
<atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
