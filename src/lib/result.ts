import type { ZodError } from 'zod'

/**
 * Jedinstven oblik odgovora svih server akcija. Greške su poruke za
 * korisnika (na srpskom), a ne sirove greške iz baze.
 */
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail(error: string, fieldErrors?: Record<string, string>): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, fieldErrors }
}

/** Prva poruka greške za svako polje, ključ je putanja ("metadata.durationMin"). */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (!(key in out)) out[key] = issue.message
  }
  return out
}
