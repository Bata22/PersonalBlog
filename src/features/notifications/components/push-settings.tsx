'use client'

import { useEffect, useState, useSyncExternalStore, useTransition } from 'react'
import { BellOff, BellRing, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/misc'
import { t } from '@/i18n/sr'
import { vapidPublicKey } from '@/lib/env'
import { removePushSubscription, savePushSubscription, sendTestNotification, type BrowserSubscription } from '../actions'

function base64UrlToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = window.atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

type Support = 'checking' | 'supported' | 'unsupported' | 'ios-needs-install'

const noopSubscribe = () => () => {}

function detectSupport(): Support {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    return ios && !standalone ? 'ios-needs-install' : 'unsupported'
  }
  return 'supported'
}

/** Uključivanje podsetnika na ovom uređaju (push preko service worker-a). */
export function PushSettings() {
  // podrška se zna tek u pregledaču; na serveru je 'checking'
  const detected = useSyncExternalStore(noopSubscribe, detectSupport, () => 'checking' as const)
  const [registrationFailed, setRegistrationFailed] = useState(false)
  const support: Support = registrationFailed ? 'unsupported' : detected
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    if (detected !== 'supported') return
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => registration.pushManager.getSubscription())
      .then(setSubscription)
      .catch(() => setRegistrationFailed(true))
  }, [detected])

  function enable() {
    setMessage(null)
    startTransition(async () => {
      try {
        if (!vapidPublicKey) throw new Error(t.settings.pushNoKey)
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') throw new Error(t.settings.pushDenied)
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
        })
        const result = await savePushSubscription(sub.toJSON() as BrowserSubscription, navigator.userAgent)
        if (!result.ok) {
          await sub.unsubscribe()
          throw new Error(result.error)
        }
        setSubscription(sub)
        setMessage({ tone: 'success', text: t.settings.pushActive })
      } catch (error) {
        setMessage({ tone: 'error', text: error instanceof Error ? error.message : t.errors.generic })
      }
    })
  }

  function disable() {
    if (!subscription) return
    startTransition(async () => {
      await removePushSubscription(subscription.endpoint)
      await subscription.unsubscribe()
      setSubscription(null)
      setMessage(null)
    })
  }

  function test() {
    startTransition(async () => {
      const result = await sendTestNotification()
      setMessage(result.ok ? { tone: 'success', text: t.settings.pushTestSent } : { tone: 'error', text: result.error })
    })
  }

  if (support === 'checking') return <p className="text-ink-soft">{t.common.loading}</p>
  if (support === 'ios-needs-install') return <p className="text-ink-soft">{t.settings.pushIos}</p>
  if (support === 'unsupported') return <p className="text-ink-soft">{t.settings.pushUnsupported}</p>

  return (
    <div className="grid justify-items-start gap-3">
      <p className="text-ink-soft">{subscription ? t.settings.pushActive : t.settings.pushInactive}</p>
      <div className="flex flex-wrap gap-2">
        {subscription ? (
          <>
            <Button variant="secondary" onClick={test} disabled={pending}>
              <Send className="size-4" aria-hidden />
              {t.settings.pushTest}
            </Button>
            <Button variant="ghost" onClick={disable} disabled={pending}>
              <BellOff className="size-4" aria-hidden />
              {t.settings.pushDisable}
            </Button>
          </>
        ) : (
          <Button onClick={enable} disabled={pending}>
            <BellRing className="size-4" aria-hidden />
            {t.settings.pushEnable}
          </Button>
        )}
      </div>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
    </div>
  )
}
