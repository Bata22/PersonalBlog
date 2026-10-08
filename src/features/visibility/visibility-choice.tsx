'use client'

import { useId } from 'react'
import { Globe2, LockKeyhole } from 'lucide-react'
import { t } from '@/i18n/sr'
import { cn } from '@/lib/cn'

const OPTIONS = [
  { isPublic: false, label: t.visibility.private, Icon: LockKeyhole, checkedClass: 'text-private' },
  { isPublic: true, label: t.visibility.public, Icon: Globe2, checkedClass: 'text-leaf' },
] as const

/**
 * Vidljivost u formi: dve imenovane opcije, pa se uvek vidi šta je izabrano.
 * Ljubičasto = samo za mene, zeleno = javno, isto kao oznake u spiskovima.
 */
export function VisibilityChoice({ value, onChange }: { value: boolean; onChange: (isPublic: boolean) => void }) {
  const id = useId()
  return (
    <div className="grid gap-1.5">
      <span id={`${id}-label`} className="text-sm font-semibold text-ink">
        {t.visibility.label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        className="grid h-11 grid-cols-2 gap-1 rounded-xl border border-line bg-sunken p-1"
      >
        {OPTIONS.map(({ isPublic, label, Icon, checkedClass }) => {
          const checked = value === isPublic
          return (
            <label
              key={label}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors',
                'has-focus-visible:outline-[2.5px] has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus)',
                checked ? cn('bg-surface shadow-soft', checkedClass) : 'text-ink-soft hover:text-ink',
              )}
            >
              <input
                type="radio"
                name={`${id}-vidljivost`}
                className="sr-only"
                checked={checked}
                onChange={() => onChange(isPublic)}
              />
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </label>
          )
        })}
      </div>
      <p id={`${id}-hint`} className="text-sm text-ink-soft">
        {value ? t.visibility.publicHint : t.visibility.privateHint}
      </p>
    </div>
  )
}
