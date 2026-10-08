'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { t } from '@/i18n/sr'
import { isSupabaseConfigured } from '@/lib/env'
import { fail, type ActionResult } from '@/lib/result'
import { createSessionClient } from '@/lib/supabase/server'

const credentials = z.object({
  email: z.email().max(320),
  password: z.string().min(6).max(200),
})

/** Dozvoljava samo povratak u admin deo (bez otvorenih preusmerenja). */
function safeNext(value: FormDataEntryValue | null): string {
  return typeof value === 'string' && /^\/admin(\/[\w\-/]*)?$/.test(value) ? value : '/admin'
}

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return fail(t.auth.notConfigured)

  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return fail(t.auth.invalid)

  const supabase = await createSessionClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error || !data.user) return fail(t.auth.invalid)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_owner')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile?.is_owner) {
    await supabase.auth.signOut()
    return fail(t.auth.notOwner)
  }

  redirect(safeNext(formData.get('dalje')))
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSessionClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}
