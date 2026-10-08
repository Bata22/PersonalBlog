import { addDays } from '@/lib/dates'

/**
 * Niz dana u dnevniku. `dates` su datumi (YYYY-MM-DD) za koje postoji
 * dnevnički upis, u bilo kom redosledu.
 */

/** Koliko dana zaredom je upisano neposredno PRE datog dana. */
export function streakBefore(dates: Iterable<string>, day: string): number {
  const set = new Set(dates)
  let count = 0
  let cursor = addDays(day, -1)
  while (set.has(cursor)) {
    count++
    cursor = addDays(cursor, -1)
  }
  return count
}

/**
 * Trenutni niz: računa se do danas, a ako danas još nije upisan,
 * do juče (niz se ne prekida dok dan ne prođe).
 */
export function currentStreak(dates: Iterable<string>, today: string): number {
  const set = new Set(dates)
  const end = set.has(today) ? today : addDays(today, -1)
  if (!set.has(end)) return 0
  return 1 + streakBefore(set, end)
}

export function longestStreak(dates: Iterable<string>): number {
  const sorted = [...new Set(dates)].sort()
  let best = 0
  let run = 0
  let previous: string | null = null
  for (const day of sorted) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }
  return best
}
