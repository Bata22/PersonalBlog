import { describe, expect, it } from 'vitest'
import { currentStreak, longestStreak, streakBefore } from './streak'

const days = ['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-07']

describe('niz dana', () => {
  it('broji dane zaredom pre datog dana', () => {
    expect(streakBefore(days, '2026-10-06')).toBe(3)
    expect(streakBefore(days, '2026-10-08')).toBe(1)
    expect(streakBefore(days, '2026-10-03')).toBe(0)
  })

  it('trenutni niz se ne prekida dok današnji dan traje', () => {
    expect(currentStreak(days, '2026-10-07')).toBe(1)
    expect(currentStreak(days, '2026-10-08')).toBe(1)
    expect(currentStreak(days, '2026-10-09')).toBe(0)
    expect(currentStreak([...days, '2026-10-06'], '2026-10-07')).toBe(5)
  })

  it('najduži niz', () => {
    expect(longestStreak(days)).toBe(3)
    expect(longestStreak([])).toBe(0)
  })
})
