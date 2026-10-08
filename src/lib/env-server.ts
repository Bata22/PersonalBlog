import 'server-only'

/**
 * Tajne promenljive — postoje samo na serveru. Svaka je opciona: funkcija
 * kojoj ključ nedostaje javlja jasnu poruku umesto da sruši ceo sajt.
 */
export function serverEnv() {
  return {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? '',
    vapidSubject: process.env.VAPID_SUBJECT ?? '',
    cronSecret: process.env.CRON_SECRET ?? '',
    rawgApiKey: process.env.RAWG_API_KEY ?? '',
    malClientId: process.env.MAL_CLIENT_ID ?? '',
  }
}
