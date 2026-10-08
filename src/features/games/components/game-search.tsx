'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/controls'
import { FormMessage } from '@/components/ui/misc'
import { Cover } from '@/features/library/components/cover'
import { SearchBox } from '@/features/library/components/search-box'
import { StatusPills } from '@/features/library/components/status-pills'
import { t } from '@/i18n/sr'
import { addGame, type AddGameInput } from '../actions'
import type { GameCandidate } from '../catalog'

type Status = AddGameInput['status']

export function GameSearch() {
  const id = useId()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<Status>('igram')
  const [manualName, setManualName] = useState('')
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  function run(input: AddGameInput) {
    setMessage(null)
    startTransition(async () => {
      const result = await addGame(input)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      router.push(`/admin/igre/${result.data.id}`)
    })
  }

  return (
    <div className="grid gap-5">
      <StatusPills value={status} onChange={setStatus} labels={t.games.statuses} legend="Status" />

      <SearchBox<GameCandidate>
        endpoint="/api/admin/igre/pretraga"
        label={t.games.add}
        placeholder={t.games.searchPlaceholder}
        emptyText={t.games.noResults}
        getKey={(game) => game.externalId}
        renderItem={(game) => (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
            <Cover src={game.coverUrl} title={game.name} fallback="🎮" wide className="w-24 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{game.name}</p>
              <p className="truncate text-sm text-ink-soft">
                {[game.released?.slice(0, 4), game.platforms.slice(0, 3).join(', ')].filter(Boolean).join(', ')}
              </p>
            </div>
            <Button size="sm" onClick={() => run({ source: 'rawg', candidate: game, status })} disabled={pending}>
              <Plus className="size-4" aria-hidden />
              {t.common.add}
            </Button>
          </div>
        )}
      />
      <p className="text-xs text-ink-soft">
        <a href="https://rawg.io" rel="noopener noreferrer" className="underline underline-offset-2">
          {t.games.attribution}
        </a>
      </p>

      <details className="rounded-2xl border border-line bg-surface p-4">
        <summary className="cursor-pointer font-semibold">{t.games.addManually}</summary>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field id={`${id}-name`} label={t.games.manualName} className="min-w-60 flex-1">
            <Input id={`${id}-name`} value={manualName} onChange={(e) => setManualName(e.target.value)} maxLength={300} />
          </Field>
          <Button onClick={() => run({ source: 'rucno', name: manualName, status })} disabled={pending || !manualName.trim()}>
            {t.common.add}
          </Button>
        </div>
      </details>

      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
    </div>
  )
}
