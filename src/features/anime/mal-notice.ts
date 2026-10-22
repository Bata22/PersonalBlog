import { t } from '@/i18n/sr'

/**
 * Ishod povezivanja MAL naloga stiže kao kratak kod u adresi (?mal=povezan),
 * a ne kao tekst, da niko ne bi mogao da podmetne poruku linkom.
 */
export const MAL_NOTICES = {
  povezan: { tone: 'success', text: t.anime.malConnected },
  odbijeno: { tone: 'error', text: t.anime.malDenied },
  ponovo: { tone: 'error', text: t.anime.malReconnect },
  kljuc: { tone: 'error', text: t.errors.missingKey('MAL_CLIENT_SECRET') },
  greska: { tone: 'error', text: t.errors.externalApi('MyAnimeList') },
} as const

export type MalNoticeCode = keyof typeof MAL_NOTICES

export function malNotice(code: string | string[] | undefined) {
  return typeof code === 'string' && code in MAL_NOTICES ? MAL_NOTICES[code as MalNoticeCode] : null
}
