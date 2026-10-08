/**
 * Vrste upisa. Grana bira vrstu, a vrsta bira formular (koja polja vidiš)
 * i osnovni XP (vidi src/config/xp.ts).
 */
export const ENTRY_KINDS = {
  post: {
    label: 'Objava',
    hint: 'Tekst, slike i video',
  },
  place: {
    label: 'Mesto',
    hint: 'Gde si bio: lokacija, kilometri, uspon',
  },
  workout: {
    label: 'Trening snage',
    hint: 'Vežbe i serije ponavljanja',
  },
  session: {
    label: 'Trening ili meč',
    hint: 'Trajanje, rezultat i zapažanja',
  },
  practice: {
    label: 'Vežbanje instrumenta',
    hint: 'Koliko si svirao i šta',
  },
  journal: {
    label: 'Dnevnik',
    hint: 'Kraj dana: šta si radio, na čemu i da li si odmarao',
  },
  milestone: {
    label: 'Dostignuće',
    hint: 'Upisuje se samo kad nešto završiš',
  },
} as const

export type EntryKind = keyof typeof ENTRY_KINDS

/** Vrste koje možeš da dodeliš grani (dnevnik i dostignuća su posebni). */
export const BRANCH_KINDS = ['post', 'place', 'workout', 'session', 'practice'] as const

/** Predlozi vežbi za kalisteniku (možeš da upišeš i bilo koju drugu). */
export const WORKOUT_PRESETS = ['Sklekovi', 'Trbušnjaci', 'Zgibovi', 'Čučnjevi', 'Propadanja'] as const

export const SESSION_TYPES = {
  trening: 'Trening',
  mec: 'Meč',
} as const

export type SessionType = keyof typeof SESSION_TYPES
