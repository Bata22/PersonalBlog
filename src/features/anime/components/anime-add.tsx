'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/misc'
import { Switch } from '@/components/ui/switch'
import { XP_RULES } from '@/config/xp'
import { Cover } from '@/features/library/components/cover'
import { SearchBox } from '@/features/library/components/search-box'
import { t } from '@/i18n/sr'
import { addAnimeToList } from '../actions'
import { describeCandidate, withStatus, type AnimeListValues, type AnimeSearchResult } from '../model'
import { AnimeListFields } from './anime-list-fields'

const START: AnimeListValues = { status: 'watching', score: 0, episodesWatched: 0 }

/**
 * Dodavanje anime-a na listu iz portala: pretraga MAL baze, pa status
 * (gledam / odgledao / planiram...), epizode i ocena. Ide i na MAL.
 */
export function AnimeAdd() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [picked, setPicked] = useState<AnimeSearchResult | null>(null)
  const [values, setValues] = useState<AnimeListValues>(START)
  const [finishedToday, setFinishedToday] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  function pick(anime: AnimeSearchResult) {
    setPicked(anime)
    setValues(withStatus(START, START.status, anime.episodesTotal))
    setFinishedToday(false)
    setMessage(null)
  }

  function add() {
    if (!picked) return
    setMessage(null)
    startTransition(async () => {
      const result = await addAnimeToList({ malId: picked.malId, ...values, finishedToday })
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setMessage({ tone: 'success', text: t.anime.addedToList(picked.title, result.data.xp) })
      setPicked(null)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-5">
      <p className="text-ink-soft">{t.anime.addHint}</p>

      {picked ? (
        <div className="grid gap-5 rounded-2xl border border-line-strong bg-surface p-4">
          <div className="flex items-start gap-3">
            <Cover src={picked.imageUrl} title={picked.title} fallback="🌸" className="w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg leading-snug font-bold">{picked.title}</p>
              {picked.titleEn ? <p className="text-sm text-ink-soft">{picked.titleEn}</p> : null}
              <p className="text-sm text-ink-soft">{describeCandidate(picked)}</p>
            </div>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-sunken"
              aria-label={t.common.cancel}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <AnimeListFields values={values} onChange={setValues} episodesTotal={picked.episodesTotal} />

          {values.status === 'completed' ? (
            <Switch
              checked={finishedToday}
              onChange={setFinishedToday}
              label={t.anime.finishedToday}
              description={t.anime.finishedTodayHint(XP_RULES.milestones.animeCompleted)}
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={add} disabled={pending}>
              <Plus className="size-4" aria-hidden />
              {pending ? t.anime.adding : t.anime.addToList}
            </Button>
            <span className="text-sm text-ink-soft">{t.anime.updateXpHint(XP_RULES.milestones.animeUpdate)}</span>
          </div>
        </div>
      ) : (
        <SearchBox<AnimeSearchResult>
          endpoint="/api/admin/anime/pretraga"
          label={t.anime.searchLabel}
          placeholder={t.anime.searchPlaceholder}
          emptyText={t.anime.noResults}
          minLength={3}
          getKey={(anime) => String(anime.malId)}
          renderItem={(anime) => (
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
              <Cover src={anime.imageUrl} title={anime.title} fallback="🌸" className="w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{anime.title}</p>
                <p className="truncate text-sm text-ink-soft">
                  {[anime.titleEn, describeCandidate(anime)].filter(Boolean).join(', ')}
                </p>
              </div>
              {anime.onList ? (
                <Link href={`/admin/anime/${anime.onList.id}`} className="shrink-0 text-sm font-semibold text-leaf hover:underline">
                  {t.anime.onList(t.anime.statuses[anime.onList.status])}
                </Link>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => pick(anime)}>
                  {t.anime.pick}
                </Button>
              )}
            </div>
          )}
        />
      )}

      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
    </div>
  )
}
