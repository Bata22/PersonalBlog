/** Srpska ćirilica → latinica (za slučaj da naslov stigne na ćirilici). */
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'dj', е: 'e', ж: 'z', з: 'z', и: 'i',
  ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', ћ: 'c', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'c', џ: 'dz', ш: 's',
}

/** Slova koja se ne svode na osnovno slovo uklanjanjem kvačica. */
const SPECIAL: Record<string, string> = { đ: 'dj', ß: 'ss', æ: 'ae', ø: 'o', ł: 'l', œ: 'oe' }

/** "Šta sam čitao u Đerdapu" → "sta-sam-citao-u-djerdapu" */
export function slugify(input: string, maxLength = 80): string {
  return input
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (c) => CYRILLIC[c] ?? '')
    .replace(/[đßæøłœ]/g, (c) => SPECIAL[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '')
}

/**
 * Prvi slobodan slug: "tenis", pa "tenis-2", "tenis-3"...
 * `taken` su slugovi koji već postoje (pozivalac ih učita iz baze).
 */
export function uniqueSlug(base: string, taken: Iterable<string>, fallback = 'upis'): string {
  const used = new Set(taken)
  const root = slugify(base) || fallback
  if (!used.has(root)) return root
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root.slice(0, 72).replace(/-+$/g, '')}-${i}`
    if (!used.has(candidate)) return candidate
  }
  throw new Error('Nema slobodnog sluga.')
}
