/**
 * Oznake keša za javne stranice. Javni podaci se keširaju ('use cache' +
 * cacheTag), a server akcije posle izmene pozivaju updateTag sa istom oznakom.
 */
export const CACHE_TAGS = {
  profile: 'profil',
  branches: 'grane',
  xp: 'xp',
  entries: 'upisi',
  entry: (slug: string) => `upis:${slug}`,
  books: 'knjige',
  games: 'igre',
  anime: 'anime',
} as const
