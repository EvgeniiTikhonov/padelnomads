import type { ExternalPartnerInvite, Game, GameParticipant, User } from '@/types';
import { fixedTeamsTaken, maxFixedTeams, spotsTaken } from '@/lib/derive';
import { isFixedTeamFormat } from '@/lib/format';
import {
  TEAM_ENTRY_PRIORITY,
  teamEntryKindOf,
  teamUnitKind,
  teamUnitPriority,
  type TeamEntryKind,
} from '@/lib/teamPriority';

/**
 * Waitlist priority (solo formats): higher karma first; earlier join time breaks ties.
 * Restricted / suspended players stay on the list but are skipped when promoting.
 */
export function waitlistOrdered(
  participants: GameParticipant[],
  users: User[],
  gameId: string,
): GameParticipant[] {
  const byUser = new Map(users.map((u) => [u.id, u]));
  return participants
    .filter((p) => p.gameId === gameId && p.status === 'waitlisted')
    .slice()
    .sort((a, b) => {
      const ka = byUser.get(a.userId)?.karmaBalance ?? 0;
      const kb = byUser.get(b.userId)?.karmaBalance ?? 0;
      if (kb !== ka) return kb - ka;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

/** One waitlist entry for capacity / promotion — a solo or a linked pair. */
export interface WaitlistUnit {
  kind: 'solo' | 'pair';
  entryKind: TeamEntryKind;
  /** Participants in this unit (1 or 2). */
  participants: GameParticipant[];
  /** Max karma among members (drives order within the same entry tier). */
  karma: number;
  /** Earliest createdAt among members (tie-break). */
  createdAt: string;
}

/**
 * Group waitlisted rows into solo / pair units for fixed-team games.
 * Order: full pairs → partner pending → solos, then karma, then join time.
 */
export function waitlistUnitsOrdered(
  participants: GameParticipant[],
  users: User[],
  gameId: string,
): WaitlistUnit[] {
  const byUser = new Map(users.map((u) => [u.id, u]));
  const waitlisted = participants.filter((p) => p.gameId === gameId && p.status === 'waitlisted');
  const byUserId = new Map(waitlisted.map((p) => [p.userId, p]));
  const seen = new Set<string>();
  const units: WaitlistUnit[] = [];

  for (const p of waitlisted) {
    if (seen.has(p.userId)) continue;

    const partnerId = p.partnerUserId;
    const partner = partnerId ? byUserId.get(partnerId) : undefined;
    if (partner && partner.partnerUserId === p.userId) {
      seen.add(p.userId);
      seen.add(partner.userId);
      const members = [p, partner];
      units.push({
        kind: 'pair',
        entryKind: teamUnitKind(members),
        participants: members,
        karma: Math.max(
          byUser.get(p.userId)?.karmaBalance ?? 0,
          byUser.get(partner.userId)?.karmaBalance ?? 0,
        ),
        createdAt: members.map((m) => m.createdAt).sort()[0]!,
      });
      continue;
    }

    seen.add(p.userId);
    units.push({
      kind: 'solo',
      entryKind: teamEntryKindOf(p),
      participants: [p],
      karma: byUser.get(p.userId)?.karmaBalance ?? 0,
      createdAt: p.createdAt,
    });
  }

  return units.sort((a, b) => {
    const pa = TEAM_ENTRY_PRIORITY[a.entryKind];
    const pb = TEAM_ENTRY_PRIORITY[b.entryKind];
    if (pa !== pb) return pa - pb;
    if (b.karma !== a.karma) return b.karma - a.karma;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

/** 1-based position on the karma-ordered waitlist, or null if not waitlisted. */
export function waitlistPosition(
  participants: GameParticipant[],
  users: User[],
  gameId: string,
  userId: string,
  format?: Game['format'],
): number | null {
  if (format && isFixedTeamFormat(format)) {
    const units = waitlistUnitsOrdered(participants, users, gameId);
    const idx = units.findIndex((u) => u.participants.some((p) => p.userId === userId));
    return idx >= 0 ? idx + 1 : null;
  }
  const ordered = waitlistOrdered(participants, users, gameId);
  const idx = ordered.findIndex((p) => p.userId === userId);
  return idx >= 0 ? idx + 1 : null;
}

function canPromoteUser(user: User | undefined): boolean {
  if (!user) return false;
  if (user.status === 'banned') return false;
  return user.karmaTier !== 'restricted' && user.karmaTier !== 'suspended';
}

function canPromoteUnit(unit: WaitlistUnit, byUser: Map<string, User>): boolean {
  return unit.participants.every((p) => canPromoteUser(byUser.get(p.userId)));
}

/** How many main-list seats are free (person capacity). */
export function openMainListSpots(
  game: Game,
  participants: GameParticipant[],
  externalInvites: ExternalPartnerInvite[] = [],
): number {
  return Math.max(0, game.capacity - spotsTaken(participants, game.id, externalInvites, game.format));
}

/** How many team slots are free on a fixed-team game. */
export function openMainListTeamSlots(
  game: Game,
  participants: GameParticipant[],
  externalInvites: ExternalPartnerInvite[] = [],
): number {
  return Math.max(
    0,
    maxFixedTeams(game.capacity) - fixedTeamsTaken(participants, game.id, externalInvites),
  );
}

/**
 * Next waitlisted players eligible for automatic promotion, in priority order.
 * Fixed-team: entry tier (full pair → partner pending → solo), then karma.
 */
export function nextWaitlistPromotions(
  participants: GameParticipant[],
  users: User[],
  game: Game,
  externalInvites: ExternalPartnerInvite[] = [],
  limit?: number,
): GameParticipant[] {
  const byUser = new Map(users.map((u) => [u.id, u]));

  if (isFixedTeamFormat(game.format)) {
    const openTeams = Math.min(
      openMainListTeamSlots(game, participants, externalInvites),
      limit ?? Number.POSITIVE_INFINITY,
    );
    if (openTeams <= 0) return [];
    const selected: GameParticipant[] = [];
    let teamsPicked = 0;
    for (const unit of waitlistUnitsOrdered(participants, users, game.id)) {
      if (teamsPicked >= openTeams) break;
      if (!canPromoteUnit(unit, byUser)) continue;
      selected.push(...unit.participants);
      teamsPicked += 1;
    }
    return selected;
  }

  const open = openMainListSpots(game, participants, externalInvites);
  const n = Math.min(open, limit ?? open);
  if (n <= 0) return [];
  return waitlistOrdered(participants, users, game.id)
    .filter((p) => canPromoteUser(byUser.get(p.userId)))
    .slice(0, n);
}

/**
 * Flip selected waitlist rows to confirmed.
 * Fixed-team solos keep / regain lookingForPartner; pairs stay linked.
 */
export function promoteWaitlistParticipants(
  participants: GameParticipant[],
  promoteIds: Set<string> | string[],
  at: string,
  opts?: { fixedTeam?: boolean },
): GameParticipant[] {
  const ids = promoteIds instanceof Set ? promoteIds : new Set(promoteIds);
  if (ids.size === 0) return participants;
  return participants.map((p) => {
    if (!ids.has(p.id) || p.status !== 'waitlisted') return p;
    const lookingForPartner = opts?.fixedTeam
      ? Boolean(p.lookingForPartner || (!p.partnerUserId && !p.partnerName && teamEntryKindOf(p) === 'solo'))
      : p.lookingForPartner;
    return {
      ...p,
      status: 'confirmed' as const,
      confirmedAt: at,
      confirmationRequestedAt: at,
      declinedAt: undefined,
      cancelledAt: undefined,
      replacementOfferedAt: undefined,
      letsGoAt: undefined,
      lookingForPartner: lookingForPartner || undefined,
      updatedAt: at,
    };
  });
}

// Re-export for callers that sort by unit priority
export { teamUnitPriority };
