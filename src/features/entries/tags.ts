import { CACHE_TAGS } from '@/lib/cache-tags'

/** Oznake keša koje treba osvežiti posle izmene jednog upisa. */
export function entryTags(
  slugs: (string | null | undefined)[],
  subject: { book?: boolean; game?: boolean; anime?: boolean } = {},
): string[] {
  return [
    CACHE_TAGS.entries,
    CACHE_TAGS.xp,
    ...slugs.filter((s): s is string => Boolean(s)).map(CACHE_TAGS.entry),
    ...(subject.book ? [CACHE_TAGS.books] : []),
    ...(subject.game ? [CACHE_TAGS.games] : []),
    ...(subject.anime ? [CACHE_TAGS.anime] : []),
  ]
}
