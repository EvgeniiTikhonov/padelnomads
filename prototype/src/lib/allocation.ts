import type { Game, GameParticipant, User } from '@/types';
import { levelRank } from './eligibility';
import { isFixedTeamFormat } from './format';
import { formatConfig } from './gameFormats';

// Court allocation ("initial distribution") for a game.
//
// Admins seed courts BEFORE a game starts: the strongest pairs go on the top
// courts (Court 1 / Central, then 2, 3, …) so play is balanced from round 1.
// Strength is derived from each player's level, whether that level is verified,
// their rating points, and their win rate (a proxy for statistics / head-to-head
// history). Admins can then reorder by hand, and those manual tweaks feed a small
// per-player bias that nudges future auto-distributions.

export interface StrengthContext {
  /** 0–100 career win rate, or null when the player has no recorded matches. */
  winRateFor: (userId: string) => number | null;
  /** Learned manual bias from past admin adjustments (default 0). */
  biasFor: (userId: string) => number;
}

/** Ordered team = 1–2 player ids. Court is derived from list position. */
export type OrderedTeams = string[][];

export const TEAMS_PER_COURT = 2; // 4 players per court

/** Single-player strength score. Higher = stronger. */
export function playerStrength(user: User | undefined, ctx: StrengthContext): number {
  if (!user) return 0;
  const levelScore = levelRank(user.level) * 10; // dominant signal: 0–90
  const verifiedBonus = user.levelVerified ? 4 : 0; // verified level edges ahead of an equal unverified one
  const ratingScore = user.points / 40; // leaderboard rating, ~0–16
  const winRate = ctx.winRateFor(user.id);
  const winScore = winRate == null ? 0 : (winRate - 50) / 10; // ±5 around an even record
  const bias = ctx.biasFor(user.id); // learned from past manual moves
  return levelScore + verifiedBonus + ratingScore + winScore + bias;
}

/** Combined strength of a pair (or a lone player). */
export function teamStrength(playerIds: string[], users: User[], ctx: StrengthContext): number {
  return playerIds.reduce((sum, id) => sum + playerStrength(users.find((u) => u.id === id), ctx), 0);
}

function activeParticipants(participants: GameParticipant[], gameId: string): GameParticipant[] {
  return participants.filter(
    (p) => p.gameId === gameId && !['cancelled', 'waitlisted', 'no_show'].includes(p.status),
  );
}

/**
 * Build the seeded team list for a game, strongest team first.
 * - Fixed-team formats keep confirmed partner pairs together; any leftover solo
 *   players are paired up by strength.
 * - Solo formats sort every player by strength and pair adjacent ranks.
 */
export function buildOrderedTeams(
  game: Game,
  participants: GameParticipant[],
  users: User[],
  ctx: StrengthContext,
): OrderedTeams {
  const active = activeParticipants(participants, game.id);
  const teams: string[][] = [];

  if (isFixedTeamFormat(game.format)) {
    const activeIds = new Set(active.map((p) => p.userId));
    const seen = new Set<string>();
    const solos: string[] = [];
    for (const p of active) {
      if (seen.has(p.userId)) continue;
      const partnerId = p.partnerUserId;
      if (partnerId && activeIds.has(partnerId) && !seen.has(partnerId)) {
        teams.push([p.userId, partnerId]);
        seen.add(p.userId);
        seen.add(partnerId);
      } else {
        solos.push(p.userId);
        seen.add(p.userId);
      }
    }
    // Pair leftover solos by strength (strongest with next strongest).
    solos.sort((a, b) => playerStrength(users.find((u) => u.id === b), ctx) - playerStrength(users.find((u) => u.id === a), ctx));
    for (let i = 0; i < solos.length; i += 2) {
      teams.push(solos.slice(i, i + 2));
    }
  } else {
    const solos = active
      .map((p) => p.userId)
      .sort((a, b) => playerStrength(users.find((u) => u.id === b), ctx) - playerStrength(users.find((u) => u.id === a), ctx));
    for (let i = 0; i < solos.length; i += 2) {
      teams.push(solos.slice(i, i + 2));
    }
  }

  // Strongest team on the top court.
  teams.sort((a, b) => teamStrength(b, users, ctx) - teamStrength(a, users, ctx));
  return teams;
}

/** Court number for a team at position `index` (0-based) in the ordered list. */
export function courtForIndex(index: number): number {
  return Math.floor(index / TEAMS_PER_COURT) + 1;
}

/** Group an ordered team list into courts. */
export interface CourtGroup {
  court: number;
  teams: string[][];
}
export function groupByCourt(ordered: OrderedTeams): CourtGroup[] {
  const groups: CourtGroup[] = [];
  ordered.forEach((team, i) => {
    const court = courtForIndex(i);
    let group = groups.find((g) => g.court === court);
    if (!group) {
      group = { court, teams: [] };
      groups.push(group);
    }
    group.teams.push(team);
  });
  return groups;
}

/** Label for a court number — Court 1 is "Central Court" on King-style formats. */
export function courtLabel(court: number, format: Game['format']): string {
  if (court === 1 && (format === 'king_of_the_court' || format === 'king_queen_of_the_court')) {
    return 'Court Central';
  }
  return `Court ${court}`;
}

function firstName(users: User[], id: string): string {
  const u = users.find((x) => x.id === id);
  return u ? u.name.split(' ')[0] : 'Player';
}

/** "Ali + Jessica" style label for a team. */
export function teamLabel(playerIds: string[], users: User[]): string {
  return playerIds.map((id) => firstName(users, id)).join(' + ') || '—';
}

/**
 * WhatsApp-ready announcement: schedule + points system + the initial court
 * distribution, mirroring the King & Queen of the Court message format.
 */
export function buildDistributionMessage(game: Game, ordered: OrderedTeams, users: User[]): string {
  const cfg = formatConfig(game.format);
  const crown = game.format === 'king_queen_of_the_court' || game.format === 'king_of_the_court' ? '👑 ' : '🎾 ';
  const roundsLine = cfg.roundMinutes
    ? `${cfg.rounds.length} rounds — ${cfg.roundMinutes} min each`
    : `${cfg.rounds.length} stages`;

  const lines: string[] = [];
  lines.push(`${crown}${game.title} ${crown}`.trim());
  lines.push('');
  lines.push('⏱ Schedule');
  lines.push(`•  ${cfg.warmupMinutes} min warm-up`);
  lines.push(`•  Start time: ${game.startTime} sharp`);
  lines.push(`•  ${roundsLine}`);
  lines.push(`•  ${cfg.pointRule}`);
  lines.push('');
  lines.push('⚠️ Important');
  lines.push('•  Any latecomers will receive a technical loss');
  lines.push('');
  lines.push('🏆 Points System');
  if (cfg.boostRule) {
    lines.push(`•  ${cfg.boostRule}`);
  } else {
    lines.push('•  1 win = 1 point');
  }
  if (cfg.streakBonusFromRound != null) {
    lines.push(`🔥 Bonus: from Round ${cfg.streakBonusFromRound}, two wins in a row earn +1 bonus point.`);
  }
  lines.push('');
  lines.push('Initial Court Distribution:');
  for (const group of groupByCourt(ordered)) {
    lines.push('');
    lines.push(`*${courtLabel(group.court, game.format)}*`);
    for (const team of group.teams) {
      lines.push(teamLabel(team, users));
    }
  }
  return lines.join('\n');
}
