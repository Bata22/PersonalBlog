import 'server-only'
import { streakBefore } from '@/features/journal/streak'
import { t } from '@/i18n/sr'
import { addDays, hourInZone, isoDateInZone } from '@/lib/dates'
import { createSecretClient } from '@/lib/supabase/secret'
import { sendPush } from './push'

export type ReminderResult =
  | { status: 'sent'; devices: number }
  | { status: 'skipped'; reason: 'disabled' | 'not-the-hour' | 'already-written' | 'no-devices' | 'no-owner' }

/**
 * Podsetnik za dnevnik. Poziva ga cron na početku svakog sata; šalje samo
 * ako je u vlasnikovoj vremenskoj zoni upravo sat podsetnika (iz Podešavanja)
 * i ako dnevnik za danas još nije upisan.
 */
export async function runDailyReminder({ force = false, now = new Date() } = {}): Promise<ReminderResult> {
  const supabase = createSecretClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, timezone, reminder_enabled, reminder_hour')
    .eq('is_owner', true)
    .maybeSingle()
  if (error) throw error
  if (!profile) return { status: 'skipped', reason: 'no-owner' }
  if (!profile.reminder_enabled && !force) return { status: 'skipped', reason: 'disabled' }
  if (!force && hourInZone(now, profile.timezone) !== profile.reminder_hour) {
    return { status: 'skipped', reason: 'not-the-hour' }
  }

  const today = isoDateInZone(now, profile.timezone)
  const { data: dates, error: datesError } = await supabase
    .from('entries')
    .select('occurred_on')
    .eq('owner_id', profile.id)
    .eq('kind', 'journal')
    .gte('occurred_on', addDays(today, -400))
  if (datesError) throw datesError
  const days = dates.map((d) => d.occurred_on)
  if (days.includes(today) && !force) return { status: 'skipped', reason: 'already-written' }

  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('owner_id', profile.id)
  if (subsError) throw subsError
  if (subscriptions.length === 0) return { status: 'skipped', reason: 'no-devices' }

  const streak = streakBefore(days, today)
  const { sent, expired } = await sendPush(subscriptions, {
    title: t.notifications.title,
    body: t.notifications.body(streak),
    url: '/admin/dnevnik',
    tag: 'dnevnik',
  })

  if (expired.length > 0) await supabase.from('push_subscriptions').delete().in('id', expired)
  if (sent.length > 0) {
    await supabase.from('push_subscriptions').update({ last_sent_at: now.toISOString() }).in('id', sent)
  }
  return { status: 'sent', devices: sent.length }
}
