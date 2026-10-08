'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/misc'
import { plantDefaultBranches } from '@/features/branches/actions'
import { deleteEntry } from '@/features/entries/actions'
import { cleanOrphanMedia } from '@/features/media/actions'
import { t } from '@/i18n/sr'

/** Sadi početno stablo (samo kad je prazno). */
export function PlantDefaultsButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="grid justify-items-center gap-3">
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await plantDefaultBranches()
            if (!result.ok) return setError(result.error)
            router.refresh()
          })
        }
      >
        <Sprout className="size-5" aria-hidden />
        {pending ? t.admin.dashboard.planting : t.admin.dashboard.plantDefaults}
      </Button>
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
    </div>
  )
}

/** Brisanje upisa sa potvrdom (koristi se i za dostignuća, koja nemaju formular). */
export function DeleteEntryButton({ id, redirectTo }: { id: string; redirectTo: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t.entryForm.deleteConfirm)) return
          startTransition(async () => {
            const result = await deleteEntry(id)
            if (!result.ok) return setError(result.error)
            router.push(redirectTo)
          })
        }}
      >
        <Trash2 className="size-4" aria-hidden />
        {pending ? t.common.deleting : t.common.delete}
      </Button>
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </span>
  )
}

export function CleanOrphansButton() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  return (
    <div className="grid justify-items-start gap-3">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await cleanOrphanMedia()
            setMessage(
              result.ok
                ? { tone: 'success', text: t.settings.orphansRemoved(result.data.removed) }
                : { tone: 'error', text: result.error },
            )
          })
        }
      >
        {t.settings.cleanOrphans}
      </Button>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
    </div>
  )
}
