import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader, Panel, Skeleton } from '@/components/ui/misc'
import { CleanOrphansButton } from '@/features/admin/action-buttons'
import { requireOwner } from '@/features/auth/session'
import { PushSettings } from '@/features/notifications/components/push-settings'
import { ProfileForm } from '@/features/profile/profile-form'
import { getOwnerProfile } from '@/features/profile/queries'
import { PaletteSwitcher } from '@/features/theme/palette-switcher'
import { t } from '@/i18n/sr'

export const metadata: Metadata = { title: t.settings.title }

export default function SettingsPage() {
  return (
    <div className="grid gap-8">
      <PageHeader title={t.settings.title} />

      <Panel>
        <h2 className="mb-4 text-2xl font-bold">{t.settings.profile}</h2>
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Profile />
        </Suspense>
      </Panel>

      <Panel>
        <h2 className="mb-1 text-2xl font-bold">{t.settings.reminder}</h2>
        <p className="mb-4 text-sm text-ink-soft">{t.settings.reminderHint}</p>
        <PushSettings />
      </Panel>

      <Panel>
        <h2 className="mb-1 text-2xl font-bold">{t.settings.palette}</h2>
        <p className="mb-4 text-sm text-ink-soft">{t.settings.paletteHint}</p>
        <PaletteSwitcher />
      </Panel>

      <Panel>
        <h2 className="mb-1 text-2xl font-bold">{t.settings.maintenance}</h2>
        <p className="mb-4 text-sm text-ink-soft">{t.settings.cleanOrphansHint}</p>
        <CleanOrphansButton />
      </Panel>
    </div>
  )
}

async function Profile() {
  const { supabase, userId } = await requireOwner()
  const profile = await getOwnerProfile(supabase, userId)
  return (
    <ProfileForm
      initial={{
        displayName: profile?.displayName ?? '',
        headline: profile?.headline ?? '',
        bio: profile?.bio ?? '',
        showStatsPublicly: profile?.showStatsPublicly ?? true,
        malUsername: profile?.malUsername ?? '',
        reminderEnabled: profile?.reminderEnabled ?? true,
        reminderHour: profile?.reminderHour ?? 22,
      }}
    />
  )
}
