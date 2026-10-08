import Link from 'next/link'
import { VisibilityBadge } from '@/components/ui/misc'
import { groupByStatus } from '@/features/library/group'
import { Cover } from '@/features/library/components/cover'
import { t } from '@/i18n/sr'
import { formatNumber } from '@/lib/format'
import { GAME_STATUS_ORDER, type Game } from '../queries'

export function GameGrid({ games, hrefFor, showVisibility }: { games: Game[]; hrefFor: (game: Game) => string; showVisibility?: boolean }) {
  return (
    <div className="grid gap-10">
      {groupByStatus(games, GAME_STATUS_ORDER).map(({ status, items }) => (
        <section key={status} aria-labelledby={`igre-${status}`}>
          <h2 id={`igre-${status}`} className="mb-4 text-2xl font-bold">
            {t.games.statuses[status]} <span className="text-base font-semibold text-ink-soft tabular-nums">{items.length}</span>
          </h2>
          <ul className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((game) => (
              <li key={game.id}>
                <Link href={hrefFor(game)} className="group grid gap-2">
                  <Cover src={game.cover_url} title={game.name} fallback="🎮" wide className="transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none" />
                  <span className="grid gap-0.5">
                    <span className="line-clamp-1 font-semibold">{game.name}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                      {game.rating ? <span className="font-semibold text-ink">★ {game.rating}/10</span> : null}
                      {game.hours_played ? <span>{formatNumber(Number(game.hours_played))} h</span> : null}
                      {game.released ? <span>{game.released.slice(0, 4)}</span> : null}
                      {showVisibility ? <VisibilityBadge isPublic={game.is_public} compact /> : null}
                    </span>
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
