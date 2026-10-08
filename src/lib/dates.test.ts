import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, formatDate, hourInZone, isIsoDate, isoDateInZone } from './dates'

describe('datumi', () => {
  it('računa beogradski datum i sat (leto i zima)', () => {
    // 21:30 UTC leti = 23:30 u Beogradu (CEST, +2)
    const summer = new Date('2026-07-01T21:30:00Z')
    expect(isoDateInZone(summer)).toBe('2026-07-01')
    expect(hourInZone(summer)).toBe(23)
    // 23:30 UTC zimi = 00:30 sledećeg dana (CET, +1)
    const winter = new Date('2026-12-31T23:30:00Z')
    expect(isoDateInZone(winter)).toBe('2027-01-01')
    expect(hourInZone(winter)).toBe(0)
  })

  it('20h i 21h UTC pokrivaju 22h u Beogradu tokom cele godine', () => {
    expect(hourInZone(new Date('2026-07-15T20:00:00Z'))).toBe(22)
    expect(hourInZone(new Date('2026-12-15T21:00:00Z'))).toBe(22)
  })

  it('sabira dane preko promene vremena', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween('2026-10-01', '2026-10-08')).toBe(7)
  })

  it('proverava ISO datum', () => {
    expect(isIsoDate('2026-10-08')).toBe(true)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('08.10.2026')).toBe(false)
  })

  it('formatira datum na srpskom', () => {
    expect(formatDate('2026-10-08')).toMatch(/8\. ?oktobar 2026/)
  })
})
