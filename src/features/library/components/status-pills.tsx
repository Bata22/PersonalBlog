'use client'

import { cn } from '@/lib/cn'

/** Izbor statusa (Čitam / Igram / ...) kao red dugmića. */
export function StatusPills<S extends string>({
  value,
  onChange,
  labels,
  legend,
}: {
  value: S
  onChange: (status: S) => void
  labels: Record<S, string>
  legend: string
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{legend}</legend>
      {(Object.keys(labels) as S[]).map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          onClick={() => onChange(status)}
          className={cn(
            'h-9 rounded-full px-3.5 text-sm font-semibold transition-colors',
            value === status ? 'bg-btn text-btn-ink' : 'border border-line text-ink-soft hover:text-ink',
          )}
        >
          {labels[status]}
        </button>
      ))}
    </fieldset>
  )
}
