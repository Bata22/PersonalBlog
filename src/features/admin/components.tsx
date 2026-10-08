import { Skeleton } from '@/components/ui/misc'

/** Mesto za admin stranicu dok se proverava prijava i učitavaju podaci. */
export function AdminSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-28" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}
