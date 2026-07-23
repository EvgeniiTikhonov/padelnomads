import type { ExternalPartnerInvite, Game, GameFormat, GameParticipant, LeaderboardKind, User } from '@/types';
import { isFixedTeamFormat } from '@/lib/format';

/** Games that count toward a given leaderboard scope. Community = every game. */
export function gamesForLeaderboard(games: Game[], kind: LeaderboardKind = 'community'): Game[] {
  if (kind === 'community') return games;
  return games.filter((g) => g.league === kind);
}

export function visibleGames(games: Game[]): Game[] {
  return games.filter((g) => !g.deleted);
}

export function isExternalPartnerHoldActive(
  invite: ExternalPartnerInvite,
  at: number = Date.now(),
): boolean {
  return new Date(invite.expiresAt).getTime() > at;
}

/** Active (non-expired) off-app partner holds for a game — each counts as one roster spot. */
export function activeExternalHolds(
  invites: ExternalPartnerInvite[],
  gameId: string,
  at: number = Date.now(),
): ExternalPartnerInvite[] {
  return invites.filter((i) => i.gameId === gameId && isExternalPartnerHoldActive(i, at));
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

/** Max teams for a fixed-team game (8 players → 4 teams, 16 → 8). */
export function maxFixedTeams(capacity: number): number {
  return Math.floor(capacity / 2);
}

/** Main-list team units (pair / pending / solo) for capacity enforcement. */
export function mainListTeamUnits(
  participants: GameParticipant[],
  gameId: string,
): { userIds: string[]; createdAt: string }[] {
  const active = rosterFor(participants, gameId).filter(
    (p) => !['cancelled', 'waitlisted'].includes(p.status),
  );
  const byUser = new Map(active.map((p) => [p.userId, p]));
  const seen = new Set<string>();
  const units: { userIds: string[]; createdAt: string }[] = [];

  for (const p of active) {
    if (seen.has(p.userId)) continue;

    if (p.partnerUserId && byUser.has(p.partnerUserId)) {
      const partner = byUser.get(p.partnerUserId)!;
      seen.add(p.userId);
      seen.add(p.partnerUserId);
      units.push({
        userIds: [p.userId, p.partnerUserId],
        createdAt: [p.createdAt, partner.createdAt].sort()[0]!,
      });
      continue;
    }

    if (p.partnerInviteFrom && byUser.has(p.partnerInviteFrom)) {
      const proposer = byUser.get(p.partnerInviteFrom)!;
      seen.add(p.userId);
      seen.add(p.partnerInviteFrom);
      units.push({
        userIds: [p.userId, p.partnerInviteFrom],
        createdAt: [p.createdAt, proposer.createdAt].sort()[0]!,
      });
      continue;
    }

    // Outgoing invite proposer is counted with the recipient above
    if (active.some((q) => q.partnerInviteFrom === p.userId)) {
      continue;
    }

    seen.add(p.userId);
    units.push({ userIds: [p.userId], createdAt: p.createdAt });
  }

  return units;
}

/**
 * How many team slots are occupied on a fixed-team game.
 * A pair, a pending invite pair, a solo looking for a partner, or a solo +
 * Partner (TBC) hold each count as one team.
 */
export function fixedTeamsTaken(
  participants: GameParticipant[],
  gameId: string,
  _externalInvites: ExternalPartnerInvite[] = [],
): number {
  return mainListTeamUnits(participants, gameId).length;
}

/**
 * Demote excess main-list team units to the waitlist.
 * Keeps higher-priority teams (full pair → partner pending → solo), then earliest.
 */
export function clampFixedTeamRosters(
  participants: GameParticipant[],
  games: Pick<Game, 'id' | 'capacity' | 'format' | 'deleted'>[],
): GameParticipant[] {
  const entryRank = (p: GameParticipant): number => {
    if (p.teamEntryKind === 'full_pair') return 1;
    if (p.teamEntryKind === 'partner_pending') return 2;
    if (p.teamEntryKind === 'solo') return 3;
    if (p.partnerUserId || (p.partnerName && !p.lookingForPartner)) return 1;
    if (p.partnerNameDueAt) return 2;
    return 3;
  };

  let next = participants;
  for (const game of games) {
    if (game.deleted || !isFixedTeamFormat(game.format)) continue;
    const max = maxFixedTeams(game.capacity);
    const byUser = new Map(
      next.filter((p) => p.gameId === game.id).map((p) => [p.userId, p]),
    );
    const units = mainListTeamUnits(next, game.id)
      .map((u) => {
        const members = u.userIds
          .map((id) => byUser.get(id))
          .filter((p): p is GameParticipant => Boolean(p));
        const priority = Math.min(...members.map(entryRank), 3);
        return { ...u, priority };
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.createdAt.localeCompare(b.createdAt);
      });
    if (units.length <= max) continue;
    const demote = new Set(units.slice(max).flatMap((u) => u.userIds));
    next = next.map((p) => {
      if (p.gameId !== game.id || !demote.has(p.userId)) return p;
      if (['cancelled', 'waitlisted'].includes(p.status)) return p;
      return {
        ...p,
        status: 'waitlisted' as const,
        confirmedAt: undefined,
        lookingForPartner: p.partnerUserId ? undefined : true,
        teamEntryKind: p.partnerUserId || p.partnerName
          ? 'full_pair' as const
          : p.teamEntryKind === 'partner_pending'
            ? 'partner_pending' as const
            : 'solo' as const,
      };
    });
  }
  return next;
}

/**
 * Player seats occupied toward capacity.
 * Fixed-team formats: each team slot counts as 2 (so 4 teams fill an 8-player game).
 */
export function spotsTaken(
  participants: GameParticipant[],
  gameId: string,
  externalInvites: ExternalPartnerInvite[] = [],
  format?: GameFormat,
): number {
  if (format && isFixedTeamFormat(format)) {
    return fixedTeamsTaken(participants, gameId, externalInvites) * 2;
  }
  const people = rosterFor(participants, gameId).filter(
    (p) => !['cancelled', 'waitlisted'].includes(p.status),
  ).length;
  return people + activeExternalHolds(externalInvites, gameId).length;
}

export function isGameFull(
  participants: GameParticipant[],
  gameId: string,
  externalInvites: ExternalPartnerInvite[],
  game: Pick<Game, 'capacity' | 'format'>,
): boolean {
  return spotsTaken(participants, gameId, externalInvites, game.format) >= game.capacity;
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
 * Leaderboard with podium counts, optional date window (yyyy-mm-dd, inclusive),
 * and optional league scope.
 *
 * - Community + no window: points = official rating (incl. manual adjustments).
 * - Community + window, or any league: points = sum of pointsAwarded from
 *   matching completed games only.
 */
export function leaderboardDetailed(
  users: User[],
  participants: GameParticipant[],
  games: Game[],
  range?: { from?: string; to?: string },
  kind: LeaderboardKind = 'community',
): LeaderboardDetailedRow[] {
  const hasRange = Boolean(range?.from || range?.to);
  const deriveFromGames = hasRange || kind !== 'community';
  const completedIds = new Set(
    gamesForLeaderboard(games, kind)
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
        points: deriveFromGames
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
