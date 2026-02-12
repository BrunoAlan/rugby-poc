export const POSITION_NAMES: Record<number, string> = {
  1: 'Pilar Izq.',
  2: 'Hooker',
  3: 'Pilar Der.',
  4: '2da Linea',
  5: '2da Linea',
  6: 'Ala',
  7: 'Ala',
  8: 'N°8',
  9: 'Medio Scrum',
  10: 'Apertura',
  11: 'Wing',
  12: 'Centro',
  13: 'Centro',
  14: 'Wing',
  15: 'Fullback',
}

export const getPositionLabel = (position: number): string =>
  `${position} - ${POSITION_NAMES[position] ?? 'Desconocido'}`

export const ALL_POSITIONS = Array.from({ length: 15 }, (_, i) => i + 1)
