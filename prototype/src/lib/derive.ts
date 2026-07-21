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
