import Link from 'next/link'
import { Suspense } from 'react'
import { NotebookPen } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { EmptyState, Panel, XpBar } from '@/components/ui/misc'
import { AdminSkeleton } from '@/features/admin/components'
import { PlantDefaultsButton } from '@/features/admin/action-buttons'
import { requireOwner } from '@/features/auth/session'
import { newEntryHref } from '@/features/branches/links'
import { loadBranchTree } from '@/features/branches/queries'
import { characterLevel, flattenTree, indexBranches } from '@/features/branches/tree'
import { EntryFeed } from '@/features/entries/components/entry-feed'
import { getOwnerFeed, getOwnerRecentXp } from '@/features/entries/queries'
import { getJournalDates } from '@/features/journal/queries'
import { currentStreak } from '@/features/journal/streak'
import { getOwnerProfile } from '@/features/profile/queries'
import { t } from '@/i18n/sr'
import { addDays } from '@/lib/dates'
import { formatNumber, pluralize } from '@/lib/format'
import { nowInZone } from '@/lib/today'

export default function DashboardPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}

async function Dashboard() {
  const { supabase, userId } = await requireOwner()
  const { today, hour } = await nowInZone()

  const [tree, profile, journalDates, recent, weekRows] = await Promise.all([
    loadBranchTree(supabase),
    getOwnerProfile(supabase, userId),
    getJournalDates(supabase, addDays(today, -400)),
    getOwnerFeed(supabase, { pageSize: 5 }),
    getOwnerRecentXp(supabase, addDays(today, -6)),
  ])

  const firstName = (profile?.displayName ?? '').split(' ')[0]
  const greeting = <h1 className="text-3xl font-extrabold sm:text-4xl">{t.admin.dashboard.greeting(firstName)}</h1>

  if (tree.length === 0) {
    return (
      <div className="grid gap-8">
        {greeting}
        <EmptyState title={t.admin.dashboard.emptyTreeTitle} action={<PlantDefaultsButton />}>
          {t.admin.dashboard.emptyTreeBody}
        </EmptyState>
      </div>
    )
  }

  const level = characterLevel(tree)
  const streak = currentStreak(journalDates, today)
  const journalDone = journalDates.includes(today)
  const reminderDue = !journalDone && hour >= (profile?.reminderHour ?? 22) - 2

  // XP ove nedelje po glavnoj grani
  const rootOf = new Map(flattenTree(tree).map((node) => [node.id, node.ancestors[0]?.id ?? node.id]))
  const weekByRoot = new Map<string, number>()
  for (const row of weekRows) {
    const root = rootOf.get(row.branch_id)
    if (root) weekByRoot.set(root, (weekByRoot.get(root) ?? 0) + row.xp)
  }
  const weekTotal = [...weekByRoot.values()].reduce((a, b) => a + b, 0)
  const weekMax = Math.max(1, ...weekByRoot.values())

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        {greeting}
        <p className="text-ink-soft">
          {t.journal.streak}: <strong className="text-ink">{pluralize(streak, t.journal.days)}</strong>
        </p>
      </header>

      <section
        className={
          journalDone
            ? 'flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-surface px-5 py-4'
            : 'flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-accent px-5 py-4 text-accent-ink'
        }
      >
        <p className="flex items-center gap-2 font-semibold">
          <NotebookPen className="size-5" aria-hidden />
          {journalDone ? t.admin.dashboard.journalDone : t.admin.dashboard.journalMissing}
        </p>
        <LinkButton href="/admin/dnevnik" variant={journalDone ? 'secondary' : 'primary'} size={reminderDue ? 'lg' : 'md'}>
          {journalDone ? t.admin.dashboard.editDay : t.admin.dashboard.writeDay}
        </LinkButton>
      </section>

      <section aria-labelledby="gde-upisujes" className="grid gap-3">
        <h2 id="gde-upisujes" className="text-2xl font-bold">
          {t.admin.dashboard.quickAdd}
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {tree.map((node) => (
            <li key={node.id}>
              <Link
                href={newEntryHref(node)}
                className="grid h-full gap-1 rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-ink"
              >
                <span className="text-2xl" aria-hidden>
                  {node.icon}
                </span>
                <span className="font-semibold">{node.name}</span>
                <span className="text-xs text-ink-soft tabular-nums">
                  {t.character.levelShort} {node.level.level}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">{t.character.level} {level.level}</h2>
            <Link href="/lik" className="text-sm font-semibold text-leaf hover:underline">
              {t.character.title}
            </Link>
          </div>
          <XpBar progress={level.progress} label={`${t.character.level} ${level.level}`} className="mt-3" />
          <p className="mt-2 text-sm text-ink-soft tabular-nums">
            {formatNumber(level.xp)} XP, {t.character.toNext(formatNumber(level.toNext))}
          </p>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold">
            {t.admin.dashboard.thisWeek} <span className="text-leaf tabular-nums">+{formatNumber(weekTotal)}</span>
          </h2>
          {weekTotal === 0 ? (
            <p className="mt-2 text-ink-soft">{t.admin.dashboard.thisWeekEmpty}</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {tree
                .filter((node) => weekByRoot.has(node.id))
                .sort((a, b) => (weekByRoot.get(b.id) ?? 0) - (weekByRoot.get(a.id) ?? 0))
                .map((node) => {
                  const xp = weekByRoot.get(node.id) ?? 0
                  return (
                    <li key={node.id} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-2 text-sm">
                      <span className="truncate">
                        <span aria-hidden>{node.icon}</span> {node.name}
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-sunken">
                        <span className="xp-fill block h-full rounded-full" style={{ width: `${(xp / weekMax) * 100}%` }} />
                      </span>
                      <span className="text-right font-semibold tabular-nums">+{xp}</span>
                    </li>
                  )
                })}
            </ul>
          )}
        </Panel>
      </div>

      <section aria-labelledby="poslednji" className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 id="poslednji" className="text-2xl font-bold">
            {t.admin.dashboard.recent}
          </h2>
          <LinkButton href="/admin/upisi" variant="ghost" size="sm">
            {t.admin.dashboard.allEntries}
          </LinkButton>
        </div>
        {recent.items.length > 0 ? (
          <EntryFeed
            items={recent.items}
            branches={indexBranches(tree)}
            hrefFor={(e) => `/admin/upisi/${e.id}`}
            showVisibility
            supabase={supabase}
          />
        ) : (
          <EmptyState title={t.admin.dashboard.recentEmpty} />
        )}
      </section>
    </div>
  )
}
