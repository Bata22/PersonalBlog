'use client'

import { useRef, useState, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { t } from '@/i18n/sr'
import { cn } from '@/lib/cn'
import { useHydrated } from '@/lib/use-hydrated'
import type { DraftMedia } from '@/features/media/types'
import { safeHref, type DocNode } from './doc'

/** Slika u tekstu pamti id iz tabele media; adresa se računa pri prikazu. */
const MediaImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-media-id'),
        renderHTML: (attributes) =>
          attributes.mediaId ? { 'data-media-id': String(attributes.mediaId) } : {},
      },
    }
  },
})

/** Dugmad za formatiranje: jedna lista za izgled, stanje i akciju. */
const FORMATS = [
  { id: 'h2', label: t.editor.heading, Icon: Heading2, isActive: (e: Editor) => e.isActive('heading', { level: 2 }), toggle: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', label: t.editor.subheading, Icon: Heading3, isActive: (e: Editor) => e.isActive('heading', { level: 3 }), toggle: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bold', label: t.editor.bold, Icon: Bold, isActive: (e: Editor) => e.isActive('bold'), toggle: (e: Editor) => e.chain().focus().toggleBold().run() },
  { id: 'italic', label: t.editor.italic, Icon: Italic, isActive: (e: Editor) => e.isActive('italic'), toggle: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { id: 'bullet', label: t.editor.bulletList, Icon: List, isActive: (e: Editor) => e.isActive('bulletList'), toggle: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { id: 'ordered', label: t.editor.orderedList, Icon: ListOrdered, isActive: (e: Editor) => e.isActive('orderedList'), toggle: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { id: 'quote', label: t.editor.quote, Icon: Quote, isActive: (e: Editor) => e.isActive('blockquote'), toggle: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
] as const satisfies readonly { id: string; label: string; Icon: LucideIcon; isActive: (e: Editor) => boolean; toggle: (e: Editor) => void }[]

type FormatId = (typeof FORMATS)[number]['id']

type ToolbarState = {
  active: Record<FormatId, boolean>
  link: boolean
  canUndo: boolean
  canRedo: boolean
}

type Props = {
  initialContent: DocNode | null
  onChange: (doc: DocNode) => void
  /** Ako postoji, prikazuje se dugme za sliku u tekstu. */
  uploadImage?: (file: File) => Promise<DraftMedia>
  placeholder?: string
  labelId?: string
}

/**
 * Editor postoji samo u pregledaču. Na serveru se crta isti okvir sa trakom,
 * pa se pri učitavanju ništa ne pomera.
 */
export function RichTextEditor(props: Props) {
  const hydrated = useHydrated()
  if (!hydrated) {
    return (
      <EditorChrome editor={null} state={null} canUpload={Boolean(props.uploadImage)}>
        <div className="min-h-36" aria-hidden />
      </EditorChrome>
    )
  }
  return <LiveEditor {...props} />
}

function LiveEditor({ initialContent, onChange, uploadImage, placeholder, labelId }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto'] },
      }),
      MediaImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? t.editor.placeholder }),
    ],
    content: initialContent ?? '',
    editorProps: {
      attributes: {
        class: 'prose-dnevnik px-4 py-3',
        role: 'textbox',
        'aria-multiline': 'true',
        ...(labelId ? { 'aria-labelledby': labelId } : {}),
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON() as DocNode),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor: e }): ToolbarState | null =>
      e
        ? {
            active: Object.fromEntries(FORMATS.map((f) => [f.id, f.isActive(e)])) as Record<FormatId, boolean>,
            link: e.isActive('link'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  })

  const [uploading, setUploading] = useState(false)
  async function insertImage(file: File) {
    if (!editor || !uploadImage) return
    setUploading(true)
    try {
      const media = await uploadImage(file)
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'image',
          attrs: { src: media.src, mediaId: media.id, width: media.width, height: media.height, alt: null },
        })
        .run()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t.media.failed)
    } finally {
      setUploading(false)
    }
  }

  return (
    <EditorChrome
      editor={editor}
      state={state}
      canUpload={Boolean(uploadImage)}
      uploading={uploading}
      onImage={(file) => void insertImage(file)}
    >
      <EditorContent editor={editor} className="min-h-36" />
    </EditorChrome>
  )
}

function editLink(editor: Editor) {
  const current = (editor.getAttributes('link').href as string | undefined) ?? 'https://'
  const input = window.prompt(t.editor.linkPrompt, current)
  if (input === null) return
  if (input.trim() === '' || input.trim() === 'https://') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  const href = safeHref(input)
  if (!href) {
    window.alert(t.editor.badLink)
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
}

function EditorChrome({
  editor,
  state,
  canUpload,
  uploading = false,
  onImage,
  children,
}: {
  editor: Editor | null
  state: ToolbarState | null
  canUpload: boolean
  uploading?: boolean
  onImage?: (file: File) => void
  children: ReactNode
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface focus-within:border-leaf">
      <div
        role="toolbar"
        aria-label={t.editor.toolbar}
        className="sticky top-0 z-10 flex flex-wrap gap-0.5 border-b border-line bg-surface/95 p-1.5 backdrop-blur"
      >
        {FORMATS.map(({ id, label, Icon, toggle }) => (
          <ToolButton key={id} label={label} active={state?.active[id]} onClick={() => editor && toggle(editor)}>
            <Icon className="size-4.5" />
          </ToolButton>
        ))}
        <ToolButton label={t.editor.link} active={state?.link} onClick={() => editor && editLink(editor)}>
          <Link2 className="size-4.5" />
        </ToolButton>
        {canUpload ? (
          <>
            <ToolButton label={t.editor.image} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-4.5 animate-spin motion-reduce:animate-none" /> : <ImagePlus className="size-4.5" />}
            </ToolButton>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              tabIndex={-1}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file && onImage) onImage(file)
              }}
            />
          </>
        ) : null}
        <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
        <ToolButton label={t.editor.undo} disabled={!state?.canUndo} onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 className="size-4.5" />
        </ToolButton>
        <ToolButton label={t.editor.redo} disabled={!state?.canRedo} onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 className="size-4.5" />
        </ToolButton>
      </div>
      {children}
    </div>
  )
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'grid size-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-sunken hover:text-ink disabled:opacity-35',
        active && 'bg-accent text-accent-ink hover:bg-accent-strong hover:text-accent-ink',
      )}
    >
      {children}
    </button>
  )
}
