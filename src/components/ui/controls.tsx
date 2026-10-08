import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Zajednički izgled svih polja za unos (DRY). */
export const controlClasses =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-faint ' +
  'transition-colors hover:border-line-strong focus:border-leaf focus:outline-none focus-visible:outline-2 ' +
  'aria-invalid:border-danger disabled:opacity-60'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClasses, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlClasses, 'min-h-28 leading-relaxed', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(controlClasses, 'h-11 pr-8', className)} {...props} />
}

type FieldProps = {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: ReactNode
  className?: string
}

/** Natpis + polje + pomoćni tekst + greška, uvek istim redom. */
export function Field({ id, label, hint, error, optional, children, className }: FieldProps) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-ink-faint">(nije obavezno)</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-sm text-ink-soft">{hint}</p> : null}
      {error ? (
        <p id={`${id}-greska`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
