import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * false na serveru i tokom hidratacije, true čim komponenta radi u pregledaču.
 * Za delove koji postoje samo u pregledaču (npr. editor), bez treptanja pri hidrataciji.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
