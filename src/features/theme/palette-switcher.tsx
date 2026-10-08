'use client'

import { useSyncExternalStore } from 'react'
import { Check } from 'lucide-react'
import { DEFAULT_PALETTE, PALETTES, PALETTE_STORAGE_KEY, isPaletteId, type PaletteId } from '@/config/theme'
import { cn } from '@/lib/cn'

function readPalette(): PaletteId {
  const value = document.documentElement.getAttribute('data-palette')
  return isPaletteId(value) ? value : DEFAULT_PALETTE
}

const listeners = new Set<() => void>()
function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function applyPalette(id: PaletteId) {
  document.documentElement.setAttribute('data-palette', id)
  try {
    if (id === DEFAULT_PALETTE) localStorage.removeItem(PALETTE_STORAGE_KEY)
    else localStorage.setItem(PALETTE_STORAGE_KEY, id)
  } catch {
    // privatni režim ili blokiran storage: paleta važi do osvežavanja
  }
  for (const listener of listeners) listener()
}

export function PaletteSwitcher() {
  const current = useSyncExternalStore(subscribe, readPalette, () => DEFAULT_PALETTE)

  return (
    <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
      {PALETTES.map((palette) => {
        const active = palette.id === current
        return (
          <button
            key={palette.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => applyPalette(palette.id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border bg-surface p-3 text-left transition-colors',
              active ? 'border-ink' : 'border-line hover:border-line-strong',
            )}
          >
            <span className="flex shrink-0 overflow-hidden rounded-full border border-line" aria-hidden>
              {palette.swatch.map((color) => (
                <span key={color} className="h-7 w-4" style={{ backgroundColor: color }} />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{palette.label}</span>
              <span className="block text-sm text-ink-soft">{palette.description}</span>
            </span>
            {active ? <Check className="size-5 shrink-0 text-leaf" aria-hidden /> : null}
          </button>
        )
      })}
    </div>
  )
}
