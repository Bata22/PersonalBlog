'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/controls'
import { FormMessage } from '@/components/ui/misc'
import { NumberInput } from '@/components/ui/number-input'
import { t } from '@/i18n/sr'
import { deleteGame, updateGame, type UpdateGameInput } from '../actions'

/** Status, ocena, sati i datumi igre. "Prešao" donosi dostignuće. */
export function GameEditor({ initial }: { initial: UpdateGameInput }) {
  const id = useId()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState(initial)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const set = (patch: Partial<UpdateGameInput>) => setValues((v) => ({ ...v, ...patch }))

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await updateGame(values)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setMessage({
        tone: 'success',
        text: result.data.milestoneXp ? `${t.common.saved} 🏆 +${result.data.milestoneXp} XP` : t.common.saved,
      })
      router.refresh()
    })
  }

  function remove() {
    if (!window.confirm(t.games.deleteConfirm)) return
    startTransition(async () => {
      const result = await deleteGame(values.id)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      router.push('/admin/igre')
    })
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id={`${id}-status`} label="Status">
          <Select id={`${id}-status`} value={values.status} onChange={(e) => set({ status: e.target.value as UpdateGameInput['status'] })}>
            {Object.entries(t.games.statuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={`${id}-rating`} label={`${t.games.rating} (1–10)`}>
          <Select
            id={`${id}-rating`}
            value={values.rating ?? ''}
            onChange={(e) => set({ rating: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={`${id}-hours`} label={t.games.hours}>
          <NumberInput id={`${id}-hours`} decimal value={values.hoursPlayed ?? undefined} onValue={(v) => set({ hoursPlayed: v ?? null })} />
        </Field>
        <Field id={`${id}-start`} label={t.games.started}>
          <Input id={`${id}-start`} type="date" value={values.startedOn ?? ''} onChange={(e) => set({ startedOn: e.target.value })} />
        </Field>
        <Field id={`${id}-end`} label={t.games.finished}>
          <Input id={`${id}-end`} type="date" value={values.finishedOn ?? ''} onChange={(e) => set({ finishedOn: e.target.value })} />
        </Field>
      </div>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={pending}>
          {pending ? t.common.saving : t.common.save}
        </Button>
        <Button variant="danger" onClick={remove} disabled={pending}>
          <Trash2 className="size-4" aria-hidden />
          {t.common.delete}
        </Button>
      </div>
    </div>
  )
}
