import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { t } from '@/i18n/sr'

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-soft">
        <p>
          {siteConfig.author.name}. {t.footer.madeWith}
        </p>
        <ul className="flex flex-wrap gap-4">
          <li>
            <a href="/rss.xml" className="hover:text-ink">
              {t.nav.rss}
            </a>
          </li>
          <li>
            <a href={siteConfig.author.github} rel="me noopener" className="hover:text-ink">
              {t.nav.github}
            </a>
          </li>
          <li>
            <Link href="/admin" prefetch={false} className="hover:text-ink">
              {t.nav.login}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}
