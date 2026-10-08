import 'server-only'
import { connection } from 'next/server'
import { siteConfig } from '@/config/site'
import { hourInZone, isoDateInZone } from './dates'

/**
 * "Danas" po beogradskom vremenu. connection() kaže Next-u da ovo zavisi od
 * trenutka zahteva (ne sme da se zamrzne u statičnoj stranici).
 */
export async function nowInZone(timeZone: string = siteConfig.timezone) {
  await connection()
  const now = new Date()
  return { today: isoDateInZone(now, timeZone), hour: hourInZone(now, timeZone), now }
}
