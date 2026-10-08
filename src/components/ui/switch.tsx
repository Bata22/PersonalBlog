'use client'

import { cn } from '@/lib/cn'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl text-left disabled:opacity-60"
    >
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors',
          checked ? 'border-leaf bg-leaf' : 'border-line-strong bg-sunken',
        )}
      >
        <span
          className={cn(
            'absolute size-5 rounded-full bg-surface shadow-soft transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        {description ? <span className="block text-sm text-ink-soft">{description}</span> : null}
      </span>
    </button>
  )
}
