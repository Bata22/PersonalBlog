import { z } from 'zod'

/**
 * Javne promenljive (dostupne i u pregledaču). NEXT_PUBLIC_* moraju da se
 * čitaju doslovno, ovako, da bi ih Next ubacio u klijentski kod.
 */
function readPublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  }
}

const publicSchema = z.object({
  supabaseUrl: z.url(),
  supabaseKey: z.string().min(20),
})

export type PublicEnv = z.infer<typeof publicSchema>

/** Da li su Supabase ključevi upisani (bez bacanja greške). */
export function isSupabaseConfigured(): boolean {
  return publicSchema.safeParse(readPublicEnv()).success
}

export function publicEnv(): PublicEnv {
  const parsed = publicSchema.safeParse(readPublicEnv())
  if (!parsed.success) {
    throw new Error(
      'Nedostaju NEXT_PUBLIC_SUPABASE_URL i/ili NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
        'Kopiraj .env.example u .env.local i popuni ih.',
    )
  }
  return parsed.data
}

/** Javni VAPID ključ za push notifikacije (prazan ako nije podešen). */
export const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
