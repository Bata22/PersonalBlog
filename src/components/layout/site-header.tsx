import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { t } from '@/i18n/sr'
import { LogoMark } from './logo'
import { NavLink } from './nav-link'

const LINKS = [
  { href: '/objave', label: t.nav.entries },
  { href: '/lik', label: t.nav.character },
  { href: '/knjige', label: t.nav.books },
  { href: '/igre', label: t.nav.games },
  { href: '/anime', label: t.nav.anime },
]

/** Zaglavlje javnog sajta — statično, bez provere prijave (brzo, keširano). */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 pt-3 sm:py-3">
        <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-extrabold">
          <LogoMark className="size-8" />
          {siteConfig.shortName}
        </Link>
        <nav aria-label={t.nav.mainLabel} className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:px-0">
          <ul className="flex gap-1 py-2 sm:py-0">
            {LINKS.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  className="block rounded-full px-3.5 py-1.5 font-semibold whitespace-nowrap text-ink-soft transition-colors hover:text-ink"
                  activeClassName="bg-accent text-accent-ink hover:text-accent-ink"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
