import 'server-only'
import webpush, { WebPushError } from 'web-push'
import { vapidPublicKey } from '@/lib/env'
import { serverEnv } from '@/lib/env-server'
import { t } from '@/i18n/sr'
import { UserError } from '@/lib/errors'

export type PushPayload = { title: string; body: string; url: string; tag?: string }

type StoredSubscription = { id: string; endpoint: string; p256dh: string; auth: string }

let configured = false

function configure() {
  if (configured) return
  const { vapidPrivateKey, vapidSubject } = serverEnv()
  if (!vapidPublicKey || !vapidPrivateKey) throw new UserError(t.errors.missingKey('VAPID ključevi'))
  webpush.setVapidDetails(vapidSubject || 'mailto:admin@example.com', vapidPublicKey, vapidPrivateKey)
  configured = true
}

/**
 * Šalje obaveštenje na sve sačuvane uređaje. Pretplate koje su istekle
 * (410/404) vraća u `expired` da ih pozivalac obriše.
 */
export async function sendPush(subscriptions: StoredSubscription[], payload: PushPayload) {
  configure()
  const body = JSON.stringify(payload)
  const sent: string[] = []
  const expired: string[] = []

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 60 * 60 * 4, urgency: 'normal', topic: payload.tag?.slice(0, 32) },
        )
        sent.push(sub.id)
      } catch (error) {
        if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
          expired.push(sub.id)
        } else {
          console.error('[push]', error)
        }
      }
    }),
  )

  return { sent, expired }
}
