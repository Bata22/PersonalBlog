import Link from 'next/link'
import { VisibilityBadge } from '@/components/ui/misc'
import { Cover } from '@/features/library/components/cover'
import { groupByStatus } from '@/features/library/group'
import { t } from '@/i18n/sr'
import { ANIME_STATUS_ORDER, type Anime } from '../queries'

export function AnimeList({ items, hrefFor, showVisibility }: { items: Anime[]; hrefFor: (anime: Anime) => string; showVisibility?: boolean }) {
  return (
    <div className="grid gap-10">
      {groupByStatus(items, ANIME_STATUS_ORDER).map(({ status, items: group }) => (
        <section key={status} aria-labelledby={`anime-${status}`}>
          <h2 id={`anime-${status}`} className="mb-4 text-2xl font-bold">
            {t.anime.statuses[status]} <span className="text-base font-semibold text-ink-soft tabular-nums">{group.length}</span>
          </h2>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-7">
            {group.map((anime) => (
              <li key={anime.id}>
                <Link href={hrefFor(anime)} className="group grid gap-1.5">
                  <Cover src={anime.image_url} title={anime.title} fallback="🌸" className="transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none" />
                  <span className="line-clamp-2 text-sm font-semibold leading-snug">{anime.title}</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-xs text-ink-soft tabular-nums">
                    {anime.score ? <span className="font-semibold text-ink">★ {anime.score}</span> : null}
                    <span>
                      {anime.episodes_watched}/{anime.episodes_total ?? '?'}
                    </span>
                    {showVisibility ? <VisibilityBadge isPublic={anime.is_public} compact /> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
