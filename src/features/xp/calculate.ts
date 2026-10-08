import type { EntryKind } from '@/config/entry-kinds'
import { XP_RULES } from '@/config/xp'
import { totalReps, type MetadataByKind } from '@/features/entries/metadata'
import { t } from '@/i18n/sr'

/**
 * Jedan izvor istine za XP: isti kod računa pregled u formularu (klijent)
 * i konačan XP pri čuvanju (server, kome se ne veruje unos iz pregledača).
 */
export type XpInput = {
  [K in EntryKind]: {
    kind: K
    metadata: MetadataByKind[K]
    words: number
    images: number
    videos: number
    /** Samo za dnevnik: koliko dana zaredom je upisano pre ovog dana. */
    streakDays?: number
  }
}[EntryKind]

export type XpLine = { label: string; xp: number }
export type XpBreakdown = { total: number; lines: XpLine[] }

type StepRule = { every: number; xp: number; max: number }

export function stepBonus(value: number, rule: StepRule): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(rule.max, Math.floor(value / rule.every) * rule.xp)
}

export function calculateXp(input: XpInput): XpBreakdown {
  const lines: XpLine[] = []
  const add = (label: string, xp: number) => {
    if (xp > 0) lines.push({ label, xp })
  }

  add(t.xp.lines.base, XP_RULES.base[input.kind])
  add(t.xp.lines.words, stepBonus(input.words, XP_RULES.words))
  add(t.xp.lines.images, stepBonus(input.images, XP_RULES.images))
  add(t.xp.lines.videos, stepBonus(input.videos, XP_RULES.videos))

  switch (input.kind) {
    case 'workout':
      add(t.xp.lines.reps, stepBonus(totalReps(input.metadata), XP_RULES.workoutReps))
      break
    case 'session':
      add(t.xp.lines.duration, stepBonus(input.metadata.durationMin ?? 0, XP_RULES.sessionMinutes))
      break
    case 'practice':
      add(t.xp.lines.practice, stepBonus(input.metadata.durationMin ?? 0, XP_RULES.practiceMinutes))
      break
    case 'place':
      add(t.xp.lines.distance, stepBonus(input.metadata.distanceKm ?? 0, XP_RULES.placeKm))
      break
    case 'journal':
      add(t.xp.lines.streak, stepBonus(input.streakDays ?? 0, XP_RULES.journalStreak))
      break
    default:
      break
  }

  return { total: lines.reduce((sum, line) => sum + line.xp, 0), lines }
}

/** Broj reči u običnom tekstu (za bonus za duže tekstove). */
export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/u).length : 0
}
