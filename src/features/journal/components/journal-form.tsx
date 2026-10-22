'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/controls'
import { FormMessage } from '@/components/ui/misc'
import { Switch } from '@/components/ui/switch'
import { calculateXp, countWords } from '@/features/xp/calculate'
import { XpPreview } from '@/features/xp/components/xp-preview'
import { VisibilityChoice } from '@/features/visibility/visibility-choice'
import { t } from '@/i18n/sr'
import { cn } from '@/lib/cn'
import { saveJournal, type JournalInput } from '../actions'

type BranchChoice = { id: string; name: string; icon: string }

type Props = {
  initial: Required<Omit<JournalInput, 'restNote'>> & { restNote: string }
  branches: BranchChoice[]
  /** Dana zaredom pre izabranog dana (za bonus XP). */
  streakBefore: number
  existing: boolean
}

export function JournalForm({ initial, branches, streakBefore, existing }: Props) {
  const id = useId()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState(initial)
  const [openNotes, setOpenNotes] = useState<string[]>([])
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }))

  const journalXp = calculateXp({
    kind: 'journal',
    metadata: { did: values.did, workedOn: values.workedOn, notes: {}, rested: values.rested, restNote: values.restNote },
    words: countWords(`${values.did} ${values.restNote}`),
    images: 0,
    videos: 0,
    streakDays: streakBefore,
  })
  // svaka označena grana dobija svoj upis (osnova + bonus za tekst beleške)
  const selected = branches.filter((b) => values.workedOn.includes(b.id))
  const branchXpFor = (branchId: string) =>
    calculateXp({
      kind: 'post',
      metadata: { fromJournal: values.occurredOn },
      words: countWords(values.notes[branchId] ?? ''),
      images: 0,
      videos: 0,
    }).total
  const branchXp = selected.reduce((sum, b) => sum + branchXpFor(b.id), 0)
  const breakdown = {
    total: journalXp.total + branchXp,
    lines: [...journalXp.lines, ...(branchXp > 0 ? [{ label: t.journal.branchesXp(selected.length), xp: branchXp }] : [])],
  }

  function toggleBranch(branchId: string) {
    set({
      workedOn: values.workedOn.includes(branchId)
        ? values.workedOn.filter((b) => b !== branchId)
        : [...values.workedOn, branchId],
    })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await saveJournal({ ...values, restNote: values.restNote || undefined })
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setMessage({ tone: 'success', text: t.journal.savedXp(result.data.xp + result.data.branchXp, selected.length) })
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <Field id={`${id}-date`} label={t.journal.pickDate} className="max-w-56">
        <Input
          id={`${id}-date`}
          type="date"
          value={values.occurredOn}
          onChange={(e) => e.target.value && router.push(`/admin/dnevnik?dan=${e.target.value}`)}
        />
      </Field>

      <Field id={`${id}-did`} label={t.journal.did}>
        <Textarea
          id={`${id}-did`}
          value={values.did}
          onChange={(e) => set({ did: e.target.value })}
          placeholder={t.journal.didPlaceholder}
          maxLength={4000}
          className="min-h-36"
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t.journal.workedOn}</legend>
        <div className="flex flex-wrap gap-2">
          {branches.map((branch) => {
            const active = values.workedOn.includes(branch.id)
            return (
              <button
                key={branch.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleBranch(branch.id)}
                className={cn(
                  'inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 font-semibold transition-colors',
                  active ? 'border-ink bg-accent text-accent-ink' : 'border-line bg-surface text-ink-soft hover:text-ink',
                )}
              >
                {active ? <Check className="size-4" aria-hidden /> : <span aria-hidden>{branch.icon}</span>}
                {branch.name}
              </button>
            )
          })}
        </div>
        {selected.length > 0 ? (
          <div className="mt-4 grid gap-2">
            <p className="text-sm text-ink-soft">{t.journal.notesHint}</p>
            <ul className="grid gap-2">
              {selected.map((branch) => {
                const note = values.notes[branch.id] ?? ''
                const open = openNotes.includes(branch.id) || note !== ''
                return (
                  <li key={branch.id} className="rounded-2xl border border-line bg-surface px-3.5 py-2.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold">
                        <span aria-hidden>{branch.icon}</span> {branch.name}
                      </span>
                      <span className="text-sm font-semibold text-leaf tabular-nums">+{branchXpFor(branch.id)} XP</span>
                      {open ? null : (
                        <button
                          type="button"
                          onClick={() => setOpenNotes((ids) => [...ids, branch.id])}
                          className="ml-auto text-sm font-semibold text-leaf hover:underline"
                        >
                          {t.journal.addNote}
                        </button>
                      )}
                    </div>
                    {open ? (
                      <Textarea
                        aria-label={t.journal.noteFor(branch.name)}
                        value={note}
                        onChange={(e) => set({ notes: { ...values.notes, [branch.id]: e.target.value } })}
                        placeholder={t.journal.notePlaceholder}
                        maxLength={1000}
                        className="mt-2 min-h-16"
                      />
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </fieldset>

      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
        <Switch checked={values.rested} onChange={(v) => set({ rested: v })} label={t.journal.rested} />
        {values.rested ? (
          <Field id={`${id}-rest`} label={t.journal.restNote}>
            <Input
              id={`${id}-rest`}
              value={values.restNote}
              onChange={(e) => set({ restNote: e.target.value })}
              placeholder={t.journal.restNotePlaceholder}
              maxLength={500}
            />
          </Field>
        ) : null}
      </div>

      <div className="max-w-sm">
        <VisibilityChoice value={values.isPublic} onChange={(v) => set({ isPublic: v })} />
      </div>

      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <XpPreview breakdown={breakdown} />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t.common.saving : existing ? t.common.save : t.journal.save}
        </Button>
      </div>
    </form>
  )
}
