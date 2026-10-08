import { siteConfig } from '@/config/site'

const numberFormat = new Intl.NumberFormat(siteConfig.locale)
const plural = new Intl.PluralRules(siteConfig.locale)

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/**
 * Srpska množina: plural(3, { one: 'upis', few: 'upisa', other: 'upisa' })
 * 1 upis, 2 upisa, 5 upisa, 21 upis...
 */
export function pluralize(count: number, forms: { one: string; few: string; other: string }): string {
  const category = plural.select(count)
  const word = category === 'one' ? forms.one : category === 'few' ? forms.few : forms.other
  return `${formatNumber(count)} ${word}`
}
