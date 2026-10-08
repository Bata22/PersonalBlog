/**
 * Registar paleta boja. Same boje su u `src/styles/palettes.css`.
 *
 * Nova paleta:
 *   1. kopiraj jedan blok u palettes.css i promeni boje,
 *   2. dodaj red ovde (id mora da se poklapa sa data-palette u CSS-u).
 * Posle toga se pojavljuje u Podešavanjima, gde je možeš probati.
 */
export const PALETTES = [
  {
    id: 'limun',
    label: 'Limun',
    description: 'Pastelno žuto-zelena, podrazumevana',
    swatch: ['#f8fae6', '#eef28a', '#4f7a26'],
  },
  {
    id: 'mint',
    label: 'Mint',
    description: 'Hladnija, zelenkasto-plava',
    swatch: ['#f1faf6', '#bdf0d8', '#2d7457'],
  },
  {
    id: 'breskva',
    label: 'Breskva',
    description: 'Topla, pastelno narandžasta',
    swatch: ['#fff7f1', '#ffd8bf', '#a0482a'],
  },
] as const

export type PaletteId = (typeof PALETTES)[number]['id']

/** Paleta koju vide svi posetioci. Promeni ovde kad odlučiš konačnu. */
export const DEFAULT_PALETTE: PaletteId = 'limun'

/** Ključ u localStorage pod kojim se pamti paleta izabrana na uređaju. */
export const PALETTE_STORAGE_KEY = 'paleta'

/** Boja trake pregledača i ikonice aplikacije (svetla / tamna tema). */
export const THEME_COLOR = { light: '#f8fae6', dark: '#161b0f' } as const

export function isPaletteId(value: unknown): value is PaletteId {
  return PALETTES.some((p) => p.id === value)
}
