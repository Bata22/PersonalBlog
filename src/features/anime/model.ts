/**
 * Tipovi i pravila za anime listu koje dele server i pregledač
 * (bez mrežnih poziva, pa može da se uveze i u klijentske komponente).
 */

/** Iste vrednosti kao MyAnimeList API i kolona anime.status u bazi. */
export const MAL_STATUSES = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'] as const
export type MalStatus = (typeof MAL_STATUSES)[number]

/** Rezultat pretrage MAL baze. */
export type AnimeCandidate = {
  malId: number
  title: string
  /** Engleski naslov, ako se razlikuje od glavnog. */
  titleEn: string | null
  imageUrl: string | null
  episodesTotal: number | null
  mediaType: string | null
  year: number | null
}

/** Rezultat pretrage + da li je već na tvojoj listi. */
export type AnimeSearchResult = AnimeCandidate & { onList: { id: string; status: MalStatus } | null }

export type AnimeListValues = { status: MalStatus; score: number; episodesWatched: number }

const clamp = (value: number, total: number | null) => Math.max(0, Math.min(total ?? Number.MAX_SAFE_INTEGER, Math.round(value)))

/**
 * Promena statusa povlači i epizode: "Odgledano" = sve epizode,
 * "Planiram" = nula. Ostali statusi zadržavaju broj epizoda.
 */
export function withStatus(values: AnimeListValues, status: MalStatus, total: number | null): AnimeListValues {
  if (status === 'completed') return { ...values, status, episodesWatched: total ?? values.episodesWatched }
  if (status === 'plan_to_watch') return { ...values, status, episodesWatched: 0 }
  return { ...values, status }
}

/**
 * Promena broja epizoda: poslednja epizoda prebacuje "Gledam" u "Odgledano",
 * a prva gledana epizoda prebacuje "Planiram" u "Gledam".
 */
export function withEpisodes(values: AnimeListValues, episodes: number, total: number | null): AnimeListValues {
  const episodesWatched = clamp(episodes, total)
  let status = values.status
  if (total && episodesWatched === total && status === 'watching') status = 'completed'
  else if (episodesWatched > 0 && status === 'plan_to_watch') status = 'watching'
  else if (status === 'completed' && total && episodesWatched < total) status = 'watching'
  return { ...values, status, episodesWatched }
}

/** Šta se stvarno šalje: epizode u granicama, bez ocene za "Planiram". */
export function normalizeListValues(values: AnimeListValues, total: number | null): AnimeListValues {
  const normalized = withStatus({ ...values, episodesWatched: clamp(values.episodesWatched, total) }, values.status, total)
  return { ...normalized, score: values.status === 'plan_to_watch' ? 0 : Math.max(0, Math.min(10, Math.round(values.score))) }
}

const MEDIA_LABELS: Record<string, string> = { tv: 'TV', movie: 'Film', ova: 'OVA', ona: 'ONA', special: 'Specijal', music: 'Muzika' }

/** "TV, 2023, 28 ep." za prikaz u pretrazi. */
export function describeCandidate(candidate: AnimeCandidate): string {
  return [
    candidate.mediaType ? (MEDIA_LABELS[candidate.mediaType] ?? candidate.mediaType.toUpperCase()) : null,
    candidate.year ? String(candidate.year) : null,
    candidate.episodesTotal ? `${candidate.episodesTotal} ep.` : null,
  ]
    .filter(Boolean)
    .join(', ')
}
