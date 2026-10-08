'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/controls'
import { FormMessage } from '@/components/ui/misc'
import { t } from '@/i18n/sr'
import { signIn } from './actions'

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState(signIn, null)
  const error = state && !state.ok ? state.error : initialError

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="dalje" value={next ?? ''} />
      <Field id="email" label={t.auth.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required inputMode="email" />
      </Field>
      <Field id="password" label={t.auth.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} />
      </Field>
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.auth.submitting : t.auth.submit}
      </Button>
    </form>
  )
}
