import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { SESSION_TYPES, type EntryKind } from '@/config/entry-kinds'
import type { BranchIndex } from '@/features/branches/tree'
import { t } from '@/i18n/sr'
import { formatNumber } from '@/lib/format'
import { readMetadata, totalReps } from '../metadata'

function Facts({ items }: { items: [string, ReactNode][] }) {
  const visible = items.filter(([, value]) => value !== null && value !== undefined && value !== '')
  if (visible.length === 0) return null
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-[20px] bg-sunken px-5 py-4 sm:grid-cols-3">
      {visible.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
          <dd className="mt-0.5 font-semibold break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Podaci specifični za vrstu upisa (serije, kilometri, rezultat...). */
export function EntryDetails({ kind, metadata, branches }: { kind: EntryKind; metadata: unknown; branches: BranchIndex }) {
  switch (kind) {
    case 'place': {
      const meta = readMetadata('place', metadata)
      if (!meta) return null
      const map =
        meta.lat !== undefined && meta.lng !== undefined
          ? `https://www.openstreetmap.org/?mlat=${meta.lat}&mlon=${meta.lng}#map=14/${meta.lat}/${meta.lng}`
          : null
      return (
        <div className="grid gap-2">
          <Facts
            items={[
              [t.entryForm.place.location, meta.location],
              [t.entryForm.place.distanceKm, meta.distanceKm ? `${formatNumber(meta.distanceKm)} km` : null],
              [t.entryForm.place.elevationGainM, meta.elevationGainM ? `${formatNumber(meta.elevationGainM)} m` : null],
              [t.entryForm.place.durationMin, meta.durationMin ? `${meta.durationMin} min` : null],
            ]}
          />
          {map ? (
            <a href={map} rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf hover:underline">
              <MapPin className="size-4" aria-hidden />
              {t.entryForm.place.openMap}
            </a>
          ) : null}
        </div>
      )
    }
    case 'workout': {
      const meta = readMetadata('workout', metadata)
      if (!meta?.exercises.length) return null
      return (
        <div className="overflow-hidden rounded-[20px] border border-line">
          <table className="w-full text-left">
            <thead className="bg-sunken text-sm text-ink-soft">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t.entryForm.workout.exercise}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t.entryForm.workout.sets}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {meta.exercises.map((ex, i) => (
                <tr key={`${ex.name}-${i}`} className="border-t border-line">
                  <th scope="row" className="px-4 py-2.5 font-semibold">{ex.name}</th>
                  <td className="px-4 py-2.5 tabular-nums">{ex.sets.join(' + ')}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{ex.sets.reduce((a, b) => a + b, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line-strong">
                <th scope="row" colSpan={2} className="px-4 py-2.5 font-semibold">{t.entryForm.workout.total}</th>
                <td className="px-4 py-2.5 text-right font-display text-lg font-extrabold tabular-nums">{totalReps(meta)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )
    }
    case 'session': {
      const meta = readMetadata('session', metadata)
      if (!meta) return null
      return (
        <Facts
          items={[
            [t.entryForm.session.type, SESSION_TYPES[meta.sessionType]],
            [t.entryForm.session.opponent, meta.opponent],
            [t.entryForm.session.result, meta.result],
            [t.entryForm.session.durationMin, meta.durationMin ? `${meta.durationMin} min` : null],
          ]}
        />
      )
    }
    case 'practice': {
      const meta = readMetadata('practice', metadata)
      if (!meta) return null
      return (
        <Facts
          items={[
            [t.entryForm.practice.durationMin, meta.durationMin ? `${meta.durationMin} min` : null],
            [t.entryForm.practice.pieces, meta.pieces],
          ]}
        />
      )
    }
    case 'journal': {
      const meta = readMetadata('journal', metadata)
      if (!meta) return null
      return (
        <div className="grid gap-5">
          {meta.did ? (
            <section>
              <h2 className="text-lg font-bold">{t.journal.did}</h2>
              <p className="mt-1.5 whitespace-pre-line">{meta.did}</p>
            </section>
          ) : null}
          {meta.workedOn.length > 0 ? (
            <section>
              <h2 className="text-lg font-bold">{t.journal.workedOn}</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {meta.workedOn.map((id) =>
                  branches[id] ? (
                    <li key={id} className="rounded-full bg-sunken px-3 py-1 text-sm font-semibold">
                      <span aria-hidden>{branches[id].icon}</span> {branches[id].name}
                    </li>
                  ) : null,
                )}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className="text-lg font-bold">{t.journal.rested}</h2>
            <p className="mt-1.5">
              {meta.rested ? t.common.yes : t.common.no}
              {meta.restNote ? `: ${meta.restNote}` : null}
            </p>
          </section>
        </div>
      )
    }
    case 'post': {
      const meta = readMetadata('post', metadata)
      if (!meta?.chapter && !meta?.link) return null
      return (
        <Facts
          items={[
            [t.entryForm.chapter, meta.chapter],
            [
              t.entryForm.link,
              meta.link ? (
                <a href={meta.link} rel="noopener noreferrer" className="text-leaf underline underline-offset-2">
                  {new URL(meta.link).hostname.replace(/^www\./, '')}
                </a>
              ) : null,
            ],
          ]}
        />
      )
    }
    default:
      return null
  }
}
