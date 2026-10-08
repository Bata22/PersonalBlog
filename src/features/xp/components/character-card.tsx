import { ATTRIBUTES, type AttributeId } from '@/config/attributes'
import { XpBar } from '@/components/ui/misc'
import { t } from '@/i18n/sr'
import { formatNumber } from '@/lib/format'
import type { LevelInfo } from '../levels'

/** Ime, titula, nivo i traka do sledećeg nivoa. */
export function CharacterCard({
  name,
  headline,
  level,
  strongest,
}: {
  name: string
  headline?: string | null
  level: LevelInfo
  strongest: AttributeId | null
}) {
  const title = strongest ? ATTRIBUTES[strongest].title : t.character.novice

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-leaf">{title}</p>
          <h1 className="mt-0.5 text-4xl leading-none font-extrabold sm:text-5xl">{name}</h1>
          {headline ? <p className="mt-2 text-ink-soft">{headline}</p> : null}
        </div>
        <div className="shrink-0 text-right" aria-label={`${t.character.level} ${level.level}`}>
          <span className="block text-xs font-semibold text-ink-soft">{t.character.level}</span>
          <span className="font-display text-5xl leading-none font-extrabold tabular-nums">{level.level}</span>
        </div>
      </div>
      <div className="grid gap-1.5">
        <XpBar progress={level.progress} label={`${t.character.level} ${level.level}`} />
        <p className="flex justify-between text-sm text-ink-soft tabular-nums">
          <span>
            {formatNumber(level.xp)} {t.character.xp}
          </span>
          <span>{t.character.toNext(formatNumber(level.toNext))}</span>
        </p>
      </div>
    </div>
  )
}
