'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { t } from '@/i18n/sr'
import type { ResolvedMedia } from '../types'

/** Mreža sličica; klik otvara sliku preko celog ekrana (strelice, Esc). */
export function Gallery({ items, title }: { items: ResolvedMedia[]; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState<number | null>(null)

  const open = (i: number) => {
    setIndex(i)
    dialogRef.current?.showModal()
  }
  const close = () => dialogRef.current?.close()
  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + items.length) % items.length)),
    [items.length],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    dialog.addEventListener('keydown', onKey)
    return () => dialog.removeEventListener('keydown', onKey)
  }, [step])

  if (items.length === 0) return null
  const current = index === null ? null : items[index]

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => open(i)}
              className="block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sunken"
              aria-label={item.alt || `${title}, slika ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- slike su već smanjene pri slanju */}
              <img
                src={item.thumb}
                alt={item.alt ?? ''}
                width={item.width}
                height={item.height}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:transition-none"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setIndex(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/85"
        aria-label={title}
      >
        {current ? (
          <figure className="grid max-h-[92dvh] w-[min(96vw,1400px)] place-items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- prikaz pune slike */}
            <img
              src={current.src}
              alt={current.alt ?? ''}
              width={current.width}
              height={current.height}
              className="max-h-[82dvh] w-auto rounded-xl object-contain"
            />
            {current.alt ? <figcaption className="text-center text-sm text-white/85">{current.alt}</figcaption> : null}
          </figure>
        ) : null}
        <div className="fixed inset-x-0 bottom-4 flex justify-center gap-2">
          {items.length > 1 ? (
            <button type="button" onClick={() => step(-1)} className="grid size-11 place-items-center rounded-full bg-white/90 text-black" aria-label="Prethodna">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          ) : null}
          <button type="button" onClick={close} className="grid size-11 place-items-center rounded-full bg-white/90 text-black" aria-label={t.common.close}>
            <X className="size-5" aria-hidden />
          </button>
          {items.length > 1 ? (
            <button type="button" onClick={() => step(1)} className="grid size-11 place-items-center rounded-full bg-white/90 text-black" aria-label="Sledeća">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          ) : null}
        </div>
      </dialog>
    </>
  )
}
