/**
 * Apsolutna adresa sajta. Redosled:
 *   1. NEXT_PUBLIC_SITE_URL (kad kupiš domen)
 *   2. produkciona adresa koju Vercel sam postavi
 *   3. lokalni razvoj
 */
export function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return 'http://localhost:3000'
}

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${siteOrigin()}/`).toString()
}
