import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { siteConfig } from '@/config/site'

/**
 * Zajednički izgled Open Graph slika (pregled linka na mrežama i u porukama).
 * Fontovi se čitaju jednom, pri učitavanju modula. Boje su fiksne (paleta
 * "Limun"), jer generator slika ne zna za CSS promenljive.
 */

const fontDir = join(process.cwd(), 'src/assets/og-fonts')
const [display, displayExt, body, bodyExt] = await Promise.all([
  readFile(join(fontDir, 'bricolage-grotesque-latin-800-normal.woff')),
  readFile(join(fontDir, 'bricolage-grotesque-latin-ext-800-normal.woff')),
  readFile(join(fontDir, 'onest-latin-500-normal.woff')),
  readFile(join(fontDir, 'onest-latin-ext-500-normal.woff')),
])

export const OG_SIZE = { width: 1200, height: 630 }

const COLORS = {
  paper: '#f8fae6',
  lemon: '#eef28a',
  ripe: '#f0d64a',
  unripe: '#9cc75a',
  ink: '#2a3318',
  inkSoft: '#5d6648',
  leaf: '#4f7a26',
  bark: '#8b7d55',
}

export function ogImage({ eyebrow, title, footer }: { eyebrow?: string; title: string; footer?: string }) {
  const titleSize = title.length > 70 ? 54 : title.length > 40 ? 64 : 76
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: COLORS.paper,
          backgroundImage: `radial-gradient(circle at 1px 1px, #dde3b6 1.5px, transparent 0)`,
          backgroundSize: '28px 28px',
          padding: '64px 72px',
          fontFamily: 'Onest',
          color: COLORS.ink,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -60,
            top: 150,
            width: 420,
            height: 340,
            borderRadius: '50%',
            backgroundColor: COLORS.ripe,
            border: `6px solid ${COLORS.bark}`,
            transform: 'rotate(-28deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 250,
            top: 90,
            width: 150,
            height: 70,
            borderRadius: '100% 0',
            backgroundColor: COLORS.unripe,
            border: `5px solid ${COLORS.bark}`,
            transform: 'rotate(-20deg)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 760 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {eyebrow ? (
              <div
                style={{
                  display: 'flex',
                  alignSelf: 'flex-start',
                  backgroundColor: COLORS.lemon,
                  border: `2px solid ${COLORS.ink}`,
                  borderRadius: 999,
                  padding: '8px 22px',
                  fontSize: 28,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div style={{ fontFamily: 'Bricolage', fontSize: titleSize, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 30, color: COLORS.inkSoft }}>
            <span style={{ fontFamily: 'Bricolage', color: COLORS.ink }}>{siteConfig.name}</span>
            {footer ? <span style={{ color: COLORS.leaf }}>{footer}</span> : null}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Bricolage', data: display, weight: 800, style: 'normal' },
        { name: 'Bricolage', data: displayExt, weight: 800, style: 'normal' },
        { name: 'Onest', data: body, weight: 500, style: 'normal' },
        { name: 'Onest', data: bodyExt, weight: 500, style: 'normal' },
      ],
    },
  )
}
