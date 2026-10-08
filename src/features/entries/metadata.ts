import { z } from 'zod'
import type { EntryKind } from '@/config/entry-kinds'

/**
 * Polja specifična za svaku vrstu upisa (čuvaju se u entries.metadata).
 * Isti šabloni važe i u formularu i na serveru.
 */

const minutes = (max: number) => z.number().int().min(0).max(max).optional()

export const postMetaSchema = z.object({
  /** Za beleške o knjigama: poglavlje na koje se odnosi. */
  chapter: z.string().trim().max(120).optional(),
  /** Za "Slušam": link ka pesmi ili albumu. */
  link: z.url({ protocol: /^https?$/ }).max(500).optional(),
})

export const placeMetaSchema = z.object({
  location: z.string().trim().max(160).default(''),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  distanceKm: z.number().min(0).max(500).optional(),
  elevationGainM: z.number().int().min(0).max(10000).optional(),
  durationMin: minutes(10080),
})

export const workoutMetaSchema = z.object({
  exercises: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        sets: z.array(z.number().int().min(0).max(1000)).min(1).max(30),
      }),
    )
    .max(20)
    .default([]),
})

export const sessionMetaSchema = z.object({
  sessionType: z.enum(['trening', 'mec']).default('trening'),
  durationMin: minutes(1440),
  result: z.string().trim().max(80).optional(),
  opponent: z.string().trim().max(80).optional(),
})

export const practiceMetaSchema = z.object({
  durationMin: minutes(1440),
  pieces: z.string().trim().max(300).optional(),
})

export const journalMetaSchema = z.object({
  /** Šta sam danas radio. */
  did: z.string().trim().max(4000).default(''),
  /** Na čemu sam radio — id-jevi grana. */
  workedOn: z.array(z.uuid()).max(30).default([]),
  /** Da li sam odmarao. */
  rested: z.boolean().default(false),
  restNote: z.string().trim().max(500).optional(),
})

export const milestoneMetaSchema = z.object({
  event: z.enum(['book_finished', 'game_finished', 'anime_completed', 'anime_import']),
  count: z.number().int().min(0).optional(),
})

export const METADATA_SCHEMAS = {
  post: postMetaSchema,
  place: placeMetaSchema,
  workout: workoutMetaSchema,
  session: sessionMetaSchema,
  practice: practiceMetaSchema,
  journal: journalMetaSchema,
  milestone: milestoneMetaSchema,
} satisfies Record<EntryKind, z.ZodType>

export type MetadataByKind = { [K in EntryKind]: z.infer<(typeof METADATA_SCHEMAS)[K]> }
export type WorkoutMeta = MetadataByKind['workout']
export type JournalMeta = MetadataByKind['journal']

/**
 * Čitanje iz baze: ako je stari upis u drugačijem obliku, ne puca nego
 * vraća prazna polja te vrste.
 */
export function readMetadata<K extends EntryKind>(kind: K, raw: unknown): MetadataByKind[K] | null {
  const parsed = METADATA_SCHEMAS[kind].safeParse(raw ?? {})
  return parsed.success ? (parsed.data as MetadataByKind[K]) : null
}

export function totalReps(meta: Pick<WorkoutMeta, 'exercises'>): number {
  return meta.exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, reps) => s + reps, 0), 0)
}
