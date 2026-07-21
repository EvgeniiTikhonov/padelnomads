import type { Game, GameParticipant, User } from '@/types';

export function visibleGames(games: Game[]): Game[] {
  return games.filter((g) => !g.deleted);
}

// PRD §7.3 — games scheduled for the next 2 weeks
export function upcomingGamesNextTwoWeeks(games: Game[]): Game[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + 14);
  return visibleGames(games)
    .filter((g) => (g.status === 'upcoming' || g.status === 'live'))
    .filter((g) => {
      const d = new Date(g.date + 'T00:00:00');
      return d >= today && d <= horizon;
    })
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

export function rosterFor(participants: GameParticipant[], gameId: string): GameParticipant[] {
  return participants.filter((p) => p.gameId === gameId);
}

export function spotsTaken(participants: GameParticipant[], gameId: string): number {
  return rosterFor(participants, gameId).filter(
    (p) => !['cancelled', 'waitlisted'].includes(p.status),
  ).length;
}

export interface LeaderboardRow {
  rank: number;
  user: User;
  gamesPlayed: number;
}

// PRD §7.4 — banned players excluded
export function leaderboard(users: User[], participants: GameParticipant[], games: Game[]): LeaderboardRow[] {
  const completedGameIds = new Set(games.filter((g) => g.status === 'completed' && !g.deleted).map((g) => g.id));
  return users
    .filter((u) => u.role === 'player' && u.status !== 'banned' && u.status !== 'rejected')
    .sort((a, b) => b.points - a.points)
    .map((user, i) => ({
      rank: i + 1,
      user,
      gamesPlayed: participants.filter(
        (p) => p.userId === user.id && completedGameIds.has(p.gameId) && p.status !== 'cancelled',
      ).length,
    }));
}

export interface LeaderboardDetailedRow {
  rank: number;
  user: User;
  gamesPlayed: number;
  first: number;
  second: number;
  third: number;
  points: number;
}

/**
 * Leaderboard with podium counts and an optional date window (yyyy-mm-dd,
 * inclusive). Without a window, points = the player's official rating (incl.
 * manual adjustments); within a window, points earned in those games are summed.
 */
export function leaderboardDetailed(
  users: User[],
  participants: GameParticipant[],
  games: Game[],
  range?: { from?: string; to?: string },
): LeaderboardDetailedRow[] {
  const hasRange = Boolean(range?.from || range?.to);
  const completedIds = new Set(
    games
      .filter((g) => g.status === 'completed' && !g.deleted)
      .filter((g) => (!range?.from || g.date >= range.from) && (!range?.to || g.date <= range.to))
      .map((g) => g.id),
  );

  return users
    .filter((u) => u.role === 'player' && u.status !== 'banned' && u.status !== 'rejected')
    .map((user) => {
      const mine = participants.filter(
        (p) => p.userId === user.id && completedIds.has(p.gameId) && p.status !== 'cancelled',
      );
      return {
        rank: 0,
        user,
        gamesPlayed: mine.length,
        first: mine.filter((p) => p.position === 1).length,
        second: mine.filter((p) => p.position === 2).length,
        third: mine.filter((p) => p.position === 3).length,
        points: hasRange
          ? mine.reduce((s, p) => s + (p.pointsAwarded ?? 0), 0)
          : user.points,
      };
    })
    .sort((a, b) =>
      b.points - a.points ||
      b.first - a.first || b.second - a.second || b.third - a.third ||
      b.gamesPlayed - a.gamesPlayed)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}
