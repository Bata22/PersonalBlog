import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Content-Security-Policy: odakle stranica sme da učitava skripte, slike,
 * okvire i podatke. Novi spoljni servis (npr. druga mapa ili CDN) dodaj ovde.
 *
 * 'unsafe-inline' za skripte je potreban jer su stranice statične (prerender):
 * nonce bi naterao svaku stranicu da se renderuje na zahtev. Sadržaj upisa se
 * ionako nikad ne ubacuje kao sirov HTML (vidi features/editor/rich-text.tsx).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  [
    "img-src 'self' data: blob:",
    'https://*.supabase.co', // slike iz Storage-a
    'https://covers.openlibrary.org https://*.archive.org', // korice knjiga
    'https://media.rawg.io', // igre
    'https://cdn.myanimelist.net', // anime
    'https://i.ytimg.com', // sličice YouTube videa
  ].join(' '),
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co",
  'frame-src https://www.youtube-nocookie.com',
  "worker-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Bez upgrade-insecure-requests: svi izvori su već 'self' ili https, a ta direktiva
  // lokalno (http://localhost) preusmerava na https i lomi prijavu.
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // lokacija samo za "Uzmi moju lokaciju" na planinarenju
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()' },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  // fontovi za Open Graph slike čitaju se sa diska u vreme izvršavanja
  outputFileTracingIncludes: {
    '/**': ['./src/assets/og-fonts/**'],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ]
  },
}

export default nextConfig
