/**
 * RPG atributi lika. Svaka glavna grana hrani jedan atribut
 * (kolona branches.attribute; podgrane ga nasleđuju).
 * Redosled ovde je redosled temena na dijagramu atributa.
 */
export const ATTRIBUTE_IDS = ['snaga', 'intelekt', 'kreativnost', 'avantura', 'duh'] as const

export type AttributeId = (typeof ATTRIBUTE_IDS)[number]

export const ATTRIBUTES: Record<AttributeId, { label: string; icon: string; title: string; description: string }> = {
  snaga: {
    label: 'Snaga',
    icon: '💪',
    title: 'Ratnik',
    description: 'Sport i fizička aktivnost',
  },
  intelekt: {
    label: 'Intelekt',
    icon: '🧠',
    title: 'Mag',
    description: 'Doktorat, učenje i knjige',
  },
  kreativnost: {
    label: 'Kreativnost',
    icon: '🎨',
    title: 'Bard',
    description: 'Projekti i muzika',
  },
  avantura: {
    label: 'Avantura',
    icon: '🧭',
    title: 'Lutalica',
    description: 'Planine, putovanja i odmor',
  },
  duh: {
    label: 'Duh',
    icon: '🕊️',
    title: 'Mudrac',
    description: 'Dnevnik, igre, anime i odmor glave',
  },
}
