import Link from 'next/link'
import { t } from '@/i18n/sr'
import { addDays, formatDate } from '@/lib/dates'
import { cn } from '@/lib/cn'

const WEEKS = 12

/** Poslednjih 12 nedelja: svaki kvadrat je dan, popunjen ako je upisan. */
export function JournalHeatmap({ dates, today }: { dates: string[]; today: string }) {
  const done = new Set(dates)
  // ponedeljak tekuće nedelje
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
  const start = addDays(today, -weekday - (WEEKS - 1) * 7)
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(start, i))

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold">{t.journal.heatmap}</h2>
      <ol className="grid w-fit grid-flow-col grid-rows-7 gap-1">
        {days.map((day) => {
          const future = day > today
          const filled = done.has(day)
          const label = t.journal.heatmapDay(formatDate(day), filled)
          return (
            <li key={day}>
              {future ? (
                <span className="block size-4 rounded-[5px]" aria-hidden />
              ) : (
                <Link
                  href={`/admin/dnevnik?dan=${day}`}
                  aria-label={label}
                  title={label}
                  className={cn(
                    'block size-4 rounded-[5px] transition-transform hover:scale-125 motion-reduce:transition-none',
                    filled ? 'bg-accent-strong ring-1 ring-ink/25' : 'bg-sunken',
                    day === today && 'outline-2 outline-offset-1 outline-leaf',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
