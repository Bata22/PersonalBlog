import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { t } from '@/i18n/sr'

export default function SiteLayout({ children }: { children: ReactNode }) {
  // podnožje je uvek na dnu ekrana, i kad je stranica kratka
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#sadrzaj"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-btn focus:px-4 focus:py-2 focus:text-btn-ink"
      >
        {t.nav.skip}
      </a>
      <SiteHeader />
      <main id="sadrzaj" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 sm:pt-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
