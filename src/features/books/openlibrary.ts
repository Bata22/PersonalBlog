import 'server-only'
import { z } from 'zod'
import { t } from '@/i18n/sr'
import { UserError } from '@/lib/errors'
import { siteOrigin } from '@/lib/site-url'

/** Open Library: besplatno, bez ključa. https://openlibrary.org/developers/api */

export const bookCandidateSchema = z.object({
  key: z.string().regex(/^\/works\/OL\d+W$/),
  title: z.string().min(1).max(300),
  authors: z.array(z.string().max(120)).max(5),
  year: z.number().int().min(-3000).max(3000).nullable(),
  coverUrl: z.string().regex(/^https:\/\/covers\.openlibrary\.org\/b\/id\/\d+-[SML]\.jpg$/).nullable(),
  pages: z.number().int().min(1).max(50000).nullable(),
  isbn: z.string().max(20).nullable(),
})

export type BookCandidate = z.infer<typeof bookCandidateSchema>

type SearchDoc = {
  key?: string
  title?: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  number_of_pages_median?: number
  isbn?: string[]
}

export async function searchBooks(query: string): Promise<BookCandidate[]> {
  const url = new URL('https://openlibrary.org/search.json')
  url.searchParams.set('q', query)
  url.searchParams.set('fields', 'key,title,author_name,first_publish_year,cover_i,number_of_pages_median,isbn')
  url.searchParams.set('limit', '10')

  let response: Response
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': `licni-blog (+${siteOrigin()})` },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
  } catch {
    throw new UserError(t.errors.externalApi('Open Library'))
  }
  if (!response.ok) throw new UserError(t.errors.externalApi('Open Library'))

  const json = (await response.json()) as { docs?: SearchDoc[] }
  const candidates = (json.docs ?? []).map((doc) => ({
    key: doc.key ?? '',
    title: doc.title ?? '',
    authors: (doc.author_name ?? []).slice(0, 5),
    year: doc.first_publish_year ?? null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    pages: doc.number_of_pages_median ?? null,
    isbn: doc.isbn?.[0]?.slice(0, 20) ?? null,
  }))
  return candidates.filter((c) => bookCandidateSchema.safeParse(c).success)
}
