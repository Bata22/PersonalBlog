import { twMerge } from 'tailwind-merge'

/**
 * Spaja CSS klase i preskače prazne vrednosti. Kad se dve klase sukobe
 * (npr. "text-ink-soft" i "text-accent-ink"), važi poslednja — kao što se i očekuje
 * kad se komponenti prosledi className.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
