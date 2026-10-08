import { RIPE_AT_LEVEL } from '@/config/xp'

export type LevelInfo = {
  level: number
  xp: number
  /** XP na kome je počeo trenutni nivo. */
  levelStart: number
  /** XP potreban za sledeći nivo. */
  nextLevelAt: number
  /** Napredak kroz trenutni nivo, 0–1. */
  progress: number
  toNext: number
}

/** Ukupan XP potreban da se dostigne nivo (nivo 1 = 0 XP). */
export function xpForLevel(level: number, base: number): number {
  return (base * (level - 1) * level) / 2
}

export function levelFromXp(xp: number, base: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0))
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * safeXp) / base)) / 2))
  // ispravka za grešku zaokruživanja kod korena
  while (xpForLevel(level + 1, base) <= safeXp) level++
  while (level > 1 && xpForLevel(level, base) > safeXp) level--

  const levelStart = xpForLevel(level, base)
  const nextLevelAt = xpForLevel(level + 1, base)
  return {
    level,
    xp: safeXp,
    levelStart,
    nextLevelAt,
    progress: (safeXp - levelStart) / (nextLevelAt - levelStart),
    toNext: nextLevelAt - safeXp,
  }
}

/** Koliko je limun zreo (0 = zelen, 1 = žut), na osnovu nivoa grane. */
export function ripeness(level: number): number {
  return Math.min(1, Math.max(0, (level - 1) / (RIPE_AT_LEVEL - 1)))
}
