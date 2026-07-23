import type { Game, GameFormat, GameMatch, GameTeam, User } from '@/types';
import { matchDecided, matchWinnerId } from './scoring';

// Playtomic-style player statistics, all derived from the per-round match
// records (GameMatch) of completed games. A "match" here is one team-vs-team
// round on a court — the same unit admins enter scores for.

export interface PlayerMatchRecord {
  game: Game;
  match: GameMatch;
  teamId: string;      // the player's team in that match
  won: boolean;
}

/** All decided matches the player took part in, oldest first. */
export function playerMatchRecords(
  playerId: string,
  games: Game[],
  teams: GameTeam[],
  matches: GameMatch[],
): PlayerMatchRecord[] {
  const completed = games
    .filter((g) => g.status === 'completed' && !g.deleted)
    .sort((a, b) => a.date.localeCompare(b.date));

  const records: PlayerMatchRecord[] = [];
  for (const game of completed) {
    const myTeam = teams.find((t) => t.gameId === game.id && t.playerIds.includes(playerId));
    if (!myTeam) continue;
    const mine = matches
      .filter((m) => m.gameId === game.id && (m.teamAId === myTeam.id || m.teamBId === myTeam.id) && matchDecided(m))
      .sort((a, b) => a.round - b.round);
    for (const match of mine) {
      records.push({ game, match, teamId: myTeam.id, won: matchWinnerId(match) === myTeam.id });
    }
  }
  return records;
}

export interface WinLossStats {
  played: number;
  won: number;
  lost: number;
  /** 0–100, null when no matches played. */
  winRate: number | null;
}

export function winLossStats(records: PlayerMatchRecord[]): WinLossStats {
  const won = records.filter((r) => r.won).length;
  const played = records.length;
  return {
    played,
    won,
    lost: played - won,
    winRate: played > 0 ? Math.round((won / played) * 100) : null,
  };
}

// ---- format grouping (King of the Court vs socials vs tournaments) ----

export type FormatGroup = 'king' | 'social' | 'tournament';

export const FORMAT_GROUP_LABELS: Record<FormatGroup, string> = {
  king: 'King of the Court',
  social: 'Socials',
  tournament: 'Tournaments',
};

export function formatGroup(format: GameFormat): FormatGroup {
  if (format === 'king_of_the_court' || format === 'king_queen_of_the_court') return 'king';
  if (format === 'mini_tournament') return 'tournament';
  return 'social'; // fixed_pairs, team_mexicano, social_shuffle
}

export function winLossByGroup(records: PlayerMatchRecord[]): Array<{ group: FormatGroup; stats: WinLossStats }> {
  return (['king', 'social', 'tournament'] as FormatGroup[])
    .map((group) => ({ group, stats: winLossStats(records.filter((r) => formatGroup(r.game.format) === group)) }))
    .filter(({ stats }) => stats.played > 0);
}

// ---- frequent partners ----

export interface PartnerStat {
  partner: User;
  gamesTogether: number;
  matches: number;
  wins: number;
  /** 0–100 */
  winRate: number;
}

export function partnerStats(
  playerId: string,
  users: User[],
  games: Game[],
  teams: GameTeam[],
  matches: GameMatch[],
): PartnerStat[] {
  const records = playerMatchRecords(playerId, games, teams, matches);
  const byPartner = new Map<string, { gameIds: Set<string>; matches: number; wins: number }>();

  for (const rec of records) {
    const team = teams.find((t) => t.id === rec.teamId);
    if (!team) continue;
    for (const mateId of team.playerIds) {
      if (mateId === playerId) continue;
      const entry = byPartner.get(mateId) ?? { gameIds: new Set<string>(), matches: 0, wins: 0 };
      entry.gameIds.add(rec.game.id);
      entry.matches += 1;
      if (rec.won) entry.wins += 1;
      byPartner.set(mateId, entry);
    }
  }

  return Array.from(byPartner.entries())
    .map(([mateId, e]) => {
      const partner = users.find((u) => u.id === mateId);
      if (!partner) return null;
      return {
        partner,
        gamesTogether: e.gameIds.size,
        matches: e.matches,
        wins: e.wins,
        winRate: Math.round((e.wins / e.matches) * 100),
      };
    })
    .filter((p): p is PartnerStat => p !== null)
    .sort((a, b) => b.matches - a.matches || b.winRate - a.winRate);
}

// ---- head-to-head ----

export interface HeadToHead {
  matches: number;
  viewerWins: number;
  otherWins: number;
}

/** Record between two players from matches where they were on opposite teams. */
export function headToHead(
  viewerId: string,
  otherId: string,
  games: Game[],
  teams: GameTeam[],
  matches: GameMatch[],
): HeadToHead {
  const completedIds = new Set(games.filter((g) => g.status === 'completed' && !g.deleted).map((g) => g.id));
  let viewerWins = 0;
  let otherWins = 0;

  for (const m of matches) {
    if (!completedIds.has(m.gameId) || !matchDecided(m)) continue;
    const teamA = teams.find((t) => t.id === m.teamAId);
    const teamB = teams.find((t) => t.id === m.teamBId);
    if (!teamA || !teamB) continue;
    const viewerTeam = teamA.playerIds.includes(viewerId) ? teamA : teamB.playerIds.includes(viewerId) ? teamB : null;
    const otherTeam = teamA.playerIds.includes(otherId) ? teamA : teamB.playerIds.includes(otherId) ? teamB : null;
    if (!viewerTeam || !otherTeam || viewerTeam.id === otherTeam.id) continue;
    if (matchWinnerId(m) === viewerTeam.id) viewerWins++;
    else otherWins++;
  }

  return { matches: viewerWins + otherWins, viewerWins, otherWins };
}
