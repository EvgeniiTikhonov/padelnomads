import type { GameFormat } from '@/types';

// Round-based scoring configuration per format, derived from the Padel Nomads
// weekly game formats spec. Admins enter the final points per team per round
// (already including any court boost + streak bonus), mirroring the scoring
// sheet — so these configs mainly drive the UI, round labels, and guidance.

export interface RoundDef {
  label: string;
  /** Boosted round: court determines base points (see courtBoostPoints). */
  boosted: boolean;
}

export interface FormatConfig {
  /** How players are grouped when the game starts. */
  teamBased: boolean;          // true = pairs, false = individual entries
  playersPerCourt: number;     // used for court allocation on start
  rounds: RoundDef[];
  warmupMinutes: number;
  roundMinutes: number | null; // null when rounds vary (tournament)
  pointRule: string;
  courtMovement: boolean;      // winners move up, losers move down
  changePartners: boolean;     // partners rotate every round
  /** 1-based round from which a 2-win streak grants +1 bonus (null = no bonus). */
  streakBonusFromRound: number | null;
  boostRule: string | null;    // human-readable boosted-points rule (null = none)
  rankingBasis: 'team' | 'individual';
  notes: string[];
}

function round(label: string, boosted = false): RoundDef {
  return { label, boosted };
}

/**
 * Boosted-points helper (spec §3): Central Court & Court 2 → 3, Courts 3 & 4 → 2,
 * everything below → 1. King of the Court uses a wider ladder (3 & 6 → 2) but the
 * admin enters the final number by hand, so this stays a single shared heuristic.
 */
export function courtBoostPoints(court: number): number {
  if (court <= 2) return 3;
  if (court <= 4) return 2;
  return 1;
}

export const FORMAT_CONFIG: Record<GameFormat, FormatConfig> = {
  king_of_the_court: {
    teamBased: true,
    playersPerCourt: 4,
    rounds: [round('Round 1'), round('Round 2'), round('Round 3', true), round('Round 4', true)],
    warmupMinutes: 10,
    roundMinutes: 20,
    pointRule: 'One deuce, one golden.',
    courtMovement: true,
    changePartners: false,
    streakBonusFromRound: 3,
    boostRule: 'Rounds 3 & 4 — Central Court & Court 2 → 3 pts · Courts 3 & 6 → 2 pts · Court 7+ → 1 pt.',
    rankingBasis: 'team',
    notes: [
      'Winners move up, losers move down.',
      'Final ranking is based on total points.',
    ],
  },
  fixed_pairs: {
    teamBased: true,
    playersPerCourt: 4,
    rounds: [round('Round 1'), round('Round 2'), round('Round 3', true), round('Round 4', true)],
    warmupMinutes: 10,
    roundMinutes: 20,
    pointRule: 'Golden point (no deuces).',
    courtMovement: true,
    changePartners: false,
    streakBonusFromRound: 3,
    boostRule: 'Final rounds — Central Court & Court 2 → 3 pts · Courts 3 & 4 → 2 pts · others → 1 pt.',
    rankingBasis: 'team',
    notes: [
      'Pairs stay fixed for the whole session.',
      'Winners move up, losers move down.',
    ],
  },
  king_queen_of_the_court: {
    teamBased: true,
    playersPerCourt: 4,
    rounds: [round('Round 1'), round('Round 2'), round('Round 3', true), round('Round 4', true)],
    warmupMinutes: 10,
    roundMinutes: 20,
    pointRule: 'One deuce, one golden.',
    courtMovement: true,
    changePartners: false,
    streakBonusFromRound: 3,
    boostRule: 'Final rounds — Central Court & Court 2 → 3 pts · Courts 3 & 6 → 2 pts · others → 1 pt.',
    rankingBasis: 'team',
    notes: [
      'Same logic as King of the Court, mixed teams.',
      'Winners move up, losers move down.',
    ],
  },
  team_mexicano: {
    teamBased: true,
    playersPerCourt: 4,
    rounds: [round('Round 1'), round('Round 2'), round('Round 3'), round('Round 4', true), round('Round 5', true)],
    warmupMinutes: 10,
    roundMinutes: 15,
    pointRule: 'Only golden points, no deuces.',
    courtMovement: true,
    changePartners: false,
    streakBonusFromRound: 3,
    boostRule: 'Rounds 4 & 5 — Central Court & Court 2 → 3 pts · Courts 3 & 4 → 2 pts · others → 1 pt.',
    rankingBasis: 'team',
    notes: [
      'Teams remain fixed unless the organizer announces otherwise.',
      'Any latecomer receives a technical loss.',
    ],
  },
  social_shuffle: {
    teamBased: false,
    playersPerCourt: 4,
    rounds: [round('Round 1'), round('Round 2'), round('Round 3'), round('Round 4', true), round('Round 5', true)],
    warmupMinutes: 10,
    roundMinutes: 15,
    pointRule: 'Only golden points, no deuces.',
    courtMovement: true,
    changePartners: true,
    streakBonusFromRound: 3,
    boostRule: 'Rounds 4 & 5 — Court 1 & Court 2 → 3 pts · Courts 3 & 4 → 2 pts · others → 1 pt.',
    rankingBasis: 'individual',
    notes: [
      'Players change partners every round.',
      'Final ranking is individual, not by fixed pair.',
    ],
  },
  mini_tournament: {
    teamBased: true,
    playersPerCourt: 4,
    rounds: [round('Group 1'), round('Group 2'), round('Group 3'), round('Semi-final'), round('Final')],
    warmupMinutes: 10,
    roundMinutes: null,
    pointRule: 'Golden point (no deuces).',
    courtMovement: false,
    changePartners: false,
    streakBonusFromRound: null,
    boostRule: null,
    rankingBasis: 'team',
    notes: [
      '3 group-stage games (20 min cap), semi-finals & finals 25 min.',
      'Top 2 teams per group play for 1st–4th; others play for 5th–8th.',
    ],
  },
};

export function formatConfig(format: GameFormat): FormatConfig {
  return FORMAT_CONFIG[format];
}
