import localFont from 'next/font/local'

/*
 * Fontovi su u repou (src/assets/fonts, OFL licenca), pa build ne zavisi od
 * Google-a. Svaka porodica ima dva podskupa: osnovna latinica i proširena
 * (č, ć, š, ž, đ). Pregledač preuzme proširenu samo ako je stranici treba.
 *
 * Next zahteva doslovne vrednosti u pozivima, zato se unicode-range ponavlja.
 */

export const onest = localFont({
  src: '../assets/fonts/onest-latin-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-onest',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
})

export const onestExt = localFont({
  src: '../assets/fonts/onest-latin-ext-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-onest-ext',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
})

export const bricolage = localFont({
  src: '../assets/fonts/bricolage-grotesque-latin-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-bricolage',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
})

export const bricolageExt = localFont({
  src: '../assets/fonts/bricolage-grotesque-latin-ext-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-bricolage-ext',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
})

export const fontVariables = [onest, onestExt, bricolage, bricolageExt].map((f) => f.variable).join(' ')
