import 'server-only'
import { randomBytes } from 'node:crypto'
import { t } from '@/i18n/sr'
import { serverEnv } from '@/lib/env-server'
import { UserError } from '@/lib/errors'
import { createSecretClient } from '@/lib/supabase/secret'
import { MalUnauthorizedError } from './mal'

/**
 * Povezivanje sa MyAnimeList nalogom (OAuth 2 + PKCE, MAL podržava samo
 * "plain" metodu). Tokeni se čuvaju u tabeli mal_tokens koju vidi samo server.
 */

const AUTHORIZE_URL = 'https://myanimelist.net/v1/oauth2/authorize'
const TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token'
/** Token se osvežava malo pre isteka, da ne istekne usred izmene. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000

export const MAL_OAUTH_COOKIE = 'mal_oauth'
export const MAL_OAUTH_COOKIE_PATH = '/api/admin/mal'

export type PendingAuth = { verifier: string; state: string; redirectUri: string }

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number }

function credentials() {
  const { malClientId, malClientSecret } = serverEnv()
  if (!malClientId) throw new UserError(t.errors.missingKey('MAL_CLIENT_ID'))
  if (!malClientSecret) throw new UserError(t.errors.missingKey('MAL_CLIENT_SECRET'))
  return { clientId: malClientId, clientSecret: malClientSecret }
}

/** Početak povezivanja: adresa MAL stranice za odobrenje i podaci za proveru povratka. */
export function startAuthorization(redirectUri: string): { url: string; pending: PendingAuth } {
  const { clientId } = credentials()
  const pending: PendingAuth = {
    verifier: randomBytes(48).toString('base64url'), // 64 znaka, dozvoljeno 43–128
    state: randomBytes(16).toString('base64url'),
    redirectUri,
  }
  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('code_challenge', pending.verifier)
  url.searchParams.set('code_challenge_method', 'plain')
  url.searchParams.set('state', pending.state)
  url.searchParams.set('redirect_uri', redirectUri)
  return { url: url.toString(), pending }
}

async function requestTokens(params: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = credentials()
  let response: Response
  try {
    response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    })
  } catch {
    throw new UserError(t.errors.externalApi('MyAnimeList'))
  }
  if (response.status === 400 || response.status === 401) throw new UserError(t.anime.malReconnect)
  if (!response.ok) throw new UserError(t.errors.externalApi('MyAnimeList'))
  const json = (await response.json()) as Partial<TokenResponse>
  if (!json.access_token || !json.refresh_token || !json.expires_in) throw new UserError(t.errors.externalApi('MyAnimeList'))
  return json as TokenResponse
}

async function saveTokens(ownerId: string, tokens: TokenResponse) {
  const { error } = await createSecretClient()
    .from('mal_tokens')
    .upsert({
      owner_id: ownerId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}

/** Povratak sa MAL-a: kod se menja za tokene i oni se čuvaju. */
export async function completeAuthorization(ownerId: string, code: string, pending: PendingAuth) {
  const tokens = await requestTokens({
    grant_type: 'authorization_code',
    code,
    code_verifier: pending.verifier,
    redirect_uri: pending.redirectUri,
  })
  await saveTokens(ownerId, tokens)
  return tokens.access_token
}

/** Važeći token za izmene; ako je pri isteku, osveži ga. Null = nalog nije povezan. */
export async function getMalAccessToken(ownerId: string, { forceRefresh = false } = {}): Promise<string | null> {
  const { data, error } = await createSecretClient()
    .from('mal_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('owner_id', ownerId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const fresh = new Date(data.expires_at).getTime() - Date.now() > REFRESH_MARGIN_MS
  if (fresh && !forceRefresh) return data.access_token

  const tokens = await requestTokens({ grant_type: 'refresh_token', refresh_token: data.refresh_token })
  await saveTokens(ownerId, tokens)
  return tokens.access_token
}

export async function isMalConnected(ownerId: string): Promise<boolean> {
  if (!serverEnv().supabaseSecretKey) return false
  const { count, error } = await createSecretClient()
    .from('mal_tokens')
    .select('owner_id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
  if (error) throw error
  return (count ?? 0) > 0
}

export async function forgetMalTokens(ownerId: string) {
  const { error } = await createSecretClient().from('mal_tokens').delete().eq('owner_id', ownerId)
  if (error) throw error
}

/**
 * Poziv MAL-a sa važećim tokenom. Ako MAL ipak odbije token (npr. poništen),
 * osveži ga jednom i probaj ponovo; ako ni to ne prođe, traži ponovno povezivanje.
 */
export async function withMalToken<T>(ownerId: string, call: (token: string) => Promise<T>): Promise<T> {
  const token = await getMalAccessToken(ownerId)
  if (!token) throw new UserError(t.anime.malNotConnected)
  try {
    return await call(token)
  } catch (error) {
    if (!(error instanceof MalUnauthorizedError)) throw error
  }
  const fresh = await getMalAccessToken(ownerId, { forceRefresh: true })
  if (!fresh) throw new UserError(t.anime.malReconnect)
  try {
    return await call(fresh)
  } catch (error) {
    throw error instanceof MalUnauthorizedError ? new UserError(t.anime.malReconnect) : error
  }
}
