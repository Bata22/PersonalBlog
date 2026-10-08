'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type NavLinkProps = {
  href: string
  children: ReactNode
  exact?: boolean
  className?: string
  activeClassName?: string
}

/** Link koji zna da li je aktivna stranica (aria-current). */
export function ActiveLink({ href, children, exact, className, activeClassName }: NavLinkProps) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cn(className, active && activeClassName)}>
      {children}
    </Link>
  )
}
