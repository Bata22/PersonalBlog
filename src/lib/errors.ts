import { DocTooLargeError } from '@/features/editor/doc'
import { t } from '@/i18n/sr'

/** Greška čija poruka sme da se pokaže korisniku (na srpskom). */
export class UserError extends Error {}

/** Pretvara bilo koju grešku u poruku za korisnika; neočekivane loguje. */
export function userMessage(error: unknown, context: string): string {
  if (error instanceof UserError || error instanceof DocTooLargeError) return error.message
  console.error(`[${context}]`, error)
  return t.errors.generic
}
