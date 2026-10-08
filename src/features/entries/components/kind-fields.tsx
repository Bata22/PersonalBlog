'use client'

import { useId, useState } from 'react'
import { LocateFixed, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/controls'
import { NumberInput, parseNumber } from '@/components/ui/number-input'
import { SESSION_TYPES, WORKOUT_PRESETS, type SessionType } from '@/config/entry-kinds'
import { t } from '@/i18n/sr'
import { cn } from '@/lib/cn'
import { totalReps, type MetadataByKind } from '../metadata'

type FieldsProps<K extends keyof MetadataByKind> = {
  value: MetadataByKind[K]
  onChange: (value: MetadataByKind[K]) => void
  errors: Record<string, string>
}

const err = (errors: Record<string, string>, key: string) => errors[`metadata.${key}`]

// ---------------------------------------------------------------- mesto
export function PlaceFields({ value, onChange, errors }: FieldsProps<'place'>) {
  const id = useId()
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const set = (patch: Partial<MetadataByKind['place']>) => onChange({ ...value, ...patch })

  function locate() {
    if (!('geolocation' in navigator)) return setGeoError(t.entryForm.place.locationFailed)
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        set({ lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) })
      },
      () => {
        setLocating(false)
        setGeoError(t.entryForm.place.locationFailed)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <div className="grid gap-4">
      <Field id={`${id}-loc`} label={t.entryForm.place.location} error={err(errors, 'location')}>
        <Input
          id={`${id}-loc`}
          value={value.location}
          onChange={(e) => set({ location: e.target.value })}
          placeholder={t.entryForm.place.locationPlaceholder}
          maxLength={160}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={locate} disabled={locating}>
          <LocateFixed className="size-4" aria-hidden />
          {locating ? t.entryForm.place.locating : t.entryForm.place.useMyLocation}
        </Button>
        {value.lat !== undefined && value.lng !== undefined ? (
          <span className="text-sm text-ink-soft tabular-nums">
            {value.lat}, {value.lng}
            <button type="button" className="ml-2 text-danger" onClick={() => set({ lat: undefined, lng: undefined })} aria-label={t.common.remove}>
              ×
            </button>
          </span>
        ) : null}
        {geoError ? <span className="text-sm text-danger">{geoError}</span> : null}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field id={`${id}-km`} label={t.entryForm.place.distanceKm} error={err(errors, 'distanceKm')}>
          <NumberInput id={`${id}-km`} decimal value={value.distanceKm} onValue={(v) => set({ distanceKm: v })} />
        </Field>
        <Field id={`${id}-elev`} label={t.entryForm.place.elevationGainM} error={err(errors, 'elevationGainM')}>
          <NumberInput id={`${id}-elev`} value={value.elevationGainM} onValue={(v) => set({ elevationGainM: v })} />
        </Field>
        <Field id={`${id}-dur`} label={t.entryForm.place.durationMin} error={err(errors, 'durationMin')}>
          <NumberInput id={`${id}-dur`} value={value.durationMin} onValue={(v) => set({ durationMin: v })} />
        </Field>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- kalistenika
export function WorkoutFields({ value, onChange, errors }: FieldsProps<'workout'>) {
  const id = useId()
  const exercises = value.exercises
  const setExercises = (next: MetadataByKind['workout']['exercises']) => onChange({ ...value, exercises: next })
  const missing = WORKOUT_PRESETS.filter((name) => !exercises.some((ex) => ex.name === name))

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-semibold">{t.entryForm.workout.exercises}</legend>

      {exercises.map((exercise, index) => (
        <ExerciseRow
          key={index}
          inputId={`${id}-${index}`}
          name={exercise.name}
          sets={exercise.sets}
          onChange={(next) => setExercises(exercises.map((ex, i) => (i === index ? next : ex)))}
          onRemove={() => setExercises(exercises.filter((_, i) => i !== index))}
        />
      ))}

      <div className="flex flex-wrap gap-2">
        {missing.map((name) => (
          <Button key={name} variant="secondary" size="sm" onClick={() => setExercises([...exercises, { name, sets: [] }])}>
            <Plus className="size-4" aria-hidden />
            {name}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setExercises([...exercises, { name: '', sets: [] }])}>
          <Plus className="size-4" aria-hidden />
          {t.entryForm.workout.addExercise}
        </Button>
      </div>

      <p className="text-sm text-ink-soft">
        {t.entryForm.workout.total}: <strong className="text-ink tabular-nums">{totalReps(value)}</strong>
      </p>
      {err(errors, 'exercises') ? <p className="text-sm text-danger">{err(errors, 'exercises')}</p> : null}
    </fieldset>
  )
}

function ExerciseRow({
  inputId,
  name,
  sets,
  onChange,
  onRemove,
}: {
  inputId: string
  name: string
  sets: number[]
  onChange: (next: { name: string; sets: number[] }) => void
  onRemove: () => void
}) {
  const [draft, setDraft] = useState('')

  function addSet() {
    const reps = parseNumber(draft)
    if (reps === undefined || reps < 0) return
    onChange({ name, sets: [...sets, Math.round(reps)] })
    setDraft('')
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <label htmlFor={`${inputId}-name`} className="sr-only">
          {t.entryForm.workout.exercise}
        </label>
        <Input
          id={`${inputId}-name`}
          value={name}
          onChange={(e) => onChange({ name: e.target.value, sets })}
          placeholder={t.entryForm.workout.exercisePlaceholder}
          maxLength={60}
          className="h-10 font-semibold"
        />
        <button
          type="button"
          onClick={onRemove}
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-sunken"
          aria-label={`${t.common.remove}: ${name || t.entryForm.workout.exercise}`}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {sets.map((reps, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange({ name, sets: sets.filter((_, j) => j !== i) })}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-accent px-3 font-semibold text-accent-ink tabular-nums"
            aria-label={`${t.common.remove} seriju ${i + 1}: ${reps}`}
          >
            {reps}
            <X className="size-3.5 opacity-60" aria-hidden />
          </button>
        ))}
        <span className="inline-flex items-center gap-1">
          <label htmlFor={`${inputId}-set`} className="sr-only">
            {t.entryForm.workout.reps}
          </label>
          <input
            id={`${inputId}-set`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSet()
              }
            }}
            inputMode="numeric"
            placeholder={t.entryForm.workout.reps}
            className="h-9 w-32 rounded-full border border-line bg-surface px-3 text-sm placeholder:text-ink-faint focus:border-leaf focus:outline-none"
          />
          <button
            type="button"
            onClick={addSet}
            className="grid size-9 place-items-center rounded-full bg-btn text-btn-ink"
            aria-label={t.entryForm.workout.addSet}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- trening ili meč
export function SessionFields({ value, onChange, errors }: FieldsProps<'session'>) {
  const id = useId()
  const set = (patch: Partial<MetadataByKind['session']>) => onChange({ ...value, ...patch })

  return (
    <div className="grid gap-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">{t.entryForm.session.type}</legend>
        <div className="inline-flex rounded-full border border-line bg-surface p-1">
          {(Object.keys(SESSION_TYPES) as SessionType[]).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={value.sessionType === type}
              onClick={() => set({ sessionType: type })}
              className={cn(
                'h-9 rounded-full px-4 font-semibold transition-colors',
                value.sessionType === type ? 'bg-btn text-btn-ink' : 'text-ink-soft hover:text-ink',
              )}
            >
              {SESSION_TYPES[type]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id={`${id}-dur`} label={t.entryForm.session.durationMin} error={err(errors, 'durationMin')}>
          <NumberInput id={`${id}-dur`} value={value.durationMin} onValue={(v) => set({ durationMin: v })} />
        </Field>
        <Field id={`${id}-res`} label={t.entryForm.session.result} optional={false} error={err(errors, 'result')}>
          <Input
            id={`${id}-res`}
            value={value.result ?? ''}
            onChange={(e) => set({ result: e.target.value })}
            placeholder={t.entryForm.session.resultPlaceholder}
            maxLength={80}
          />
        </Field>
        <Field id={`${id}-opp`} label={t.entryForm.session.opponent} error={err(errors, 'opponent')}>
          <Input id={`${id}-opp`} value={value.opponent ?? ''} onChange={(e) => set({ opponent: e.target.value })} maxLength={80} />
        </Field>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- muzika
export function PracticeFields({ value, onChange, errors }: FieldsProps<'practice'>) {
  const id = useId()
  const set = (patch: Partial<MetadataByKind['practice']>) => onChange({ ...value, ...patch })
  return (
    <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
      <Field id={`${id}-dur`} label={t.entryForm.practice.durationMin} error={err(errors, 'durationMin')}>
        <NumberInput id={`${id}-dur`} value={value.durationMin} onValue={(v) => set({ durationMin: v })} />
      </Field>
      <Field id={`${id}-pieces`} label={t.entryForm.practice.pieces} error={err(errors, 'pieces')}>
        <Input
          id={`${id}-pieces`}
          value={value.pieces ?? ''}
          onChange={(e) => set({ pieces: e.target.value })}
          placeholder={t.entryForm.practice.piecesPlaceholder}
          maxLength={300}
        />
      </Field>
    </div>
  )
}

// ---------------------------------------------------------------- objava (poglavlje / link)
export function PostFields({
  value,
  onChange,
  errors,
  showChapter,
  showLink,
}: FieldsProps<'post'> & { showChapter?: boolean; showLink?: boolean }) {
  const id = useId()
  const set = (patch: Partial<MetadataByKind['post']>) => onChange({ ...value, ...patch })
  if (!showChapter && !showLink) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {showChapter ? (
        <Field id={`${id}-ch`} label={t.entryForm.chapter} error={err(errors, 'chapter')}>
          <Input
            id={`${id}-ch`}
            value={value.chapter ?? ''}
            onChange={(e) => set({ chapter: e.target.value || undefined })}
            placeholder={t.entryForm.chapterPlaceholder}
            maxLength={120}
          />
        </Field>
      ) : null}
      {showLink ? (
        <Field id={`${id}-link`} label={t.entryForm.link} error={err(errors, 'link')}>
          <Input
            id={`${id}-link`}
            type="url"
            value={value.link ?? ''}
            onChange={(e) => set({ link: e.target.value || undefined })}
            placeholder={t.entryForm.linkPlaceholder}
            maxLength={500}
          />
        </Field>
      ) : null}
    </div>
  )
}
