'use client'

import { useId, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/controls'
import { FormMessage } from '@/components/ui/misc'
import { collectMediaIds, docToPlainText, type DocNode } from '@/features/editor/doc'
import { RichTextEditor } from '@/features/editor/rich-text-editor'
import { MediaPicker } from '@/features/media/components/media-picker'
import type { DraftMedia } from '@/features/media/types'
import { uploadImage } from '@/features/media/upload'
import { calculateXp, countWords, type XpInput } from '@/features/xp/calculate'
import { XpPreview } from '@/features/xp/components/xp-preview'
import { VisibilityChoice } from '@/features/visibility/visibility-choice'
import { t } from '@/i18n/sr'
import { youtubeId } from '@/lib/youtube'
import { deleteEntry, saveEntry } from '../actions'
import type { MetadataByKind } from '../metadata'
import type { EntryInput } from '../schema'
import { PlaceFields, PostFields, PracticeFields, SessionFields, WorkoutFields } from './kind-fields'
import { VideoInput } from './video-input'

export type EntryFormKind = 'post' | 'place' | 'workout' | 'session' | 'practice'

export type EntryFormInitial = {
  id?: string
  kind: EntryFormKind
  branchId: string
  title: string
  occurredOn: string
  isPublic: boolean
  content: DocNode | null
  metadata: MetadataByKind[EntryFormKind]
  videoUrls: string[]
  media: DraftMedia[]
  bookId?: string | null
  gameId?: string | null
  animeId?: string | null
}

type Props = {
  ownerId: string
  initial: EntryFormInitial
  branch: { icon: string; path: string }
  /** Grane iste vrste u koje upis može da se premesti (samo pri izmeni). */
  branchOptions?: { id: string; label: string }[]
  changeBranchHref?: string
  showChapter?: boolean
  showLink?: boolean
  /** Kuda posle čuvanja / brisanja (podrazumevano: stranica upisa / spisak). */
  returnTo?: string
  deleteReturnTo?: string
}

/** Uklanja prazne vežbe i prazna opciona polja pre slanja. */
function cleanMetadata(kind: EntryFormKind, metadata: MetadataByKind[EntryFormKind]) {
  if (kind === 'workout') {
    const meta = metadata as MetadataByKind['workout']
    return { exercises: meta.exercises.filter((ex) => ex.name.trim() && ex.sets.length > 0) }
  }
  return Object.fromEntries(Object.entries(metadata).filter(([, v]) => v !== '' && v !== undefined))
}

export function EntryForm({
  ownerId,
  initial,
  branch,
  branchOptions,
  changeBranchHref,
  showChapter,
  showLink,
  returnTo,
  deleteReturnTo = '/admin/upisi',
}: Props) {
  const id = useId()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isEdit = Boolean(initial.id)

  const [branchId, setBranchId] = useState(initial.branchId)
  const [title, setTitle] = useState(initial.title)
  const [occurredOn, setOccurredOn] = useState(initial.occurredOn)
  const [isPublic, setIsPublic] = useState(initial.isPublic)
  const [content, setContent] = useState<DocNode | null>(initial.content)
  const [metadata, setMetadata] = useState(initial.metadata)
  const [videoUrls, setVideoUrls] = useState(initial.videoUrls)
  const [media, setMedia] = useState<DraftMedia[]>(initial.media)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const savedIds = useMemo(() => new Set(initial.media.map((m) => m.id)), [initial.media])
  const inlineIds = useMemo(() => new Set(collectMediaIds(content)), [content])
  const upload = (file: File) => uploadImage(file, ownerId)
  const uploadInline = async (file: File) => {
    const item = await upload(file)
    setMedia((current) => [...current, item])
    return item
  }

  const breakdown = calculateXp({
    kind: initial.kind,
    metadata,
    words: countWords(docToPlainText(content)),
    images: media.length,
    videos: videoUrls.filter((url) => youtubeId(url)).length,
  } as XpInput)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    const payload = {
      id: initial.id,
      kind: initial.kind,
      branchId,
      title,
      occurredOn,
      isPublic,
      content,
      metadata: cleanMetadata(initial.kind, metadata),
      videoUrls,
      mediaIds: media.map((m) => m.id),
      mediaAlts: Object.fromEntries(media.map((m) => [m.id, m.alt])),
      bookId: initial.bookId ?? null,
      gameId: initial.gameId ?? null,
      animeId: initial.animeId ?? null,
    } as EntryInput

    startTransition(async () => {
      const result = await saveEntry(payload)
      if (!result.ok) {
        setError(result.error)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }
      router.push(returnTo ?? `/admin/upisi/${result.data.id}`)
    })
  }

  function remove() {
    if (!initial.id || !window.confirm(t.entryForm.deleteConfirm)) return
    startTransition(async () => {
      const result = await deleteEntry(initial.id!)
      if (!result.ok) return setError(result.error)
      router.push(deleteReturnTo)
    })
  }

  const fieldsProps = { errors: fieldErrors }

  return (
    <form onSubmit={submit} className="grid gap-7 pb-4" noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 font-semibold text-accent-ink">
          <span aria-hidden>{branch.icon}</span>
          {branch.path}
        </span>
        {changeBranchHref ? (
          <Link href={changeBranchHref} className="text-sm font-semibold text-leaf hover:underline">
            {t.entryForm.changeBranch}
          </Link>
        ) : null}
        {isEdit && branchOptions && branchOptions.length > 1 ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{t.entryForm.branch}</span>
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-9 w-auto py-1">
              {branchOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
      </div>

      <Field id={`${id}-title`} label={t.entryForm.title} error={fieldErrors.title}>
        <Input
          id={`${id}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.entryForm.titlePlaceholder}
          maxLength={160}
          required
          aria-invalid={fieldErrors.title ? true : undefined}
          className="h-13 font-display text-xl font-bold"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-[12rem_1fr] sm:items-start">
        <Field id={`${id}-date`} label={t.entryForm.date} error={fieldErrors.occurredOn}>
          <Input id={`${id}-date`} type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} required />
        </Field>
        <VisibilityChoice value={isPublic} onChange={setIsPublic} />
      </div>

      {initial.kind === 'place' ? (
        <PlaceFields value={metadata as MetadataByKind['place']} onChange={setMetadata} {...fieldsProps} />
      ) : null}
      {initial.kind === 'workout' ? (
        <WorkoutFields value={metadata as MetadataByKind['workout']} onChange={setMetadata} {...fieldsProps} />
      ) : null}
      {initial.kind === 'session' ? (
        <SessionFields value={metadata as MetadataByKind['session']} onChange={setMetadata} {...fieldsProps} />
      ) : null}
      {initial.kind === 'practice' ? (
        <PracticeFields value={metadata as MetadataByKind['practice']} onChange={setMetadata} {...fieldsProps} />
      ) : null}
      {initial.kind === 'post' ? (
        <PostFields
          value={metadata as MetadataByKind['post']}
          onChange={setMetadata}
          showChapter={showChapter}
          showLink={showLink}
          {...fieldsProps}
        />
      ) : null}

      <div className="grid gap-1.5">
        <span id={`${id}-content`} className="text-sm font-semibold">
          {t.entryForm.content}
        </span>
        <RichTextEditor
          initialContent={initial.content}
          onChange={setContent}
          uploadImage={uploadInline}
          placeholder={t.entryForm.contentHint}
          labelId={`${id}-content`}
        />
      </div>

      <section className="grid gap-2" aria-labelledby={`${id}-images`}>
        <h2 id={`${id}-images`} className="font-sans text-sm font-semibold">
          {t.entryForm.images}
        </h2>
        <MediaPicker items={media} onChange={setMedia} upload={upload} savedIds={savedIds} inlineIds={inlineIds} />
      </section>

      <section className="grid gap-2" aria-labelledby={`${id}-videos`}>
        <h2 id={`${id}-videos`} className="font-sans text-sm font-semibold">
          {t.entryForm.videos}
        </h2>
        <p className="text-sm text-ink-soft">{t.entryForm.videosHint}</p>
        <VideoInput value={videoUrls} onChange={setVideoUrls} />
      </section>

      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-3 rounded-2xl border border-line-strong bg-surface/95 py-2 pr-2 pl-4 shadow-soft backdrop-blur md:bottom-4">
        <XpPreview breakdown={breakdown} />
        <div className="flex shrink-0 gap-2">
          {isEdit ? (
            <Button variant="danger" onClick={remove} disabled={pending}>
              <Trash2 className="size-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">{t.entryForm.delete}</span>
            </Button>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? t.common.saving : isEdit ? t.entryForm.submitEdit : t.entryForm.submitCreate}
          </Button>
        </div>
      </div>
    </form>
  )
}
