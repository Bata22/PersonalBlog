import type { ReactNode } from 'react'
import type { ResolvedMedia } from '@/features/media/types'
import { cn } from '@/lib/cn'
import type { DocMark, DocNode } from './doc'

/**
 * Prikaz Tiptap dokumenta kao React elemenata — bez sirovog HTML-a.
 * Dokument je već očišćen pri čuvanju (sanitizeDoc), a ovde se dodatno
 * prikazuju samo poznati čvorovi.
 */
export function RichText({
  doc,
  media,
  className,
}: {
  doc: DocNode | null
  media: Record<string, ResolvedMedia>
  className?: string
}) {
  if (!doc?.content?.length) return null
  return <div className={cn('prose-dnevnik', className)}>{renderChildren(doc.content, media)}</div>
}

function renderChildren(nodes: DocNode[] | undefined, media: Record<string, ResolvedMedia>): ReactNode[] {
  return (nodes ?? []).map((node, index) => renderNode(node, index, media))
}

function applyMarks(text: string, marks: DocMark[] | undefined, key: number): ReactNode {
  let out: ReactNode = text
  for (const mark of [...(marks ?? [])].reverse()) {
    switch (mark.type) {
      case 'bold':
        out = <strong>{out}</strong>
        break
      case 'italic':
        out = <em>{out}</em>
        break
      case 'strike':
        out = <s>{out}</s>
        break
      case 'underline':
        out = <u>{out}</u>
        break
      case 'code':
        out = <code>{out}</code>
        break
      case 'link':
        out = (
          <a href={mark.attrs.href} rel="noopener noreferrer">
            {out}
          </a>
        )
        break
    }
  }
  return <span key={key}>{out}</span>
}

function renderNode(node: DocNode, key: number, media: Record<string, ResolvedMedia>): ReactNode {
  const children = () => renderChildren(node.content, media)
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{children()}</p>
    case 'heading':
      return node.attrs?.level === 3 ? <h3 key={key}>{children()}</h3> : <h2 key={key}>{children()}</h2>
    case 'text':
      return applyMarks(node.text ?? '', node.marks, key)
    case 'bulletList':
      return <ul key={key}>{children()}</ul>
    case 'orderedList':
      return (
        <ol key={key} start={typeof node.attrs?.start === 'number' ? node.attrs.start : undefined}>
          {children()}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{children()}</li>
    case 'blockquote':
      return <blockquote key={key}>{children()}</blockquote>
    case 'codeBlock':
      return (
        <pre key={key}>
          <code>{(node.content ?? []).map((c) => c.text ?? '').join('')}</code>
        </pre>
      )
    case 'horizontalRule':
      return <hr key={key} />
    case 'hardBreak':
      return <br key={key} />
    case 'image': {
      const id = typeof node.attrs?.mediaId === 'string' ? node.attrs.mediaId : ''
      const image = media[id]
      if (!image) return null
      const alt = (typeof node.attrs?.alt === 'string' ? node.attrs.alt : null) ?? image.alt ?? ''
      return (
        <figure key={key}>
          {/* eslint-disable-next-line @next/next/no-img-element -- slike su smanjene pri slanju; bez kvote za transformacije */}
          <img src={image.src} alt={alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
          {alt ? <figcaption>{alt}</figcaption> : null}
        </figure>
      )
    }
    default:
      return null
  }
}
