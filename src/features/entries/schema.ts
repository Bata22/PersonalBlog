import { z } from 'zod'
import { MAX_MEDIA_PER_ENTRY } from '@/features/media/types'
import { t } from '@/i18n/sr'
import { isIsoDate } from '@/lib/dates'
import { youtubeId } from '@/lib/youtube'
import {
  journalMetaSchema,
  placeMetaSchema,
  postMetaSchema,
  practiceMetaSchema,
  sessionMetaSchema,
  workoutMetaSchema,
} from './metadata'

/** Ono što formular šalje serveru. Isti šablon proverava i server. */
const base = {
  id: z.uuid().optional(),
  branchId: z.uuid(),
  title: z.string().trim().min(1, 'Upiši naslov.').max(160),
  occurredOn: z.string().refine(isIsoDate, 'Neispravan datum.'),
  isPublic: z.boolean(),
  /** Tiptap JSON — čisti se posebno (sanitizeDoc). */
  content: z.unknown().nullable(),
  videoUrls: z
    .array(z.string().trim().max(500).refine((url) => youtubeId(url) !== null, t.entryForm.badVideo))
    .max(10),
  mediaIds: z.array(z.uuid()).max(MAX_MEDIA_PER_ENTRY),
  mediaAlts: z.record(z.string(), z.string().max(300)).optional(),
  bookId: z.uuid().nullable().optional(),
  gameId: z.uuid().nullable().optional(),
  animeId: z.uuid().nullable().optional(),
}

export const entryInputSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('post'), metadata: postMetaSchema }),
  z.object({ ...base, kind: z.literal('place'), metadata: placeMetaSchema }),
  z.object({ ...base, kind: z.literal('workout'), metadata: workoutMetaSchema }),
  z.object({ ...base, kind: z.literal('session'), metadata: sessionMetaSchema }),
  z.object({ ...base, kind: z.literal('practice'), metadata: practiceMetaSchema }),
  z.object({ ...base, kind: z.literal('journal'), metadata: journalMetaSchema }),
])

export type EntryInput = z.input<typeof entryInputSchema>
export type ParsedEntryInput = z.output<typeof entryInputSchema>
