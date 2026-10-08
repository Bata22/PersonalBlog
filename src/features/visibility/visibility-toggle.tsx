'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { Globe2, LockKeyhole } from 'lucide-react'
import { t } from '@/i18n/sr'
import { cn } from '@/lib/cn'
import { setVisibility, type VisibilityTarget } from './actions'

/** Dugme koje odmah prebacuje javno ↔ samo za mene (radi i za staru objavu). */
export function VisibilityToggle({
  target,
  id,
  isPublic,
  size = 'md',
}: {
  target: VisibilityTarget
  id: string
  isPublic: boolean
  size?: 'sm' | 'md'
}) {
  const [optimistic, setOptimistic] = useOptimistic(isPublic)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    const next = !optimistic
    setError(null)
    startTransition(async () => {
      setOptimistic(next)
      const result = await setVisibility(target, id, next)
      if (!result.ok) setError(result.error)
    })
  }

  const Icon = optimistic ? Globe2 : LockKeyhole
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={optimistic}
        title={optimistic ? t.visibility.publicHint : t.visibility.privateHint}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-semibold transition-colors disabled:opacity-60',
          size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4',
          optimistic
            ? 'border-leaf/40 bg-leaf-soft text-leaf hover:border-leaf'
            : 'border-private/40 bg-private-soft text-private hover:border-private',
        )}
      >
        <Icon className="size-4" aria-hidden />
        {optimistic ? t.visibility.public : t.visibility.private}
      </button>
      {error ? (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      ) : null}
    </span>
  )
}
