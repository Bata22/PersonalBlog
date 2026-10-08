'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/controls'
import { FormMessage } from '@/components/ui/misc'
import { NumberInput } from '@/components/ui/number-input'
import { ATTRIBUTE_IDS, ATTRIBUTES, type AttributeId } from '@/config/attributes'
import { BRANCH_KINDS, ENTRY_KINDS } from '@/config/entry-kinds'
import { t } from '@/i18n/sr'
import { deleteBranch, saveBranch, type BranchInput } from '../actions'

const ICON_IDEAS = ['🌱', '🎓', '🛠️', '📚', '🎵', '💪', '⛰️', '🏖️', '🎮', '🌸', '🔬', '💡', '📡', '🎨', '✍️', '🧩']

type Props = {
  initial: BranchInput
  /** Moguće roditeljske grane (bez ove grane i njenih podgrana). */
    parents: { id: string; label: string; attribute: AttributeId | null }[]
  /** Posebne grane (dnevnik, biblioteka) ne menjaju vrstu upisa. */
  special?: boolean
}

export function BranchForm({ initial, parents, special }: Props) {
  const id = useId()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const set = (patch: Partial<BranchInput>) => setValues((v) => ({ ...v, ...patch }))
  const isEdit = Boolean(values.id)
  
  // Prazan atribut: podgrana preuzima atribut roditelja, glavna grana ga nema.
  const parent = parents.find((p) => p.id === values.parentId)
  const inheritLabel = !parent
    ? t.branches.noAttribute
    : parent.attribute
      ? t.branches.inheritAttribute(ATTRIBUTES[parent.attribute].label)
      : t.branches.inheritNone

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await saveBranch(values)
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setMessage({ tone: 'error', text: result.error })
        return
      }
      setErrors({})
      if (isEdit) {
        setMessage({ tone: 'success', text: t.common.saved })
        router.refresh()
      } else {
        router.push(`/admin/grane/${result.data.id}`)
      }
    })
  }

  function remove() {
    if (!values.id || !window.confirm(t.branches.deleteConfirm)) return
    startTransition(async () => {
      const result = await deleteBranch(values.id!)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      router.push('/admin/grane')
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <Field id={`${id}-name`} label={t.branches.name} error={errors.name}>
          <Input id={`${id}-name`} value={values.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} required />
        </Field>
        <Field id={`${id}-icon`} label={t.branches.icon} error={errors.icon}>
          <Input id={`${id}-icon`} value={values.icon} onChange={(e) => set({ icon: e.target.value })} maxLength={16} className="text-center text-xl" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label="Predlozi ikonica">
        {ICON_IDEAS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => set({ icon })}
            className="grid size-9 place-items-center rounded-full text-lg hover:bg-sunken"
            aria-label={`Ikonica ${icon}`}
          >
            {icon}
          </button>
        ))}
      </div>

      <Field id={`${id}-desc`} label={t.branches.description} error={errors.description}>
        <Textarea
          id={`${id}-desc`}
          value={values.description ?? ''}
          onChange={(e) => set({ description: e.target.value })}
          maxLength={500}
          className="min-h-20"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-parent`} label={t.branches.parent} error={errors.parentId}>
          <Select id={`${id}-parent`} value={values.parentId ?? ''} onChange={(e) => set({ parentId: e.target.value || null })}>
            <option value="">{t.branches.noParent}</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={`${id}-attr`} label={t.branches.attribute}>
          <Select
            id={`${id}-attr`}
            value={values.attribute ?? ''}
            onChange={(e) => set({ attribute: (e.target.value || null) as BranchInput['attribute'] })}
          >
            <option value="">{inheritLabel}</option>
            {ATTRIBUTE_IDS.map((attr) => (
              <option key={attr} value={attr}>
                {ATTRIBUTES[attr].icon} {ATTRIBUTES[attr].label}
              </option>
            ))}
          </Select>
        </Field>
        {special ? null : (
          <Field id={`${id}-kind`} label={t.branches.kind}>
            <Select id={`${id}-kind`} value={values.entryKind} onChange={(e) => set({ entryKind: e.target.value as BranchInput['entryKind'] })}>
              {BRANCH_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {ENTRY_KINDS[kind].label}: {ENTRY_KINDS[kind].hint}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field id={`${id}-pos`} label={t.branches.position}>
          <NumberInput id={`${id}-pos`} value={values.position} onValue={(v) => set({ position: v ?? 0 })} />
        </Field>
      </div>

      <Field id={`${id}-focus`} label={t.branches.focusNote} error={errors.focusNote}>
        <Textarea
          id={`${id}-focus`}
          value={values.focusNote ?? ''}
          onChange={(e) => set({ focusNote: e.target.value })}
          placeholder={t.branches.focusNotePlaceholder}
          maxLength={1000}
          className="min-h-20"
        />
      </Field>

      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.branches.save}
        </Button>
        {isEdit && !special ? (
          <Button variant="danger" onClick={remove} disabled={pending}>
            <Trash2 className="size-4" aria-hidden />
            {t.branches.delete}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
