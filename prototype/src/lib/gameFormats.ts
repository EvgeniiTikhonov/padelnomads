import type { GameFormat } from '@/types';

// Editable game-format definitions (admin Formats screen) plus the lean
// FormatConfig used by live scoring / round UI.

export type FormatEntryMode = 'solo' | 'team';

/** Gender modes a format may allow when creating a game. */
export type FormatGenderMode = 'male' | 'female' | 'mixed' | 'mixed_pairs';

export type PointRuleKind = 'golden' | 'one_deuce_one_golden';

/**
 * How the session progresses:
 * - social — rotating partners / social shuffle
 * - court_movement — winners up, losers down
 * - tournament — groups → (quarters) → semis → finals by entry count
 */
export type CompetitionStructure = 'social' | 'court_movement' | 'tournament';

export interface RoundDef {
  label: string;
  /** Boosted round: court determines base points (see courtBoostPoints). */
  boosted: boolean;
}

/** Runtime scoring / round UI config (derived from a FormatDefinition). */
export interface FormatConfig {
  teamBased: boolean;
  playersPerCourt: number;
  rounds: RoundDef[];
  warmupMinutes: number;
  roundMinutes: number | null;
  pointRule: string;
  courtMovement: boolean;
  changePartners: boolean;
  streakBonusFromRound: number | null;
  boostRule: string | null;
  rankingBasis: 'team' | 'individual';
  notes: string[];
}

/** Full admin-editable format record. */
export interface FormatDefinition {
  id: GameFormat;
  name: string;
  description: string;
  /** Solo players vs fixed pairs/teams. */
  entryMode: FormatEntryMode;
  /** Gender options offered when creating a game of this format. */
  allowedGenderModes: FormatGenderMode[];
  defaultGenderMode: FormatGenderMode;
  warmupMinutes: number;
  /** Minutes per round; null when stages vary (tournament). */
  roundMinutes: number | null;
  roundCount: number;
  /** Which late rounds are boosted (1-based). Empty = none. */
  boostedRounds: number[];
  pointRule: PointRuleKind;
  /** Human-readable points / boost description. */
  pointsSystem: string;
  competitionStructure: CompetitionStructure;
  changePartners: boolean;
  streakBonusFromRound: number | null;
  rankingBasis: 'team' | 'individual';
  notes: string[];
  active: boolean;
  updatedAt: string;
}

export const FORMAT_GENDER_LABELS: Record<FormatGenderMode, string> = {
  male: 'Men only',
  female: 'Ladies only',
  mixed: 'Mixed (open)',
  mixed_pairs: 'Mixed only (man + woman)',
};

export const ENTRY_MODE_LABELS: Record<FormatEntryMode, string> = {
  solo: 'Solo',
  team: 'Team (fixed pairs)',
};

export const POINT_RULE_LABELS: Record<PointRuleKind, string> = {
  golden: 'Golden point (no deuces)',
  one_deuce_one_golden: 'One deuce, one golden',
};

export const COMPETITION_STRUCTURE_LABELS: Record<CompetitionStructure, string> = {
  social: 'Social (rotating partners)',
  court_movement: 'Court movement (winners up · losers down)',
  tournament: 'Tournament (groups → quarters/semis → finals)',
};

export const COMPETITION_STRUCTURE_HINTS: Record<CompetitionStructure, string> = {
  social: 'Partners change each round. Ranking is usually individual.',
  court_movement: 'After each round, winners move to a higher court and losers drop down.',
  tournament:
    'Group stage first. With enough teams: quarters → semis → finals. Fewer teams skip earlier knockout rounds.',
};

function pointRuleText(kind: PointRuleKind): string {
  return POINT_RULE_LABELS[kind];
}

function defaultRounds(def: FormatDefinition): RoundDef[] {
  if (def.competitionStructure === 'tournament') {
    return [
      { label: 'Group 1', boosted: false },
      { label: 'Group 2', boosted: false },
      { label: 'Group 3', boosted: false },
      { label: 'Semi-final', boosted: false },
      { label: 'Final', boosted: false },
    ].slice(0, Math.max(1, def.roundCount));
  }
  return Array.from({ length: Math.max(1, def.roundCount) }, (_, i) => ({
    label: `Round ${i + 1}`,
    boosted: def.boostedRounds.includes(i + 1),
  }));
}

/** Map an admin format definition to the scoring/UI FormatConfig. */
export function definitionToConfig(def: FormatDefinition): FormatConfig {
  return {
    teamBased: def.entryMode === 'team',
    playersPerCourt: 4,
    rounds: defaultRounds(def),
    warmupMinutes: def.warmupMinutes,
    roundMinutes: def.roundMinutes,
    pointRule: pointRuleText(def.pointRule),
    courtMovement: def.competitionStructure === 'court_movement',
    changePartners: def.changePartners || def.competitionStructure === 'social',
    streakBonusFromRound: def.streakBonusFromRound,
    boostRule: def.pointsSystem.trim() || null,
    rankingBasis: def.rankingBasis,
    notes: def.notes,
  };
}

const SEED_AT = '2026-01-01T00:00:00.000Z';

/** Default catalogue — mirrors current weekly formats. */
export const SEED_FORMAT_DEFINITIONS: FormatDefinition[] = [
  {
    id: 'king_of_the_court',
    name: 'King of the Court',
    description: 'Fixed pairs ladder. Win to climb toward the central court.',
    entryMode: 'team',
    allowedGenderModes: ['male', 'female', 'mixed'],
    defaultGenderMode: 'mixed',
    warmupMinutes: 10,
    roundMinutes: 20,
    roundCount: 4,
    boostedRounds: [3, 4],
    pointRule: 'one_deuce_one_golden',
    pointsSystem: 'Rounds 3 & 4 — Central Court & Court 2 → 3 pts · Courts 3 & 6 → 2 pts · Court 7+ → 1 pt.',
    competitionStructure: 'court_movement',
    changePartners: false,
    streakBonusFromRound: 3,
    rankingBasis: 'team',
    notes: ['Winners move up, losers move down.', 'Final ranking is based on total points.'],
    active: true,
    updatedAt: SEED_AT,
  },
  {
    id: 'king_queen_of_the_court',
    name: 'King & Queen of the Court',
    description: 'Same ladder as King of the Court with mixed man+woman teams.',
    entryMode: 'team',
    allowedGenderModes: ['mixed_pairs', 'female', 'male'],
    defaultGenderMode: 'mixed_pairs',
    warmupMinutes: 10,
    roundMinutes: 20,
    roundCount: 4,
    boostedRounds: [3, 4],
    pointRule: 'one_deuce_one_golden',
    pointsSystem: 'Final rounds — Central Court & Court 2 → 3 pts · Courts 3 & 6 → 2 pts · others → 1 pt.',
    competitionStructure: 'court_movement',
    changePartners: false,
    streakBonusFromRound: 3,
    rankingBasis: 'team',
    notes: ['Same logic as King of the Court, mixed teams.', 'Winners move up, losers move down.'],
    active: true,
    updatedAt: SEED_AT,
  },
  {
    id: 'fixed_pairs',
    name: 'Fixed Pairs',
    description: 'Bring your partner. Pairs stay together for the whole session.',
    entryMode: 'team',
    allowedGenderModes: ['male', 'female', 'mixed', 'mixed_pairs'],
    defaultGenderMode: 'mixed',
    warmupMinutes: 10,
    roundMinutes: 20,
    roundCount: 4,
    boostedRounds: [3, 4],
    pointRule: 'golden',
    pointsSystem: 'Final rounds — Central Court & Court 2 → 3 pts · Courts 3 & 4 → 2 pts · others → 1 pt.',
    competitionStructure: 'court_movement',
    changePartners: false,
    streakBonusFromRound: 3,
    rankingBasis: 'team',
    notes: ['Pairs stay fixed for the whole session.', 'Winners move up, losers move down.'],
    active: true,
    updatedAt: SEED_AT,
  },
  {
    id: 'team_mexicano',
    name: 'Team Mexicano',
    description: 'Fixed teams, short rounds, court movement with boosted late rounds.',
    entryMode: 'team',
    allowedGenderModes: ['male', 'female', 'mixed'],
    defaultGenderMode: 'mixed',
    warmupMinutes: 10,
    roundMinutes: 15,
    roundCount: 5,
    boostedRounds: [4, 5],
    pointRule: 'golden',
    pointsSystem: 'Rounds 4 & 5 — Central Court & Court 2 → 3 pts · Courts 3 & 4 → 2 pts · others → 1 pt.',
    competitionStructure: 'court_movement',
    changePartners: false,
    streakBonusFromRound: 3,
    rankingBasis: 'team',
    notes: [
      'Teams remain fixed unless the organizer announces otherwise.',
      'Any latecomer receives a technical loss.',
    ],
    active: true,
    updatedAt: SEED_AT,
  },
  {
    id: 'social_shuffle',
    name: 'Social Shuffle',
    description: 'Social night — partners rotate every round.',
    entryMode: 'solo',
    allowedGenderModes: ['male', 'female', 'mixed'],
    defaultGenderMode: 'mixed',
    warmupMinutes: 10,
    roundMinutes: 15,
    roundCount: 5,
    boostedRounds: [4, 5],
    pointRule: 'golden',
    pointsSystem: 'Rounds 4 & 5 — Court 1 & Court 2 → 3 pts · Courts 3 & 4 → 2 pts · others → 1 pt.',
    competitionStructure: 'social',
    changePartners: true,
    streakBonusFromRound: 3,
    rankingBasis: 'individual',
    notes: [
      'Players change partners every round.',
      'Final ranking is individual, not by fixed pair.',
    ],
    active: true,
    updatedAt: SEED_AT,
  },
  {
    id: 'mini_tournament',
    name: 'Mini-Tournament',
    description: 'Group stage then knockout. Bracket depth depends on team count.',
    entryMode: 'team',
    allowedGenderModes: ['male', 'female', 'mixed', 'mixed_pairs'],
    defaultGenderMode: 'mixed',
    warmupMinutes: 10,
    roundMinutes: null,
    roundCount: 5,
    boostedRounds: [],
    pointRule: 'golden',
    pointsSystem: 'Group games then knockout. Quarters only when entry count supports an 8-team bracket; otherwise semis → finals.',
    competitionStructure: 'tournament',
    changePartners: false,
    streakBonusFromRound: null,
    rankingBasis: 'team',
    notes: [
      '3 group-stage games (20 min cap), semi-finals & finals 25 min.',
      'Top 2 teams per group play for 1st–4th; others play for 5th–8th.',
      'With more teams, insert quarter-finals before semis.',
    ],
    active: true,
    updatedAt: SEED_AT,
  },
];

/** Static seed map. Prefer formatConfig() so admin edits apply at runtime. */
export const FORMAT_CONFIG: Record<GameFormat, FormatConfig> = Object.fromEntries(
  SEED_FORMAT_DEFINITIONS.map((d) => [d.id, definitionToConfig(d)]),
) as Record<GameFormat, FormatConfig>;

/** Live configs — updated when an admin saves a format. */
const runtimeFormatConfigs: Record<GameFormat, FormatConfig> = { ...FORMAT_CONFIG };
const runtimeEntryMode: Partial<Record<GameFormat, FormatEntryMode>> = {};

export function syncRuntimeFormatConfig(def: FormatDefinition): void {
  runtimeFormatConfigs[def.id] = definitionToConfig(def);
  runtimeEntryMode[def.id] = def.entryMode;
}

export function formatConfig(format: GameFormat): FormatConfig {
  return runtimeFormatConfigs[format] ?? FORMAT_CONFIG[format];
}

export function formatEntryMode(format: GameFormat): FormatEntryMode {
  return runtimeEntryMode[format]
    ?? SEED_FORMAT_DEFINITIONS.find((d) => d.id === format)?.entryMode
    ?? 'team';
}

/**
 * Boosted-points helper (spec §3): Central Court & Court 2 → 3, Courts 3 & 4 → 2,
 * everything below → 1.
 */
export function courtBoostPoints(court: number): number {
  if (court <= 2) return 3;
  if (court <= 4) return 2;
  return 1;
}
