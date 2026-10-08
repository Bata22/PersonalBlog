'use client'

import { useId, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button'
import { t } from '@/i18n/sr'
import { discardDraftMedia } from '../actions'
import { MediaError } from '../compress'
import { MAX_MEDIA_PER_ENTRY, type DraftMedia } from '../types'

type Props = {
  items: DraftMedia[]
  onChange: (updater: (items: DraftMedia[]) => DraftMedia[]) => void
  upload: (file: File) => Promise<DraftMedia>
  /** Slike koje su već sačuvane uz upis — njih briše tek čuvanje upisa. */
  savedIds: ReadonlySet<string>
  /** Slike ubačene u tekst — uklanjaju se iz teksta, ne odavde. */
  inlineIds: ReadonlySet<string>
}

export function MediaPicker({ items, onChange, upload, savedIds, inlineIds }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const room = MAX_MEDIA_PER_ENTRY - items.length - pending
    const selected = Array.from(files).slice(0, Math.max(0, room))
    if (selected.length < files.length) setError(t.media.limit(MAX_MEDIA_PER_ENTRY))

    setPending((n) => n + selected.length)
    for (const file of selected) {
      try {
        const media = await upload(file)
        onChange((current) => [...current, media])
      } catch (err) {
        setError(err instanceof MediaError ? err.message : t.media.failed)
      } finally {
        setPending((n) => n - 1)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(item: DraftMedia) {
    onChange((current) => current.filter((m) => m.id !== item.id))
    if (!savedIds.has(item.id)) void discardDraftMedia(item.id)
  }

  function setAlt(id: string, alt: string) {
    onChange((current) => current.map((m) => (m.id === id ? { ...m, alt } : m)))
  }

  return (
    <div className="grid gap-3">
      {items.length > 0 || pending > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="relative aspect-[4/3] bg-sunken">
                {/* eslint-disable-next-line @next/next/no-img-element -- pregled lokalne/potpisane slike */}
                <img src={item.src} alt="" className="size-full object-cover" />
                {inlineIds.has(item.id) ? (
                  <span className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2 py-0.5 text-xs font-semibold">
                    u tekstu
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-surface/90 text-ink shadow-soft hover:bg-surface"
                    aria-label={t.media.remove}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                )}
              </div>
              <label className="block p-2">
                <span className="sr-only">{t.media.alt}</span>
                <input
                  value={item.alt}
                  onChange={(e) => setAlt(item.id, e.target.value)}
                  maxLength={300}
                  placeholder={t.media.alt}
                  className="w-full rounded-lg bg-transparent px-1.5 py-1 text-sm placeholder:text-ink-faint focus:bg-sunken focus:outline-none"
                />
              </label>
            </li>
          ))}
          {Array.from({ length: pending }, (_, i) => (
            <li
              key={`pending-${i}`}
              className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-line-strong text-sm text-ink-soft"
            >
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                {t.media.uploading}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <label htmlFor={inputId} className={buttonClasses('secondary', 'md', 'cursor-pointer')}>
          <ImagePlus className="size-4" aria-hidden />
          {t.media.add}
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
