import { t } from '@/i18n/sr'
import type { XpBreakdown } from '../calculate'

/** "Ovaj upis donosi +37 XP", a ispod sitno od čega se sastoji (osnova, tekst, slike...). */
export function XpPreview({ breakdown }: { breakdown: XpBreakdown }) {
  const details = breakdown.lines.map((line) => `${line.label} ${line.xp}`).join(', ')
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm text-ink-soft max-sm:sr-only">{t.entryForm.xpPreview}</span>
        <span className="font-display text-2xl leading-tight font-extrabold text-leaf tabular-nums">
          +{breakdown.total} XP
        </span>
      </p>
      {details ? (
        <p className="truncate text-xs text-ink-soft" title={details}>
          {details}
        </p>
      ) : null}
    </div>
  )
}
