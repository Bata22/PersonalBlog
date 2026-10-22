'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/misc'
import { XP_RULES } from '@/config/xp'
import { t } from '@/i18n/sr'
import { updateAnimeOnMal } from '../actions'
import type { AnimeListValues, MalStatus } from '../model'
import { AnimeListFields } from './anime-list-fields'

type Props = {
  animeId: string
  status: MalStatus
  score: number | null
  episodesWatched: number
  episodesTotal: number | null
}

/** Izmena anime-a koji je već na listi — čuva se na MAL-u i donosi XP. */
export function MalEditor({ animeId, status, score, episodesWatched, episodesTotal }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState<AnimeListValues>({ status, score: score ?? 0, episodesWatched })
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await updateAnimeOnMal({ animeId, ...values })
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setMessage({ tone: 'success', text: t.anime.savedToMal(result.data.xp) })
      router.refresh()
    })
  }

  return (
    <div className="grid gap-5">
      <AnimeListFields values={values} onChange={setValues} episodesTotal={episodesTotal} />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? t.anime.savingToMal : t.anime.saveToMal}
        </Button>
        <span className="text-sm text-ink-soft">{t.anime.updateXpHint(XP_RULES.milestones.animeUpdate)}</span>
      </div>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
    </div>
  )
}
