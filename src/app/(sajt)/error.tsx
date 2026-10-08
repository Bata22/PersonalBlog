'use client'

import { Button } from '@/components/ui/button'
import { t } from '@/i18n/sr'

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto grid max-w-xl justify-items-start gap-4 py-16">
      <h1 className="text-3xl font-extrabold">{t.errors.crashTitle}</h1>
      <p className="text-ink-soft">{t.errors.generic}</p>
      <Button onClick={reset}>{t.errors.retry}</Button>
    </div>
  )
}
