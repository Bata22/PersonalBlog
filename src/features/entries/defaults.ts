import type { EntryFormKind } from './components/entry-form'
import type { MetadataByKind } from './metadata'

/** Prazna polja za novi upis date vrste. */
export function defaultMetadata(kind: EntryFormKind): MetadataByKind[EntryFormKind] {
  switch (kind) {
    case 'place':
      return { location: '' }
    case 'workout':
      return { exercises: [] }
    case 'session':
      return { sessionType: 'trening' }
    case 'practice':
    case 'post':
    default:
      return {}
  }
}

export function asFormKind(kind: string): EntryFormKind {
  return kind === 'place' || kind === 'workout' || kind === 'session' || kind === 'practice' ? kind : 'post'
}
