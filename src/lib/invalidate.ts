import 'server-only'
import { updateTag } from 'next/cache'

/**
 * Odmah poništava keš za date oznake (samo iz server akcija), tako da
 * vidiš izmenu čim je sačuvaš.
 */
export function invalidate(...tags: string[]) {
  for (const tag of new Set(tags)) updateTag(tag)
}
