import { cn } from '@/lib/cn'

/** Korica knjige / igre / anime, sa rezervnom pločicom kad slike nema. */
export function Cover({
  src,
  title,
  fallback,
  className,
  wide,
}: {
  src: string | null
  title: string
  fallback: string
  className?: string
  /** Igre imaju širok format (16:9), knjige i anime uspravan. */
  wide?: boolean
}) {
  const shape = wide ? 'aspect-video' : 'aspect-[2/3]'
  if (!src) {
    return (
      <div
        className={cn('grid place-items-center rounded-xl bg-sunken text-3xl', shape, className)}
        role="img"
        aria-label={title}
      >
        <span aria-hidden>{fallback}</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- spoljne korice (Open Library, RAWG, MAL)
    <img
      src={src}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={cn('w-full rounded-xl bg-sunken object-cover', shape, className)}
    />
  )
}
