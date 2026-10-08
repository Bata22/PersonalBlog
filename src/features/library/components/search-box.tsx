'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/controls'
import { t } from '@/i18n/sr'

type Props<T> = {
  /** Admin API ruta koja vraća { results: T[] } ili { error }. */
  endpoint: string
  label: string
  placeholder: string
  emptyText: string
  renderItem: (item: T) => ReactNode
  getKey: (item: T) => string
}

/** Pretraga sa kašnjenjem dok kucaš (zajednička za knjige i igre). */
export function SearchBox<T>({ endpoint, label, placeholder, emptyText, renderItem, getKey }: Props<T>) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        const json = (await res.json()) as { results?: T[]; error?: string }
        if (!res.ok || json.error) throw new Error(json.error ?? t.errors.generic)
        setResults(json.results ?? [])
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : t.errors.generic)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, endpoint])

  const visible = query.trim().length >= 2 ? results : null

  return (
    <div className="grid gap-3">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
        <Input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="pl-10"
        />
        {loading ? (
          <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-ink-soft motion-reduce:animate-none" aria-label={t.common.searching} />
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {visible && !error ? (
        visible.length > 0 ? (
          <ul className="grid gap-2" aria-live="polite">
            {visible.map((item) => (
              <li key={getKey(item)}>{renderItem(item)}</li>
            ))}
          </ul>
        ) : !loading ? (
          <p className="text-sm text-ink-soft">{emptyText}</p>
        ) : null
      ) : null}
    </div>
  )
}
