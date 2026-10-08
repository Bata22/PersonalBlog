/**
 * Tiptap dokument (JSON) — tipovi, čišćenje i pomoćne funkcije.
 *
 * Sadržaj se NIKAD ne prikazuje kao sirov HTML. Na serveru ga provlačimo
 * kroz `sanitizeDoc` (dozvoljeni čvorovi, oznake i atributi; linkovi samo
 * http/https/mailto), a prikazuje ga naš React renderer (rich-text.tsx).
 */

export type DocMark =
  | { type: 'bold' | 'italic' | 'strike' | 'code' | 'underline' }
  | { type: 'link'; attrs: { href: string } }

export type DocNode = {
  type: string
  attrs?: Record<string, string | number | null>
  content?: DocNode[]
  text?: string
  marks?: DocMark[]
}

const LIMITS = { maxDepth: 16, maxNodes: 8000, maxTextLength: 100_000 }
const SIMPLE_MARKS = new Set(['bold', 'italic', 'strike', 'code', 'underline'])
const CONTAINERS = new Set(['doc', 'paragraph', 'bulletList', 'listItem', 'blockquote'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class DocTooLargeError extends Error {
  constructor() {
    super('Tekst je predugačak ili previše složen.')
  }
}

export function safeHref(href: unknown): string | null {
  if (typeof href !== 'string' || href.length > 2000) return null
  try {
    const url = new URL(href.trim())
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

function positiveInt(value: unknown, max: number): number | null {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 && n <= max ? n : null
}

function cleanMarks(raw: unknown): DocMark[] {
  if (!Array.isArray(raw)) return []
  const marks: DocMark[] = []
  for (const mark of raw) {
    if (!mark || typeof mark !== 'object') continue
    const type = (mark as { type?: unknown }).type
    if (typeof type === 'string' && SIMPLE_MARKS.has(type)) {
      marks.push({ type: type as 'bold' })
    } else if (type === 'link') {
      const href = safeHref((mark as { attrs?: { href?: unknown } }).attrs?.href)
      if (href) marks.push({ type: 'link', attrs: { href } })
    }
  }
  return marks
}

/**
 * Vraća očišćen dokument ili null ako ulaz nije Tiptap dokument.
 * Nepoznati čvorovi se tiho izbacuju; prevelik dokument baca DocTooLargeError.
 */
export function sanitizeDoc(input: unknown): DocNode | null {
  let nodeCount = 0
  let textLength = 0

  const cleanChildren = (raw: unknown, depth: number): DocNode[] =>
    Array.isArray(raw)
      ? raw.map((child) => clean(child, depth + 1)).filter((n): n is DocNode => n !== null)
      : []

  const clean = (raw: unknown, depth: number): DocNode | null => {
    nodeCount += 1
    if (depth > LIMITS.maxDepth || nodeCount > LIMITS.maxNodes) throw new DocTooLargeError()
    if (!raw || typeof raw !== 'object') return null
    const node = raw as { type?: unknown; attrs?: Record<string, unknown>; content?: unknown; text?: unknown; marks?: unknown }
    const attrs = node.attrs ?? {}

    switch (node.type) {
      case 'text': {
        if (typeof node.text !== 'string' || node.text.length === 0) return null
        textLength += node.text.length
        if (textLength > LIMITS.maxTextLength) throw new DocTooLargeError()
        const marks = cleanMarks(node.marks)
        return marks.length ? { type: 'text', text: node.text, marks } : { type: 'text', text: node.text }
      }
      case 'heading':
        return {
          type: 'heading',
          attrs: { level: attrs.level === 3 ? 3 : 2 },
          content: cleanChildren(node.content, depth),
        }
      case 'orderedList':
        return {
          type: 'orderedList',
          attrs: { start: positiveInt(attrs.start, 9999) ?? 1 },
          content: cleanChildren(node.content, depth),
        }
      case 'codeBlock': {
        const language = typeof attrs.language === 'string' && /^[a-z0-9+#-]{1,20}$/i.test(attrs.language)
          ? attrs.language
          : null
        const content = cleanChildren(node.content, depth).map((child) => ({ type: 'text', text: child.text ?? '' }))
        return { type: 'codeBlock', attrs: { language }, content: content.filter((c) => c.text) }
      }
      case 'image': {
        if (typeof attrs.mediaId !== 'string' || !UUID.test(attrs.mediaId)) return null
        return {
          type: 'image',
          attrs: {
            mediaId: attrs.mediaId,
            alt: text(attrs.alt, 300),
            width: positiveInt(attrs.width, 10000),
            height: positiveInt(attrs.height, 10000),
          },
        }
      }
      case 'horizontalRule':
      case 'hardBreak':
        return { type: node.type }
      default:
        if (typeof node.type === 'string' && CONTAINERS.has(node.type)) {
          return { type: node.type, content: cleanChildren(node.content, depth) }
        }
        return null
    }
  }

  if (!input || typeof input !== 'object' || (input as { type?: unknown }).type !== 'doc') return null
  return clean(input, 0)
}

function walk(node: DocNode, visit: (node: DocNode) => void) {
  visit(node)
  for (const child of node.content ?? []) walk(child, visit)
}

const BLOCKS_WITH_BREAK = new Set(['paragraph', 'heading', 'listItem', 'blockquote', 'codeBlock'])

/** Običan tekst dokumenta (za izvod, pretragu i brojanje reči). */
export function docToPlainText(doc: DocNode | null): string {
  if (!doc) return ''
  const parts: string[] = []
  const visit = (node: DocNode) => {
    if (node.type === 'text' && node.text) parts.push(node.text)
    else if (node.type === 'hardBreak') parts.push('\n')
    for (const child of node.content ?? []) visit(child)
    if (BLOCKS_WITH_BREAK.has(node.type)) parts.push('\n')
  }
  visit(doc)
  return parts.join('').replace(/\n{3,}/g, '\n\n').trim()
}

/** Kratak izvod (za kartice, SEO opis i RSS), seče na granici reči. */
export function makeExcerpt(text: string, max = 180): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max + 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`
}

export function collectMediaIds(doc: DocNode | null): string[] {
  if (!doc) return []
  const ids: string[] = []
  walk(doc, (node) => {
    if (node.type === 'image' && typeof node.attrs?.mediaId === 'string') ids.push(node.attrs.mediaId)
  })
  return ids
}

export function isDocEmpty(doc: DocNode | null): boolean {
  return !doc || (docToPlainText(doc).length === 0 && collectMediaIds(doc).length === 0)
}

/** Za editor: upisuje trenutne adrese slika (potpisani linkovi ističu, zato se ne čuvaju). */
export function withImageSources(doc: DocNode, srcById: Record<string, string>): DocNode {
  const map = (node: DocNode): DocNode => {
    if (node.type === 'image' && typeof node.attrs?.mediaId === 'string') {
      return { ...node, attrs: { ...node.attrs, src: srcById[node.attrs.mediaId] ?? null } }
    }
    return node.content ? { ...node, content: node.content.map(map) } : node
  }
  return map(doc)
}
