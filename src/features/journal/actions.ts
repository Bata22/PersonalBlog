'use server'

import { z } from 'zod'
import { ownerOrNull } from '@/features/auth/session'
import { journalMetaSchema } from '@/features/entries/metadata'
import { persistEntry } from '@/features/entries/persist'
import { entryTags } from '@/features/entries/tags'
import { t } from '@/i18n/sr'
import { addDays, formatDate, isIsoDate } from '@/lib/dates'
import { userMessage } from '@/lib/errors'
import { invalidate } from '@/lib/invalidate'
import { fail, ok, zodFieldErrors, type ActionResult } from '@/lib/result'
import { getJournalBranchId, getJournalDates, getJournalEntry } from './queries'
import { streakBefore } from './streak'

const journalSchema = journalMetaSchema.extend({
  occurredOn: z.string().refine(isIsoDate, 'Neispravan datum.'),
  isPublic: z.boolean(),
})

export type JournalInput = z.input<typeof journalSchema>

/** Upis ili izmena dnevnika za jedan dan (jedan upis po danu). */
export async function saveJournal(input: JournalInput): Promise<ActionResult<{ xp: number; streak: number }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = journalSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation, zodFieldErrors(parsed.error))
  const { occurredOn, isPublic, ...metadata } = parsed.data

  try {
    const branchId = await getJournalBranchId(owner.supabase)
    if (!branchId) return fail(t.admin.dashboard.emptyTreeTitle)

    const [existing, dates] = await Promise.all([
      getJournalEntry(owner.supabase, occurredOn),
      getJournalDates(owner.supabase, addDays(occurredOn, -400)),
    ])
    const streakDays = streakBefore(dates, occurredOn)

    const result = await persistEntry(
      owner,
      {
        id: existing?.id,
        kind: 'journal',
        branchId,
        title: t.journal.titleFor(formatDate(occurredOn)),
        occurredOn,
        isPublic,
        content: null,
        metadata,
        videoUrls: [],
        mediaIds: [],
      },
      { streakDays, slugBase: `dnevnik-${occurredOn}` },
    )

    invalidate(...entryTags([result.slug]))
    return ok({ xp: result.xp, streak: streakDays + 1 })
  } catch (error) {
    return fail(userMessage(error, 'saveJournal'))
  }
}
