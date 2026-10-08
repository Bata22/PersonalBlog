'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/misc'
import { t } from '@/i18n/sr'
import { syncAnimeFromMal } from '../actions'

export function AnimeSyncButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  function sync() {
    setMessage(null)
    startTransition(async () => {
      const result = await syncAnimeFromMal()
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      const { added, updated, completed } = result.data
      setMessage({ tone: 'success', text: t.anime.syncResult(added, updated, completed) })
      router.refresh()
    })
  }

  return (
    <div className="grid justify-items-start gap-3">
      <Button onClick={sync} disabled={pending}>
        <RefreshCw className={pending ? 'size-4 animate-spin motion-reduce:animate-none' : 'size-4'} aria-hidden />
        {pending ? t.anime.syncing : t.anime.sync}
      </Button>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
    </div>
  )
}
