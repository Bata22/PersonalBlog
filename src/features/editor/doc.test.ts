import { describe, expect, it } from 'vitest'
import { collectMediaIds, docToPlainText, isDocEmpty, makeExcerpt, sanitizeDoc } from './doc'

const mediaId = '7f1c2b4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f'

describe('sanitizeDoc', () => {
  it('zadržava dozvoljene čvorove i oznake', () => {
    const doc = sanitizeDoc({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Naslov' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'jako', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
          ],
        },
        { type: 'image', attrs: { mediaId, alt: 'Vrh', src: 'https://signed.example/x' } },
      ],
    })
    expect(doc?.content?.[0]).toEqual({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Naslov' }],
    })
    expect(doc?.content?.[2]?.attrs).toEqual({ mediaId, alt: 'Vrh', width: null, height: null })
  })

  it('izbacuje opasne linkove i nepoznate čvorove', () => {
    const doc = sanitizeDoc({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'klik', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] },
          ],
        },
        { type: 'iframe', attrs: { src: 'https://evil.example' } },
        { type: 'image', attrs: { mediaId: 'nije-uuid' } },
      ],
    })
    expect(doc?.content).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: 'klik' }] }])
  })

  it('odbija ulaz koji nije dokument', () => {
    expect(sanitizeDoc({ type: 'paragraph' })).toBeNull()
    expect(sanitizeDoc('<script>')).toBeNull()
  })

  it('izvlači tekst, izvod i slike', () => {
    const doc = sanitizeDoc({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Prvi pasus.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Drugi pasus.' }] },
        { type: 'image', attrs: { mediaId } },
      ],
    })
    expect(docToPlainText(doc)).toBe('Prvi pasus.\nDrugi pasus.')
    expect(collectMediaIds(doc)).toEqual([mediaId])
    expect(isDocEmpty(doc)).toBe(false)
    expect(isDocEmpty(sanitizeDoc({ type: 'doc', content: [{ type: 'paragraph' }] }))).toBe(true)
  })

  it('seče izvod na granici reči', () => {
    const excerpt = makeExcerpt('reč '.repeat(100), 30)
    expect(excerpt.length).toBeLessThanOrEqual(31)
    expect(excerpt.endsWith('…')).toBe(true)
  })
})
