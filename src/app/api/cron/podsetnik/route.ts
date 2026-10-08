import { timingSafeEqual } from 'node:crypto'
import { runDailyReminder } from '@/features/notifications/reminder'
import { serverEnv } from '@/lib/env-server'

/** Poređenje tajne bez curenja informacija kroz vreme odgovora. */
function authorized(request: Request): boolean {
  const { cronSecret } = serverEnv()
  if (cronSecret.length < 16) return false
  const header = request.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const received = Buffer.from(header)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

/**
 * Poziva ga Supabase pg_cron (vidi supabase/podsetnik.sql).
 * ?proba=1 šalje odmah, bez provere sata — za testiranje.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: 'Neovlašćeno.' }, { status: 401 })
  const force = new URL(request.url).searchParams.get('proba') === '1'
  try {
    const result = await runDailyReminder({ force })
    return Response.json(result)
  } catch (error) {
    console.error('[podsetnik]', error)
    return Response.json({ error: 'Podsetnik nije poslat.' }, { status: 500 })
  }
}
