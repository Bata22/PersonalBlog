import { describe, expect, it } from 'vitest'
import { XP_RULES } from '@/config/xp'
import { calculateXp, countWords, stepBonus } from './calculate'

describe('XP', () => {
  it('stepenasti bonus ima gornju granicu', () => {
    expect(stepBonus(250, { every: 100, xp: 2, max: 20 })).toBe(4)
    expect(stepBonus(10_000, { every: 100, xp: 2, max: 20 })).toBe(20)
    expect(stepBonus(-5, { every: 1, xp: 1, max: 5 })).toBe(0)
  })

  it('obična objava: osnova + tekst + slike + video', () => {
    const result = calculateXp({ kind: 'post', metadata: {}, words: 300, images: 3, videos: 1 })
    expect(result.total).toBe(XP_RULES.base.post + 6 + 6 + 5)
    expect(result.lines.map((l) => l.xp).reduce((a, b) => a + b)).toBe(result.total)
  })

  it('kalistenika broji ponavljanja', () => {
    const result = calculateXp({
      kind: 'workout',
      metadata: {
        exercises: [
          { name: 'Sklekovi', sets: [20, 15, 15] },
          { name: 'Zgibovi', sets: [8, 6] },
        ],
      },
      words: 0,
      images: 0,
      videos: 0,
    })
    // 64 ponavljanja → 6 XP bonusa
    expect(result.total).toBe(XP_RULES.base.workout + 6)
  })

  it('dnevnik nagrađuje niz dana', () => {
    const result = calculateXp({
      kind: 'journal',
      metadata: { did: 'radio', workedOn: [], rested: true },
      words: 1,
      images: 0,
      videos: 0,
      streakDays: 40,
    })
    expect(result.total).toBe(XP_RULES.base.journal + XP_RULES.journalStreak.max)
  })

  it('broji reči', () => {
    expect(countWords('  jedan  dva\ntri ')).toBe(3)
    expect(countWords('')).toBe(0)
  })
})
