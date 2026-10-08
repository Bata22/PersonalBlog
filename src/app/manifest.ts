import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { THEME_COLOR } from '@/config/theme'

/**
 * Manifest za instalaciju na telefon ("Dodaj na početni ekran").
 * Instalirana aplikacija se otvara na kontrolnoj tabli.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name}: dnevnik`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    lang: siteConfig.lang,
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: THEME_COLOR.light,
    theme_color: THEME_COLOR.light,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Dnevnik', short_name: 'Dnevnik', url: '/admin/dnevnik' },
      { name: 'Novi upis', short_name: 'Upiši', url: '/admin/novo' },
    ],
  }
}
