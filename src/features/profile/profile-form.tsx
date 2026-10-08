'use client'

import { useId, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/controls'
import { FormMessage } from '@/components/ui/misc'
import { Switch } from '@/components/ui/switch'
import { t } from '@/i18n/sr'
import { updateProfile, type ProfileInput } from './actions'

export function ProfileForm({ initial }: { initial: ProfileInput }) {
  const id = useId()
  const [values, setValues] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (patch: Partial<ProfileInput>) => setValues((v) => ({ ...v, ...patch }))

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await updateProfile(values)
      setErrors(result.ok ? {} : (result.fieldErrors ?? {}))
      setMessage(result.ok ? { tone: 'success', text: t.common.saved } : { tone: 'error', text: result.error })
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field id={`${id}-name`} label={t.settings.displayName} error={errors.displayName}>
        <Input id={`${id}-name`} value={values.displayName} onChange={(e) => set({ displayName: e.target.value })} maxLength={80} />
      </Field>
      <Field id={`${id}-headline`} label={t.settings.headline} error={errors.headline}>
        <Input
          id={`${id}-headline`}
          value={values.headline}
          onChange={(e) => set({ headline: e.target.value })}
          placeholder={t.settings.headlinePlaceholder}
          maxLength={160}
        />
      </Field>
      <Field id={`${id}-bio`} label={t.settings.bio} error={errors.bio}>
        <Textarea id={`${id}-bio`} value={values.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={2000} />
      </Field>
      <Field id={`${id}-mal`} label={t.settings.malUsername} error={errors.malUsername}>
        <Input
          id={`${id}-mal`}
          value={values.malUsername}
          onChange={(e) => set({ malUsername: e.target.value })}
          autoCapitalize="none"
          autoCorrect="off"
          maxLength={16}
        />
      </Field>
      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
        <Switch checked={values.showStatsPublicly} onChange={(v) => set({ showStatsPublicly: v })} label={t.settings.showStats} />
        <Switch checked={values.reminderEnabled} onChange={(v) => set({ reminderEnabled: v })} label={t.settings.reminderEnabled} />
        <Field id={`${id}-hour`} label={t.settings.reminderHour} className="max-w-48">
          <Select id={`${id}-hour`} value={values.reminderHour} onChange={(e) => set({ reminderHour: Number(e.target.value) })}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.settings.saveProfile}
        </Button>
      </div>
    </form>
  )
}
