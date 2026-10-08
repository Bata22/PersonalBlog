import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EmptyState, PageHeader, Panel } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { PlantDefaultsButton } from '@/features/admin/action-buttons'
import { requireOwner } from '@/features/auth/session'
import { loadBranchTree } from '@/features/branches/queries'
import { flattenTree } from '@/features/branches/tree'
import { readMetadata } from '@/features/entries/metadata'
import { JournalForm } from '@/features/journal/components/journal-form'
import { JournalHeatmap } from '@/features/journal/components/journal-heatmap'
import { getJournalBranchId, getJournalDates, getJournalEntry } from '@/features/journal/queries'
import { currentStreak, longestStreak, streakBefore } from '@/features/journal/streak'
import { t } from '@/i18n/sr'
import { addDays, formatDate, isIsoDate, weekdayName } from '@/lib/dates'
import { pluralize } from '@/lib/format'
import { nowInZone } from '@/lib/today'

export const metadata: Metadata = { title: t.journal.title }

export default function JournalPage({ searchParams }: PageProps<'/admin/dnevnik'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Journal searchParams={searchParams} />
    </Suspense>
  )
}

async function Journal({ searchParams }: Pick<PageProps<'/admin/dnevnik'>, 'searchParams'>) {
  const { supabase } = await requireOwner()
  const [params, { today }] = await Promise.all([searchParams, nowInZone()])
  const requested = typeof params.dan === 'string' && isIsoDate(params.dan) ? params.dan : today
  const day = requested > today ? today : requested

  const [branchId, entry, dates, tree] = await Promise.all([
    getJournalBranchId(supabase),
    getJournalEntry(supabase, day),
    getJournalDates(supabase, addDays(today, -400)),
    loadBranchTree(supabase),
  ])

  if (!branchId) {
    return <EmptyState title={t.admin.dashboard.emptyTreeTitle} action={<PlantDefaultsButton />} />
  }

  const meta = entry ? readMetadata('journal', entry.metadata) : null
  const choices = flattenTree(tree)
    .filter((node) => node.role !== 'journal')
    .map((node) => ({ id: node.id, name: node.name, icon: node.icon }))
  const history = dates.filter((d) => d !== day).slice(0, 10)

  return (
    <div className="grid gap-8">
      <PageHeader title={t.journal.title} intro={t.journal.intro} />

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <dl className="flex gap-8">
          <div>
            <dt className="text-sm text-ink-soft">{t.journal.streak}</dt>
            <dd className="font-display text-3xl font-extrabold">{pluralize(currentStreak(dates, today), t.journal.days)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">{t.journal.longest}</dt>
            <dd className="font-display text-3xl font-extrabold">{pluralize(longestStreak(dates), t.journal.days)}</dd>
          </div>
        </dl>
        <JournalHeatmap dates={dates} today={today} />
      </div>

      <Panel>
        <h2 className="mb-5 text-2xl font-bold">
          {weekdayName(day)}, {formatDate(day)}
        </h2>
        <JournalForm
          key={day}
          existing={Boolean(entry)}
          branches={choices}
          streakBefore={streakBefore(dates, day)}
          initial={{
            occurredOn: day,
            isPublic: entry?.is_public ?? false,
            did: meta?.did ?? '',
            workedOn: meta?.workedOn ?? [],
            rested: meta?.rested ?? false,
            restNote: meta?.restNote ?? '',
          }}
        />
      </Panel>

      <section aria-labelledby="ranije" className="grid gap-3">
        <h2 id="ranije" className="text-2xl font-bold">
          {t.journal.history}
        </h2>
        {history.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {history.map((d) => (
              <li key={d}>
                <Link
                  href={`/admin/dnevnik?dan=${d}`}
                  className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-sm font-semibold hover:border-ink"
                >
                  {formatDate(d)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">{t.journal.historyEmpty}</p>
        )}
      </section>
    </div>
  )
}
