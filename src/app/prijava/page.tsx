import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LogoMark } from '@/components/layout/logo'
import { siteConfig } from '@/config/site'
import { LoginForm } from '@/features/auth/login-form'
import { t } from '@/i18n/sr'

export const metadata: Metadata = {
  title: t.auth.title,
  robots: { index: false, follow: false },
}

export default function LoginPage({ searchParams }: PageProps<'/prijava'>) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-sm content-center gap-8 px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-extrabold">
        <LogoMark className="size-9" />
        {siteConfig.shortName}
      </Link>
      <div>
        <h1 className="text-4xl font-extrabold">{t.auth.title}</h1>
        <p className="mt-2 text-ink-soft">{t.auth.intro}</p>
      </div>
      <Suspense fallback={<LoginForm />}>
        {searchParams.then((params) => (
          <LoginForm
            next={typeof params.dalje === 'string' ? params.dalje : undefined}
            initialError={params.greska === 'nije-vlasnik' ? t.auth.notOwner : undefined}
          />
        ))}
      </Suspense>
      <p className="text-sm text-ink-soft">{t.auth.hint}</p>
    </main>
  )
}
