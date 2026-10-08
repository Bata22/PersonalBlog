'use client'

import { useId, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/controls'
import { t } from '@/i18n/sr'
import { youtubeId, youtubeThumbnail } from '@/lib/youtube'

/** Spisak YouTube linkova: nalepi link, vidi sličicu, ukloni. */
export function VideoInput({ value, onChange, max = 10 }: { value: string[]; onChange: (urls: string[]) => void; max?: number }) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add() {
    const url = draft.trim()
    if (!url) return
    if (!youtubeId(url)) return setError(t.entryForm.badVideo)
    if (!value.includes(url)) onChange([...value, url].slice(0, max))
    setDraft('')
    setError(null)
  }

  return (
    <div className="grid gap-3">
      {value.length > 0 ? (
        <ul className="grid gap-2">
          {value.map((url) => {
            const videoId = youtubeId(url)
            return (
              <li key={url} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2">
                {videoId ? (
                  // eslint-disable-next-line @next/next/no-img-element -- sličica sa YouTube-a
                  <img src={youtubeThumbnail(videoId)} alt="" className="h-14 w-24 shrink-0 rounded-lg bg-sunken object-cover" />
                ) : null}
                <span className="min-w-0 flex-1 truncate text-sm">{url}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((u) => u !== url))}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-sunken"
                  aria-label={t.common.remove}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
      {value.length < max ? (
        <div className="flex gap-2">
          <label htmlFor={id} className="sr-only">
            {t.entryForm.videos}
          </label>
          <Input
            id={id}
            type="url"
            inputMode="url"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            placeholder={t.entryForm.videoPlaceholder}
            aria-invalid={error ? true : undefined}
          />
          <Button variant="secondary" onClick={add} className="shrink-0">
            <Plus className="size-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">{t.entryForm.addVideo}</span>
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
