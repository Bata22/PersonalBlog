import type { AttributeId } from './attributes'
import type { EntryKind } from './entry-kinds'

export type BranchRole = 'books' | 'games' | 'anime' | 'journal'

export type SeedBranch = {
  slug: string
  name: string
  icon: string
  description?: string
  /** Samo glavne grane imaju atribut; podgrane ga nasleđuju. */
  attribute?: AttributeId
  /** Ako se izostavi, podgrana preuzima vrstu od roditelja. */
  kind?: EntryKind
  role?: BranchRole
  children?: SeedBranch[]
}

/**
 * Početno stablo. Sadi se jednim klikom na kontrolnoj tabli kad je stablo
 * prazno; posle toga grane menjaš i dodaješ u admin delu (Grane).
 * Redosled ovde = redosled grana na stablu, s leva na desno.
 */
export const DEFAULT_BRANCHES: SeedBranch[] = [
  {
    slug: 'doktorat',
    name: 'Doktorat',
    icon: '🎓',
    attribute: 'intelekt',
    kind: 'post',
    description: 'Doktorske studije i projekti u okviru njih.',
    children: [
      { slug: 'ispiti', name: 'Ispiti', icon: '📝' },
      { slug: 'disertacija', name: 'Disertacija', icon: '📖' },
    ],
  },
  {
    slug: 'projekti',
    name: 'Projekti',
    icon: '🛠️',
    attribute: 'kreativnost',
    kind: 'post',
    description: 'Lični projekti: dokle sam stigao i šta je sledeće.',
    children: [
      {
        slug: 'termalna-kamera',
        name: 'Termalna kamera',
        icon: '🌡️',
        description: 'STM32F103 + MLX90640 + ILI9341, libopencm3 na nivou registara.',
      },
      {
        slug: 'rc-auto',
        name: 'RC auto',
        icon: '🏎️',
        description: 'Arduino Nano + nRF24L01+, 3D štampana šasija.',
      },
      {
        slug: 'led-postolje',
        name: 'LED postolje',
        icon: '💡',
        description: '3D štampano postolje za modele sa LED osvetljenjem.',
      },
      {
        slug: 'esp32-platforma',
        name: 'ESP32 platforma',
        icon: '📡',
        description: 'IoT platforma na ESP32.',
      },
    ],
  },
  {
    slug: 'knjige',
    name: 'Knjige',
    icon: '📚',
    attribute: 'intelekt',
    kind: 'post',
    role: 'books',
    description: 'Moja biblioteka: šta čitam, šta sam pročitao i šta mislim.',
  },
  {
    slug: 'muzika',
    name: 'Muzika',
    icon: '🎵',
    attribute: 'kreativnost',
    kind: 'practice',
    description: 'Sviram i slušam.',
    children: [
      {
        slug: 'sviram',
        name: 'Sviram',
        icon: '🎼',
        kind: 'practice',
        children: [
          { slug: 'gitara', name: 'Gitara', icon: '🎸' },
          { slug: 'klavir', name: 'Klavir', icon: '🎹' },
        ],
      },
      { slug: 'slusam', name: 'Slušam', icon: '🎧', kind: 'post' },
    ],
  },
  {
    slug: 'sport',
    name: 'Sport',
    icon: '💪',
    attribute: 'snaga',
    kind: 'workout',
    description: 'Kalistenika, odbojka i tenis.',
    children: [
      {
        slug: 'kalistenika',
        name: 'Kalistenika',
        icon: '🤸',
        kind: 'workout',
        description: 'Sklekovi, trbušnjaci, zgibovi.',
      },
      { slug: 'odbojka', name: 'Odbojka', icon: '🏐', kind: 'session' },
      { slug: 'tenis', name: 'Tenis', icon: '🎾', kind: 'session' },
    ],
  },
  {
    slug: 'planinarenje',
    name: 'Planinarenje',
    icon: '⛰️',
    attribute: 'avantura',
    kind: 'place',
    description: 'Vrhovi, staze i mesta koja sam obišao.',
  },
  {
    slug: 'odmor',
    name: 'Odmor',
    icon: '🏖️',
    attribute: 'avantura',
    kind: 'place',
    description: 'Putovanja i odmori.',
  },
  {
    slug: 'igre',
    name: 'Igre',
    icon: '🎮',
    attribute: 'duh',
    kind: 'post',
    role: 'games',
    description: 'Igre koje igram, prešao sam ili tek želim.',
  },
  {
    slug: 'anime',
    name: 'Anime',
    icon: '🌸',
    attribute: 'duh',
    kind: 'post',
    role: 'anime',
    description: 'Lista sa MyAnimeList-a i moji komentari.',
  },
  {
    slug: 'dnevnik',
    name: 'Dnevnik',
    icon: '📓',
    attribute: 'duh',
    kind: 'journal',
    role: 'journal',
    description: 'Kraj dana: šta sam radio, na čemu i da li sam odmarao.',
  },
]
