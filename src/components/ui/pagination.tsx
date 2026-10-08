import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { t } from '@/i18n/sr'

/** "Novije / Starije" — strana se nosi u ?strana=N. */
export function Pagination({ page, hasMore, hrefFor }: { page: number; hasMore: boolean; hrefFor: (page: number) => string }) {
  if (page <= 1 && !hasMore) return null
  return (
    <nav aria-label="Strane" className="flex justify-between gap-3 pt-4">
      {page > 1 ? (
        <LinkButton href={hrefFor(page - 1)} variant="secondary" size="sm">
          <ChevronLeft className="size-4" aria-hidden />
          {t.common.newer}
        </LinkButton>
      ) : (
        <span />
      )}
      {hasMore ? (
        <LinkButton href={hrefFor(page + 1)} variant="secondary" size="sm">
          {t.common.older}
          <ChevronRight className="size-4" aria-hidden />
        </LinkButton>
      ) : null}
    </nav>
  )
}

export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(n) && n > 0 && n < 10000 ? n : 1
}
