/**
 * Osnovni podaci o sajtu. Sve što se ponavlja na više mesta (ime, opis,
 * jezik, vremenska zona) menja se samo ovde.
 */
export const siteConfig = {
  name: 'Bratislav Nikolić',
  shortName: 'Bratislav',
  tagline: 'Dnevnik jednog lika u razvoju',
  description:
    'Lični dnevnik i blog Bratislava Nikolića: doktorske studije, embedded projekti, sport, muzika, knjige, igre i planine. Svaki upis donosi XP, a stablo veština raste.',
  /** BCP 47 oznaka jezika za <html lang> i Intl formatiranje. */
  lang: 'sr-Latn',
  locale: 'sr-Latn-RS',
  ogLocale: 'sr_RS',
  timezone: 'Europe/Belgrade',
  author: {
    name: 'Bratislav Nikolić',
    github: 'https://github.com/Bata22',
  },
  /** Koliko upisa staje na jednu stranu javnog spiska. */
  pageSize: 12,
} as const
