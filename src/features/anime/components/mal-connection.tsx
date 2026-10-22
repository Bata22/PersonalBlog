'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/i18n/sr'
import { disconnectMal } from '../actions'

/**
 * Povezivanje ide običnim linkom (ne formom), jer ruta preusmerava na
 * myanimelist.net, a CSP dozvoljava slanje formi samo na ovaj sajt.
 */
export function MalConnectLink() {
  return (
    <a
      href="/api/admin/mal/povezi"
      className="inline-flex h-11 items-center gap-2 rounded-full bg-btn px-5 font-semibold text-btn-ink hover:opacity-90"
    >
      <Link2 className="size-4" aria-hidden />
      {t.anime.malConnect}
    </a>
  )
}

export function MalDisconnectButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(t.anime.malDisconnectConfirm)) return
        startTransition(async () => {
          await disconnectMal()
          router.refresh()
        })
      }}
    >
      <Unlink className="size-4" aria-hidden />
      {t.anime.malDisconnect}
    </Button>
  )
}
