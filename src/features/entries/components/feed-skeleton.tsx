import { Skeleton } from '@/components/ui/misc'

/** Mesto za spisak upisa dok se učitava. */
export function FeedSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-6" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-[3.5rem_1fr] gap-4">
          <Skeleton className="h-12" />
          <div className="grid gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
