import { PALETTES, PALETTE_STORAGE_KEY } from '@/config/theme'

const ids = JSON.stringify(PALETTES.map((p) => p.id))

/**
 * Izvršava se u <head> pre prvog crtanja: primeni paletu izabranu na ovom
 * uređaju, bez treptanja i bez čitanja kolačića na serveru (stranice
 * ostaju statične).
 */
export const paletteInitScript = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  PALETTE_STORAGE_KEY,
)});if(p&&${ids}.indexOf(p)>-1)document.documentElement.setAttribute("data-palette",p)}catch(e){}})()`
