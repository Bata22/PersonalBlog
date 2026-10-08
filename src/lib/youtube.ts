const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set(['youtube.com', 'music.youtube.com', 'youtube-nocookie.com'])

/**
 * Izvlači ID videa iz bilo kog uobičajenog YouTube linka
 * (watch?v=, youtu.be/, /shorts/, /live/, /embed/). Vraća null za sve ostalo.
 */
export function youtubeId(input: string): string | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.replace(/^(www|m)\./, '')
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0] ?? ''
    return VIDEO_ID.test(id) ? id : null
  }
  if (!YOUTUBE_HOSTS.has(host)) return null

  if (url.pathname === '/watch') {
    const id = url.searchParams.get('v') ?? ''
    return VIDEO_ID.test(id) ? id : null
  }
  const match = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})(?:\/|$)/)
  return match?.[1] ?? null
}

/** Ugrađeni plejer bez kolačića za praćenje. */
export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`
export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`
