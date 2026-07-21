/** Viya / Dubai Golf letter ladder (E → A+). */
export const PADEL_LEVELS = [
  'E',
  'D',
  'D+',
  'C',
  'C Strong',
  'C+',
  'B',
  'B+',
  'A',
  'A+',
] as const;

export type PadelLevel = (typeof PADEL_LEVELS)[number];

export const GAME_LEVELS = [...PADEL_LEVELS, 'mixed'] as const;
export type GameLevel = (typeof GAME_LEVELS)[number];
