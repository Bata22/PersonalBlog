'use server'

import { z } from 'zod'
import { ownerOrNull } from '@/features/auth/session'
import { t } from '@/i18n/sr'
import { userMessage } from '@/lib/errors'
import { fail, ok, type ActionResult } from '@/lib/result'
import { sendPush } from './push'

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith('https://').max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(4).max(100) }),
})

export type BrowserSubscription = z.input<typeof subscriptionSchema>

export async function savePushSubscription(subscription: BrowserSubscription, userAgent: string): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = subscriptionSchema.safeParse(subscription)
  if (!parsed.success) return fail(t.errors.validation)

  const { error } = await owner.supabase.from('push_subscriptions').upsert(
    {
      owner_id: owner.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: userAgent.slice(0, 300),
    },
    { onConflict: 'endpoint' },
  )
  if (error) return fail(t.errors.generic)
  return ok(null)
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  await owner.supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return ok(null)
}

export async function sendTestNotification(): Promise<ActionResult<{ devices: number }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  try {
    const { data, error } = await owner.supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth')
    if (error) throw error
    const { sent, expired } = await sendPush(data, {
      title: t.notifications.testTitle,
      body: t.notifications.testBody,
      url: '/admin/podesavanja',
      tag: 'proba',
    })
    if (expired.length) await owner.supabase.from('push_subscriptions').delete().in('id', expired)
    return ok({ devices: sent.length })
  } catch (error) {
    return fail(userMessage(error, 'sendTestNotification'))
  }
}
