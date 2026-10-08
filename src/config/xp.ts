/**
 * Pravila za XP. Promeni brojeve ovde i važe za sve nove upise
 * (već dobijen XP ostaje — kao u igri).
 *
 * Svako pravilo "every / xp / max" znači:
 *   za svakih `every` jedinica dobiješ `xp`, ali najviše `max`.
 */
export const XP_RULES = {
  /** Osnovni XP po vrsti upisa. */
  base: {
    post: 20,
    place: 30,
    workout: 15,
    session: 25,
    practice: 15,
    journal: 15,
    milestone: 0,
  },
  images: { every: 1, xp: 2, max: 10 },
  videos: { every: 1, xp: 5, max: 15 },
  /** Duži tekst = više XP-a (broje se reči u tekstu upisa). */
  words: { every: 100, xp: 2, max: 20 },
  /** Kalistenika: ukupan broj ponavljanja u treningu. */
  workoutReps: { every: 10, xp: 1, max: 60 },
  /** Tenis, odbojka...: trajanje u minutima. */
  sessionMinutes: { every: 30, xp: 5, max: 30 },
  /** Muzika: minuti vežbanja. */
  practiceMinutes: { every: 15, xp: 3, max: 30 },
  /** Planinarenje: pređeni kilometri. */
  placeKm: { every: 1, xp: 2, max: 40 },
  /** Dnevnik: +1 XP za svaki dan zaredom pre današnjeg. */
  journalStreak: { every: 1, xp: 1, max: 15 },
  /** Dostignuća u biblioteci. */
  milestones: {
    bookFinished: 100,
    gameFinished: 60,
    animeCompleted: 25,
    /** Prvi uvoz sa MyAnimeList-a: XP po već odgledanom anime-u. */
    animeImportPerItem: 5,
    animeImportMax: 500,
  },
} as const

/**
 * Koliko XP-a treba za nivo. Ukupno za nivo N = osnova × (N−1) × N / 2.
 * Sa osnovom 100: nivo 2 = 100 XP, nivo 3 = 300, nivo 5 = 1000, nivo 10 = 4500.
 */
export const LEVEL_CURVES = {
  character: 100,
  branch: 50,
  attribute: 75,
} as const

/** Od kog nivoa je limun na grani potpuno zreo (žut). */
export const RIPE_AT_LEVEL = 10
