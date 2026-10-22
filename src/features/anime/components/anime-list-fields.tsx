'use client'

import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Field, Input, Select } from '@/components/ui/controls'
import { StatusPills } from '@/features/library/components/status-pills'
import { t } from '@/i18n/sr'
import { withEpisodes, withStatus, type AnimeListValues } from '../model'

const stepButton =
  'grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink hover:border-line-strong disabled:opacity-40'

/**
 * Status, epizode i ocena — isto polje za dodavanje novog i izmenu postojećeg
 * anime-a. Za "Planiram" nema epizoda ni ocene.
 */
export function AnimeListFields({
  values,
  onChange,
  episodesTotal,
}: {
  values: AnimeListValues
  onChange: (values: AnimeListValues) => void
  episodesTotal: number | null
}) {
  const id = useId()
  const planned = values.status === 'plan_to_watch'
  const max = episodesTotal ?? Number.MAX_SAFE_INTEGER

  return (
    <div className="grid gap-5">
      <StatusPills
        value={values.status}
        onChange={(status) => onChange(withStatus(values, status, episodesTotal))}
        labels={t.anime.statuses}
        legend="Status"
      />

      {planned ? null : (
        <div className="grid gap-4 sm:grid-cols-[auto_12rem] sm:items-end">
          <Field id={`${id}-ep`} label={t.anime.episodes}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={stepButton}
                onClick={() => onChange(withEpisodes(values, values.episodesWatched - 1, episodesTotal))}
                disabled={values.episodesWatched <= 0}
                aria-label={t.anime.episodeMinus}
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <Input
                id={`${id}-ep`}
                type="number"
                inputMode="numeric"
                min={0}
                max={episodesTotal ?? undefined}
                value={values.episodesWatched}
                onChange={(e) => onChange(withEpisodes(values, Number(e.target.value) || 0, episodesTotal))}
                className="w-20 text-center tabular-nums"
              />
              <button
                type="button"
                className={stepButton}
                onClick={() => onChange(withEpisodes(values, values.episodesWatched + 1, episodesTotal))}
                disabled={values.episodesWatched >= max}
                aria-label={t.anime.episodePlus}
              >
                <Plus className="size-4" aria-hidden />
              </button>
              <span className="text-ink-soft tabular-nums">/ {episodesTotal ?? '?'}</span>
            </div>
          </Field>

          <Field id={`${id}-score`} label={t.anime.score}>
            <Select id={`${id}-score`} value={values.score} onChange={(e) => onChange({ ...values, score: Number(e.target.value) })}>
              <option value={0}>{t.anime.noScore}</option>
              {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
                <option key={n} value={n}>
                  ★ {n}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
    </div>
  )
}
