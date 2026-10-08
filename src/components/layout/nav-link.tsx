import Link from 'next/link'
import { Suspense } from 'react'
import { ActiveLink, type NavLinkProps } from './active-link'

/**
 * Link u meniju. Trenutna adresa (usePathname) je podatak iz zahteva, pa je
 * označavanje aktivnog linka u <Suspense>: statična stranica dobija običan
 * link, a oznaka "aktivno" se doda u pregledaču — bez pomeranja sadržaja.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className={props.className}>
          {props.children}
        </Link>
      }
    >
      <ActiveLink {...props} />
    </Suspense>
  )
}
