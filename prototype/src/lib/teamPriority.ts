import type { Game, GameParticipant } from '@/types';
import { mainListTeamUnits, maxFixedTeams } from '@/lib/derive';
import { isFixedTeamFormat } from '@/lib/format';

/** Registration priority for fixed-team formats (lower = higher priority). */
export type TeamEntryKind = 'full_pair' | 'partner_pending' | 'solo';

export const TEAM_ENTRY_PRIORITY: Record<TeamEntryKind, number> = {
  full_pair: 1,
  partner_pending: 2,
  solo: 3,
};

export const TEAM_ENTRY_LABELS: Record<TeamEntryKind, string> = {
  full_pair: 'Full pair',
  partner_pending: 'Player + Partner',
  solo: 'Needs partner',
};

/** Partner name deadline: 20:00 local on the registration calendar day. */
export const PARTNER_NAME_DEADLINE_HOUR = 20;

export function partnerNameDueAtFrom(registeredAt: Date = new Date()): string {
  const d = new Date(registeredAt);
  d.setHours(PARTNER_NAME_DEADLINE_HOUR, 0, 0, 0);
  // If they register after 8pm, due end of next calendar day at 8pm
  if (registeredAt.getTime() >= d.getTime()) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

export function teamEntryKindOf(p: GameParticipant): TeamEntryKind {
  if (p.teamEntryKind) return p.teamEntryKind;
  if (p.partnerUserId || (p.partnerName && !p.lookingForPartner)) return 'full_pair';
  if (p.partnerNameDueAt && !p.lookingForPartner) return 'partner_pending';
  if (p.lookingForPartner) return 'solo';
  // Linked pending invite still counts as forming a pair
  if (p.partnerInviteFrom) return 'full_pair';
  return 'solo';
}

export function teamUnitPriority(participants: GameParticipant[]): number {
  return Math.min(...participants.map((p) => TEAM_ENTRY_PRIORITY[teamEntryKindOf(p)]));
}

export function teamUnitKind(participants: GameParticipant[]): TeamEntryKind {
  const rank = teamUnitPriority(participants);
  if (rank === 1) return 'full_pair';
  if (rank === 2) return 'partner_pending';
  return 'solo';
}

/**
 * When a new unit of `incomingKind` wants a main-list slot on a full game,
 * which existing main-list units can be displaced (lowest priority first).
 * Same-tier teams are not displaced — new joiners go to the waitlist.
 */
export function displaceableMainListUnits(
  participants: GameParticipant[],
  gameId: string,
  incomingKind: TeamEntryKind,
): { userIds: string[]; priority: number; createdAt: string }[] {
  const incomingRank = TEAM_ENTRY_PRIORITY[incomingKind];
  const byUser = new Map(
    participants.filter((p) => p.gameId === gameId).map((p) => [p.userId, p]),
  );
  return mainListTeamUnits(participants, gameId)
    .map((u) => {
      const members = u.userIds
        .map((id) => byUser.get(id))
        .filter((p): p is GameParticipant => Boolean(p));
      return {
        userIds: u.userIds,
        priority: teamUnitPriority(members),
        createdAt: u.createdAt,
      };
    })
    .filter((u) => u.priority > incomingRank)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority; // worst first
      return b.createdAt.localeCompare(a.createdAt); // newest first among same tier
    });
}

/** Prefer keeping higher-priority (and earlier) teams when clamping capacity. */
export function sortUnitsForClamp(
  units: { userIds: string[]; createdAt: string }[],
  participants: GameParticipant[],
  gameId: string,
): { userIds: string[]; createdAt: string; priority: number }[] {
  const byUser = new Map(
    participants.filter((p) => p.gameId === gameId).map((p) => [p.userId, p]),
  );
  return units
    .map((u) => {
      const members = u.userIds
        .map((id) => byUser.get(id))
        .filter((p): p is GameParticipant => Boolean(p));
      return { ...u, priority: teamUnitPriority(members) };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

/**
 * Move partner_pending teams past their deadline to the waitlist as solos.
 */
export function enforcePartnerNameDeadlines(
  participants: GameParticipant[],
  games: Pick<Game, 'id' | 'format' | 'deleted'>[],
  at: Date = new Date(),
): { participants: GameParticipant[]; demotedUserIds: string[] } {
  const atMs = at.getTime();
  const teamGameIds = new Set(
    games.filter((g) => !g.deleted && isFixedTeamFormat(g.format)).map((g) => g.id),
  );
  const demotedUserIds: string[] = [];
  const next = participants.map((p) => {
    if (!teamGameIds.has(p.gameId)) return p;
    if (p.status === 'cancelled' || p.status === 'waitlisted') return p;
    if (teamEntryKindOf(p) !== 'partner_pending') return p;
    if (!p.partnerNameDueAt || new Date(p.partnerNameDueAt).getTime() > atMs) return p;
    // Still missing a real partner name / linked Nomad
    if (p.partnerUserId || (p.partnerName && p.partnerName.trim())) return p;
    demotedUserIds.push(p.userId);
    return {
      ...p,
      status: 'waitlisted' as const,
      confirmedAt: undefined,
      teamEntryKind: 'solo' as const,
      lookingForPartner: true,
      partnerNameDueAt: undefined,
      partnerName: undefined,
      updatedAt: at.toISOString(),
    };
  });
  return { participants: next, demotedUserIds };
}

export function openTeamSlotsAfterDisplacement(
  game: Pick<Game, 'capacity'>,
  participants: GameParticipant[],
  gameId: string,
  incomingKind: TeamEntryKind,
): { open: number; displaceUserIds: string[] } {
  const max = maxFixedTeams(game.capacity);
  const taken = mainListTeamUnits(participants, gameId).length;
  const open = Math.max(0, max - taken);
  if (open > 0) return { open, displaceUserIds: [] };
  const candidates = displaceableMainListUnits(participants, gameId, incomingKind);
  if (candidates.length === 0) return { open: 0, displaceUserIds: [] };
  return { open: 1, displaceUserIds: candidates[0]!.userIds };
}
