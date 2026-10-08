import { siteConfig } from '@/config/site'

/**
 * Datumi upisa su "goli" datumi (YYYY-MM-DD) po beogradskom vremenu.
 * Aritmetika ide u UTC-u da prelazak na letnje/zimsko vreme ne pravi probleme.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

/** Datum (YYYY-MM-DD) za dati trenutak u vremenskoj zoni. */
export function isoDateInZone(date: Date, timeZone: string = siteConfig.timezone): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Sat (0–23) za dati trenutak u vremenskoj zoni. */
export function hourInZone(date: Date, timeZone: string = siteConfig.timezone): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  return Number(hour)
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Broj dana od `from` do `to` (može biti negativan). */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

const longDate = new Intl.DateTimeFormat(siteConfig.locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortMonth = new Intl.DateTimeFormat(siteConfig.locale, { month: 'short', timeZone: 'UTC' })
const weekday = new Intl.DateTimeFormat(siteConfig.locale, { weekday: 'long', timeZone: 'UTC' })

/** "8. oktobar 2026." */
export function formatDate(isoDate: string): string {
  return longDate.format(new Date(`${isoDate}T00:00:00Z`))
}

/** Pečat za dnevnik: veliki broj dana + skraćeni mesec. */
export function dateStamp(isoDate: string): { day: string; month: string; year: string } {
  const d = new Date(`${isoDate}T00:00:00Z`)
  return {
    day: String(d.getUTCDate()),
    month: shortMonth.format(d).replace('.', ''),
    year: String(d.getUTCFullYear()),
  }
}

export function weekdayName(isoDate: string): string {
  return weekday.format(new Date(`${isoDate}T00:00:00Z`))
}
