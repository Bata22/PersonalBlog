import { describe, expect, it } from 'vitest'
import { slugify, uniqueSlug } from './slug'

describe('slugify', () => {
  it('uklanja srpske kvačice', () => {
    expect(slugify('Šta sam čitao u Đerdapu')).toBe('sta-sam-citao-u-djerdapu')
    expect(slugify('Ćevapi, žabe i džem')).toBe('cevapi-zabe-i-dzem')
  })

  it('preslovljava ćirilicu', () => {
    expect(slugify('Шта сам радио')).toBe('sta-sam-radio')
    expect(slugify('Љубав и њива')).toBe('ljubav-i-njiva')
  })

  it('čisti znakove i višak crtica', () => {
    expect(slugify('  Meč #3 — 6:4, 7:5!  ')).toBe('mec-3-6-4-7-5')
    expect(slugify('---')).toBe('')
  })

  it('poštuje maksimalnu dužinu bez crtice na kraju', () => {
    const slug = slugify('a'.repeat(50) + ' ' + 'b'.repeat(50), 52)
    expect(slug.length).toBeLessThanOrEqual(52)
    expect(slug.endsWith('-')).toBe(false)
  })
})

describe('uniqueSlug', () => {
  it('vraća osnovu kad je slobodna', () => {
    expect(uniqueSlug('Tenis', [])).toBe('tenis')
  })

  it('dodaje broj kad je zauzeto', () => {
    expect(uniqueSlug('Tenis', ['tenis', 'tenis-2'])).toBe('tenis-3')
  })

  it('koristi rezervni slug kad naslov nema slova', () => {
    expect(uniqueSlug('!!!', [], 'dnevnik')).toBe('dnevnik')
  })
})
