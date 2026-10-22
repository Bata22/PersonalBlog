import { describe, expect, it } from 'vitest'
import { describeCandidate, normalizeListValues, withEpisodes, withStatus, type AnimeListValues } from './model'

const base: AnimeListValues = { status: 'watching', score: 7, episodesWatched: 5 }

describe('anime lista', () => {
  it('"Odgledano" postavlja sve epizode, "Planiram" nulu', () => {
    expect(withStatus(base, 'completed', 12)).toEqual({ status: 'completed', score: 7, episodesWatched: 12 })
    expect(withStatus(base, 'plan_to_watch', 12).episodesWatched).toBe(0)
    expect(withStatus(base, 'on_hold', 12).episodesWatched).toBe(5)
  })

  it('poslednja epizoda završava anime, prva ga pokreće', () => {
    expect(withEpisodes(base, 12, 12).status).toBe('completed')
    expect(withEpisodes({ ...base, status: 'plan_to_watch', episodesWatched: 0 }, 1, 12).status).toBe('watching')
    expect(withEpisodes({ ...base, status: 'completed', episodesWatched: 12 }, 11, 12).status).toBe('watching')
  })

  it('epizode ostaju u granicama', () => {
    expect(withEpisodes(base, 99, 12).episodesWatched).toBe(12)
    expect(withEpisodes(base, -3, 12).episodesWatched).toBe(0)
    expect(withEpisodes(base, 40, null).episodesWatched).toBe(40)
  })

  it('"Planiram" se šalje bez ocene i epizoda', () => {
    expect(normalizeListValues({ status: 'plan_to_watch', score: 9, episodesWatched: 3 }, 12)).toEqual({
      status: 'plan_to_watch',
      score: 0,
      episodesWatched: 0,
    })
  })

  it('opis rezultata pretrage', () => {
    expect(
      describeCandidate({ malId: 1, title: 'x', titleEn: null, imageUrl: null, episodesTotal: 28, mediaType: 'tv', year: 2023 }),
    ).toBe('TV, 2023, 28 ep.')
    expect(
      describeCandidate({ malId: 1, title: 'x', titleEn: null, imageUrl: null, episodesTotal: null, mediaType: 'movie', year: null }),
    ).toBe('Film')
  })
})
