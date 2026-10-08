import { SESSION_TYPES, type EntryKind } from '@/config/entry-kinds'
import { formatNumber } from '@/lib/format'
import { readMetadata, totalReps } from './metadata'

/**
 * Kratak opis upisa iz njegovih polja ("Sklekovi 3×15, Zgibovi 2×8").
 * Koristi se kao izvod kad upis nema tekst, i u karticama.
 */
export function describeMetadata(kind: EntryKind, raw: unknown): string {
  switch (kind) {
    case 'workout': {
      const meta = readMetadata('workout', raw)
      if (!meta?.exercises.length) return ''
      const parts = meta.exercises.map((ex) => `${ex.name} ${ex.sets.join('+')}`)
      return `${parts.join(', ')} (ukupno ${formatNumber(totalReps(meta))})`
    }
    case 'session': {
      const meta = readMetadata('session', raw)
      if (!meta) return ''
      return [
        SESSION_TYPES[meta.sessionType],
        meta.opponent ? `protiv: ${meta.opponent}` : null,
        meta.result ? `rezultat ${meta.result}` : null,
        meta.durationMin ? `${meta.durationMin} min` : null,
      ]
        .filter(Boolean)
        .join(', ')
    }
    case 'practice': {
      const meta = readMetadata('practice', raw)
      if (!meta) return ''
      return [meta.durationMin ? `${meta.durationMin} min` : null, meta.pieces || null].filter(Boolean).join(': ')
    }
    case 'place': {
      const meta = readMetadata('place', raw)
      if (!meta) return ''
      return [
        meta.location || null,
        meta.distanceKm ? `${formatNumber(meta.distanceKm)} km` : null,
        meta.elevationGainM ? `uspon ${formatNumber(meta.elevationGainM)} m` : null,
      ]
        .filter(Boolean)
        .join(', ')
    }
    case 'journal': {
      const meta = readMetadata('journal', raw)
      return meta?.did ?? ''
    }
    case 'post': {
      const meta = readMetadata('post', raw)
      return meta?.chapter ? `Poglavlje: ${meta.chapter}` : ''
    }
    default:
      return ''
  }
}
