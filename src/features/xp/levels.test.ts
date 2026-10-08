import { describe, expect, it } from 'vitest'
import { levelFromXp, ripeness, xpForLevel } from './levels'

describe('nivoi', () => {
  it('prati krivu osnova × (n−1) × n / 2', () => {
    expect(xpForLevel(1, 100)).toBe(0)
    expect(xpForLevel(2, 100)).toBe(100)
    expect(xpForLevel(5, 100)).toBe(1000)
    expect(xpForLevel(10, 100)).toBe(4500)
  })

  it('pogađa granice nivoa', () => {
    expect(levelFromXp(0, 100).level).toBe(1)
    expect(levelFromXp(99, 100).level).toBe(1)
    expect(levelFromXp(100, 100).level).toBe(2)
    expect(levelFromXp(4499, 100).level).toBe(9)
    expect(levelFromXp(4500, 100).level).toBe(10)
  })

  it('računa napredak kroz nivo', () => {
    const info = levelFromXp(200, 100) // nivo 2: od 100 do 300
    expect(info.level).toBe(2)
    expect(info.progress).toBeCloseTo(0.5)
    expect(info.toNext).toBe(100)
  })

  it('ne puca na čudan unos', () => {
    expect(levelFromXp(-50, 100).level).toBe(1)
    expect(levelFromXp(Number.NaN, 100).level).toBe(1)
  })

  it('limun sazreva sa nivoom', () => {
    expect(ripeness(1)).toBe(0)
    expect(ripeness(10)).toBe(1)
    expect(ripeness(40)).toBe(1)
  })
})
