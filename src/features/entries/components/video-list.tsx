'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { t } from '@/i18n/sr'
import { youtubeEmbedUrl, youtubeId, youtubeThumbnail, youtubeWatchUrl } from '@/lib/youtube'

/**
 * YouTube se učitava tek na klik (prvo samo sličica): stranica ostaje brza,
 * a YouTube ne dobija posetu dok posetilac ne pusti video.
 */
function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <iframe
        src={`${youtubeEmbedUrl(id)}&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full rounded-2xl border-0 bg-black"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-sunken"
      aria-label={`${t.entries.playVideo}: ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- sličica sa YouTube-a */}
      <img src={youtubeThumbnail(id)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-btn text-btn-ink shadow-soft transition-transform group-hover:scale-105 motion-reduce:transition-none">
          <Play className="ml-1 size-7" aria-hidden />
        </span>
      </span>
    </button>
  )
}

export function VideoList({ urls, title }: { urls: string[]; title: string }) {
  const ids = urls.map(youtubeId).filter((id): id is string => id !== null)
  if (ids.length === 0) return null

  return (
    <ul className="grid gap-4">
      {ids.map((id, i) => (
        <li key={id} className="grid gap-1.5">
          <YouTubeEmbed id={id} title={ids.length > 1 ? `${title} (${i + 1})` : title} />
          <a href={youtubeWatchUrl(id)} className="text-sm text-ink-soft underline-offset-2 hover:underline" rel="noopener noreferrer">
            {t.entries.openOnYoutube}
          </a>
        </li>
      ))}
    </ul>
  )
}
