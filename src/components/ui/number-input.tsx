'use client'

import { useState, type ComponentProps } from 'react'
import { Input } from './controls'

/** Prihvata i decimalni zarez ("5,5"). Prazno polje = undefined. */
export function parseNumber(text: string): number | undefined {
  const trimmed = text.trim().replace(',', '.')
  if (trimmed === '') return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

type Props = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined
  onValue: (value: number | undefined) => void
  decimal?: boolean
}

/**
 * Brojčano polje koje pamti tekst dok kucaš (da "5," ne nestane), a
 * spolja javlja broj.
 */
export function NumberInput({ value, onValue, decimal, ...props }: Props) {
  const [text, setText] = useState(value === undefined ? '' : String(value).replace('.', ','))
  return (
    <Input
      {...props}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const parsed = parseNumber(e.target.value)
        onValue(decimal || parsed === undefined ? parsed : Math.round(parsed))
      }}
    />
  )
}
