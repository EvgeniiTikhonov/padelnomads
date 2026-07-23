'use client';

import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParticipantStatusBadge, VerifiedBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { isExternalPartnerHoldActive, maxFixedTeams } from '@/lib/derive';
import { partnerPairEligibility, requiresMixedGenderPair } from '@/lib/eligibility';
import { LEVEL_LABELS, initials } from '@/lib/format';
import type { ExternalPartnerInvite, Game, GameParticipant, User } from '@/types';

type TeamEntry =
  | {
      key: string;
      kind: 'paired';
      a: GameParticipant;
      b: GameParticipant;
      userA: User;
      userB: User;
    }
  | {
      key: string;
      kind: 'pending';
      a: GameParticipant;
      b: GameParticipant;
      userA: User;
      userB: User;
    }
  | {
      key: string;
      kind: 'tbc';
      a: GameParticipant;
      userA: User;
      hold: ExternalPartnerInvite;
    }
  | {
      key: string;
      kind: 'open';
      a: GameParticipant;
      userA: User;
    };

function buildTeamEntries(
  active: GameParticipant[],
  users: User[],
  externalPartnerInvites: ExternalPartnerInvite[],
  gameId: string,
): TeamEntry[] {
  const userFor = (id: string) => users.find((u) => u.id === id);
  const byUser = new Map(active.map((p) => [p.userId, p]));
  const seen = new Set<string>();
  const entries: TeamEntry[] = [];

  for (const p of active) {
    if (seen.has(p.userId)) continue;
    const u = userFor(p.userId);
    if (!u) continue;

    if (p.partnerUserId) {
      const partnerPart = byUser.get(p.partnerUserId);
      const partnerUser = userFor(p.partnerUserId);
      if (partnerPart && partnerUser) {
        seen.add(p.userId);
        seen.add(p.partnerUserId);
        entries.push({
          key: `pair-${[p.userId, p.partnerUserId].sort().join('-')}`,
          kind: 'paired',
          a: p,
          b: partnerPart,
          userA: u,
          userB: partnerUser,
        });
        continue;
      }
    }

    // Pending join/invite: show recipient + proposer as one team
    if (p.partnerInviteFrom) {
      const proposerPart = byUser.get(p.partnerInviteFrom);
      const proposerUser = userFor(p.partnerInviteFrom);
      if (proposerPart && proposerUser) {
        seen.add(p.userId);
        seen.add(p.partnerInviteFrom);
        entries.push({
          key: `pending-${p.userId}-${p.partnerInviteFrom}`,
          kind: 'pending',
          a: p,
          b: proposerPart,
          userA: u,
          userB: proposerUser,
        });
        continue;
      }
    }

    const hold = externalPartnerInvites.find(
      (i) => i.gameId === gameId && i.fromUserId === p.userId && isExternalPartnerHoldActive(i),
    );
    // Proposer with an outgoing join request is shown on the recipient's pending team
    if (!hold && active.some((q) => q.partnerInviteFrom === p.userId)) {
      continue;
    }
    seen.add(p.userId);
    if (hold) {
      entries.push({ key: `tbc-${p.userId}`, kind: 'tbc', a: p, userA: u, hold });
    } else {
      entries.push({ key: `open-${p.userId}`, kind: 'open', a: p, userA: u });
    }
  }

  return entries;
}

function PlayerChip({
  user,
  you,
  status,
}: {
  user: User;
  you?: boolean;
  status?: GameParticipant['status'];
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link href={`/app/players/${user.id}`} className="flex min-w-0 items-center gap-2 hover:text-primary">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {user.name}
            {you && <span className="text-muted-foreground"> (you)</span>}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {LEVEL_LABELS[user.level]}
            {user.levelVerified && <VerifiedBadge className="size-3.5" />}
          </span>
        </span>
      </Link>
      {status && <ParticipantStatusBadge status={status} />}
    </div>
  );
}

/**
 * Fixed-team formats: roster grouped as teams of two (paired, TBC, or open slot).
 */
export function FixedTeamRoster({ game }: { game: Game }) {
  const {
    participants, users, currentUser, externalPartnerInvites, proposePartnerJoin,
  } = useMockData();

  const active = participants.filter(
    (p) => p.gameId === game.id && !['cancelled', 'waitlisted'].includes(p.status),
  );
  const entries = buildTeamEntries(active, users, externalPartnerInvites, game.id);
  const teamsMax = maxFixedTeams(game.capacity);
  const mine = active.find((p) => p.userId === currentUser.id);
  const canPropose = game.status === 'upcoming'
    && !mine?.partnerUserId
    && !(externalPartnerInvites.some(
      (i) => i.gameId === game.id && i.fromUserId === currentUser.id && isExternalPartnerHoldActive(i),
    ));

  return (
    <Card className="rounded-2xl py-0 shadow-sm">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="font-heading text-base">
          Teams ({entries.length}/{teamsMax})
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            · {active.length} players
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-3">
        {entries.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">No teams yet — be the first to register.</p>
        )}
        {entries.map((entry) => {
          if (entry.kind === 'paired') {
            return (
              <div
                key={entry.key}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Users className="size-3" /> Team
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <PlayerChip
                    user={entry.userA}
                    you={entry.userA.id === currentUser.id}
                    status={entry.a.status}
                  />
                  <span className="hidden text-center text-xs font-medium text-muted-foreground sm:block">+</span>
                  <PlayerChip
                    user={entry.userB}
                    you={entry.userB.id === currentUser.id}
                    status={entry.b.status}
                  />
                </div>
              </div>
            );
          }

          if (entry.kind === 'pending') {
            return (
              <div
                key={entry.key}
                className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300/80">
                    <Users className="size-3" /> Team
                  </span>
                  <Badge variant="secondary" className="text-[10px] text-sky-300">
                    Awaiting approval
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <PlayerChip
                    user={entry.userA}
                    you={entry.userA.id === currentUser.id}
                    status={entry.a.status}
                  />
                  <span className="hidden text-center text-xs font-medium text-muted-foreground sm:block">+</span>
                  <div className="space-y-1">
                    <PlayerChip
                      user={entry.userB}
                      you={entry.userB.id === currentUser.id}
                      status={entry.b.status}
                    />
                    <p className="text-[11px] text-sky-300/90">
                      {entry.userB.name.split(' ')[0]} asked to join — waiting for {entry.userA.name.split(' ')[0]} to approve
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          if (entry.kind === 'tbc') {
            return (
              <div
                key={entry.key}
                className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300/80">
                    <Users className="size-3" /> Team
                  </span>
                  <Badge variant="secondary" className="text-[10px]">Partner (TBC)</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <PlayerChip
                    user={entry.userA}
                    you={entry.userA.id === currentUser.id}
                    status={entry.a.status}
                  />
                  <span className="hidden text-center text-xs font-medium text-muted-foreground sm:block">+</span>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                        ?
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        Partner (TBC)
                      </span>
                      <span className="text-xs text-sky-300/90">
                        {entry.hold.friendName} · held 24h
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Open slot — needs partner
          const inviteFrom = entry.a.partnerInviteFrom
            ? users.find((u) => u.id === entry.a.partnerInviteFrom)
            : undefined;
          const isMe = entry.userA.id === currentUser.id;
          const pairOk = partnerPairEligibility(currentUser, entry.userA, game).ok;
          const showPropose = canPropose
            && !isMe
            && entry.a.lookingForPartner
            && !entry.a.partnerInviteFrom
            && game.status === 'upcoming'
            && pairOk;
          const alreadyProposed = entry.a.partnerInviteFrom === currentUser.id;
          const blockedByPair = canPropose
            && !isMe
            && entry.a.lookingForPartner
            && !entry.a.partnerInviteFrom
            && !pairOk
            && requiresMixedGenderPair(game);

          return (
            <div
              key={entry.key}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300/80">
                  <Users className="size-3" /> Team
                </span>
                {inviteFrom ? (
                  <Badge variant="secondary" className="text-[10px] text-sky-300">
                    Invite pending
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] text-amber-300">
                    Needs partner
                  </Badge>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <PlayerChip
                  user={entry.userA}
                  you={isMe}
                  status={entry.a.status}
                />
                <span className="hidden text-center text-xs font-medium text-muted-foreground sm:block">+</span>
                <div className="flex min-w-0 flex-col gap-2 sm:items-start">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-8 shrink-0 border border-dashed border-white/20">
                      <AvatarFallback className="bg-transparent text-xs text-muted-foreground">
                        +
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {inviteFrom
                        ? `Waiting on ${inviteFrom.name.split(' ')[0]}…`
                        : 'Open slot'}
                    </span>
                  </div>
                  {showPropose && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-full sm:w-auto"
                      onClick={() => proposePartnerJoin(game.id, currentUser.id, entry.userA.id)}
                    >
                      <UserPlus className="size-3.5" /> Propose to join
                    </Button>
                  )}
                  {blockedByPair && (
                    <p className="text-xs text-muted-foreground">
                      Needs opposite gender for this team.
                    </p>
                  )}
                  {alreadyProposed && (
                    <p className="text-xs text-sky-300">Your join request is pending their approval.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
