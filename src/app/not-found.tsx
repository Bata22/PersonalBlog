import { LinkButton } from '@/components/ui/button'
import { LogoMark } from '@/components/layout/logo'
import { t } from '@/i18n/sr'

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center justify-items-start gap-4 px-4 py-16">
      <LogoMark className="size-14" />
      <h1 className="text-4xl font-extrabold">{t.errors.pageNotFoundTitle}</h1>
      <p className="text-ink-soft">{t.errors.pageNotFoundBody}</p>
      <LinkButton href="/">{t.errors.toHome}</LinkButton>
    </main>
  )
}
