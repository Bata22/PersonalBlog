import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Plus,
  ScrollText,
  Settings,
  Sprout,
} from 'lucide-react'
import { siteConfig } from '@/config/site'
import { signOut } from '@/features/auth/actions'
import { t } from '@/i18n/sr'
import { LogoMark } from './logo'
import { NavLink } from './nav-link'

const n = t.admin.nav

const SECTIONS = [
  { href: '/admin', label: n.dashboard, icon: LayoutDashboard, exact: true },
  { href: '/admin/novo', label: n.new, icon: Plus },
  { href: '/admin/dnevnik', label: n.journal, icon: NotebookPen },
  { href: '/admin/upisi', label: n.entries, icon: ScrollText },
  { href: '/admin/grane', label: n.branches, icon: Sprout },
  { href: '/admin/knjige', label: n.books, icon: BookOpen },
  { href: '/admin/igre', label: n.games, icon: Gamepad2 },
  { href: '/admin/anime', label: n.anime, icon: Clapperboard },
  { href: '/admin/podesavanja', label: n.settings, icon: Settings },
]

/** Donja traka na telefonu: ono što se koristi svaki dan, "Upiši" u sredini. */
const MOBILE = [
  { href: '/admin', label: n.dashboard, icon: LayoutDashboard, exact: true },
  { href: '/admin/dnevnik', label: n.journal, icon: NotebookPen },
  { href: '/admin/novo', label: n.new, icon: Plus, primary: true },
  { href: '/admin/upisi', label: n.entries, icon: ScrollText },
  { href: '/admin/meni', label: 'Još', icon: Menu },
]

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        <LogOut className="size-4.5" aria-hidden />
        {n.signOut}
      </button>
    </form>
  )
}

/** Svi admin linkovi kao lista (bočni meni i stranica "Još" na telefonu). */
export function AdminSectionList() {
  return (
    <ul className="grid gap-1">
      {SECTIONS.map(({ href, label, icon: Icon, exact }) => (
        <li key={href}>
          <NavLink
            href={href}
            exact={exact}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
            activeClassName="bg-accent text-accent-ink hover:bg-accent hover:text-accent-ink"
          >
            <Icon className="size-4.5" aria-hidden />
            {label}
          </NavLink>
        </li>
      ))}
      <li className="mt-2 border-t border-line pt-2">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-ink-soft hover:bg-sunken hover:text-ink">
          <Globe2 className="size-4.5" aria-hidden />
          {n.site}
        </Link>
      </li>
      <li>
        <SignOutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-ink-soft hover:bg-sunken hover:text-ink" />
      </li>
    </ul>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <a href="#sadrzaj" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-btn focus:px-4 focus:py-2 focus:text-btn-ink">
        {t.nav.skip}
      </a>

      <aside className="hidden border-r border-line md:block">
        <div className="sticky top-0 grid gap-6 p-4">
          <Link href="/admin" className="inline-flex items-center gap-2 px-2 pt-2 font-display text-xl font-extrabold">
            <LogoMark className="size-8" />
            {siteConfig.shortName}
          </Link>
          <nav aria-label={n.label}>
            <AdminSectionList />
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
          <Link href="/admin" className="inline-flex items-center gap-2 font-display text-lg font-extrabold">
            <LogoMark className="size-7" />
            {siteConfig.shortName}
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
            <Globe2 className="size-4" aria-hidden />
            {n.site}
          </Link>
        </header>

        <main id="sadrzaj" className="mx-auto max-w-4xl px-4 pt-6 pb-32 md:pt-10 md:pb-16">
          {children}
        </main>
      </div>

      <nav
        aria-label={n.label}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {MOBILE.map(({ href, label, icon: Icon, exact, primary }) => (
            <li key={href} className="grid">
              <NavLink
                href={href}
                exact={exact}
                className="grid h-16 place-items-center gap-0.5 text-[0.7rem] font-semibold text-ink-soft"
                activeClassName="text-ink"
              >
                {primary ? (
                  <span className="grid size-11 place-items-center rounded-full bg-btn text-btn-ink shadow-soft">
                    <Icon className="size-5" aria-hidden />
                  </span>
                ) : (
                  <Icon className="size-5" aria-hidden />
                )}
                <span className={primary ? 'sr-only' : undefined}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
