'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/player-avatar';
import { GameStatusBadge, ParticipantStatusBadge } from '@/components/badges';
import { GameResults } from '@/components/game-results';
import { FixedTeamRoster } from '@/components/fixed-team-roster';
import { ParticipationActions } from '@/components/participation-actions';
import { ClubLink } from '@/components/club-link';
import { FormatLabel } from '@/components/format-icon';
import { useMockData } from '@/data/provider';
import { spotsTaken, maxFixedTeams } from '@/lib/derive';
import { waitlistOrdered, waitlistUnitsOrdered } from '@/lib/waitlist';
import { LEVEL_LABELS, formatDateLong, isFixedTeamFormat } from '@/lib/format';
import { TEAM_ENTRY_LABELS } from '@/lib/teamPriority';
import { courtLabel, teamLabel } from '@/lib/allocation';
import type { GameTeam, User } from '@/types';

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    games, participants, teams, matches, users, currentUser, externalPartnerInvites,
  } = useMockData();

  const game = games.find((g) => g.id === id && !g.deleted);
  if (!game) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">Game not found</p>
        <Button variant="outline" onClick={() => router.push('/app/games')}>Back to games</Button>
      </div>
    );
  }

  const roster = participants.filter((p) => p.gameId === game.id);
  const active = roster.filter((p) => !['cancelled', 'waitlisted'].includes(p.status));
  const waitlist = waitlistOrdered(participants, users, game.id);
  const waitlistUnits = isFixedTeamFormat(game.format)
    ? waitlistUnitsOrdered(participants, users, game.id)
    : null;
  const taken = spotsTaken(participants, game.id, externalPartnerInvites, game.format);
  const available = Math.max(0, game.capacity - taken);
  const mine = roster.find((p) => p.userId === currentUser.id && p.status !== 'cancelled');
  const isFixedTeam = isFixedTeamFormat(game.format);
  const teamsTaken = isFixedTeam ? taken / 2 : 0;
  const teamsMax = isFixedTeam ? maxFixedTeams(game.capacity) : 0;
  const teamsLeft = Math.max(0, teamsMax - teamsTaken);

  const userFor = (userId: string) => users.find((u) => u.id === userId);

  const gameTeams = teams.filter((t) => t.gameId === game.id);
  const gameMatches = matches.filter((m) => m.gameId === game.id);
  const myTeamId = gameTeams.find((t) => t.playerIds.includes(currentUser.id))?.id;

  return (
    <div className="space-y-5">
      <Link href="/app/games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All games
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">{game.title}</h1>
          <p className="text-sm text-muted-foreground">
            <FormatLabel format={game.format} />
          </p>
        </div>
        <GameStatusBadge status={game.status} />
      </div>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <span className="flex items-center gap-2 text-sm">
            <CalendarDays className="size-4 text-primary" /> {formatDateLong(game.date)}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-primary" /> {game.startTime}–{game.endTime}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-primary" /> <ClubLink name={game.venue} />
          </span>
          <span className="flex items-center gap-2 text-sm">
            <LayoutGrid className="size-4 text-primary" /> {game.courts} court{game.courts > 1 ? 's' : ''}
          </span>
          <div className="col-span-full flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary">{LEVEL_LABELS[game.level]}</Badge>
            {game.genderRestriction && game.genderRestriction !== 'mixed' && (
              <Badge variant="secondary" className="capitalize">{game.genderRestriction} only</Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Users className="size-3" />
              {isFixedTeam
                ? `${teamsTaken}/${teamsMax} teams · ${teamsLeft === 0 ? 'Full' : `${teamsLeft} left`}`
                : `${taken}/${game.capacity} · ${available === 0 ? 'Full' : `${available} spots left`}`}
            </Badge>
            {game.price != null && <Badge variant="outline">AED {game.price}</Badge>}
          </div>
          {game.description && (
            <p className="col-span-full text-sm text-muted-foreground">{game.description}</p>
          )}
        </CardContent>
      </Card>

      {game.status === 'completed' && gameTeams.length > 0 && (
        <>
          {mine && mine.pointsAwarded != null && (
            <Card className="rounded-2xl border-primary/30 bg-primary/[0.04] py-0 shadow-sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <p className="text-sm font-medium">
                  You finished {mine.position ? (mine.position <= 3 ? ['🥇', '🥈', '🥉'][mine.position - 1] : `#${mine.position}`) : '—'}
                </p>
                {mine.pointsAwarded ? <Badge className="text-sm">+{mine.pointsAwarded} points</Badge> : null}
              </CardContent>
            </Card>
          )}
          <GameResults game={game} teams={gameTeams} matches={gameMatches} users={users} highlightTeamId={myTeamId} linkPlayers />
        </>
      )}

      {game.status === 'upcoming' && game.distributionFinalizedAt && gameTeams.length > 0 && (
        <CourtDistributionCard
          teams={gameTeams}
          users={users}
          format={game.format}
          highlightUserId={currentUser.id}
        />
      )}

      <ParticipationActions game={game} mine={mine} />

      {isFixedTeam ? (
        <FixedTeamRoster game={game} />
      ) : (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="font-heading text-base">Players ({active.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-4 pt-2">
            {active.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">No players yet — be the first to register.</p>
            )}
            {active.map((p) => {
              const u = userFor(p.userId);
              if (!u) return null;
              return (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/app/players/${u.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-primary">
                    <PlayerAvatar user={u} className="size-8" fallbackClassName="text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {u.name}{u.id === currentUser.id && <span className="text-muted-foreground"> (you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{LEVEL_LABELS[u.level]}</p>
                    </div>
                  </Link>
                  <ParticipantStatusBadge status={p.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {(waitlistUnits ? waitlistUnits.length > 0 : waitlist.length > 0) && (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="font-heading text-base">
              Waitlist ({waitlistUnits ? waitlistUnits.length : waitlist.length}
              {waitlistUnits ? ' teams/solos' : ''})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {isFixedTeam
                ? 'Priority: full pairs → partner pending → solos, then karma (one team slot at a time).'
                : 'Ordered by karma — higher balance is promoted first.'}
            </p>
          </CardHeader>
          <CardContent className="divide-y p-4 pt-2">
            {waitlistUnits
              ? waitlistUnits.map((unit, i) => {
                  const members = unit.participants
                    .map((p) => userFor(p.userId))
                    .filter((u): u is NonNullable<typeof u> => Boolean(u));
                  if (members.length === 0) return null;
                  return (
                    <div key={unit.participants.map((p) => p.id).join('-')} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-center text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                      <div className="flex -space-x-1.5">
                        {members.map((u) => (
                          <PlayerAvatar
                            key={u.id}
                            user={u}
                            className="size-8 border-2 border-background"
                            fallbackClassName="bg-muted text-muted-foreground text-xs"
                          />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {members.map((u) => u.name).join(' + ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {TEAM_ENTRY_LABELS[unit.entryKind]} · karma {unit.karma}
                        </p>
                      </div>
                      <Badge variant="secondary">{TEAM_ENTRY_LABELS[unit.entryKind]}</Badge>
                    </div>
                  );
                })
              : waitlist.map((p, i) => {
                  const u = userFor(p.userId);
                  if (!u) return null;
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-center text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                      <PlayerAvatar
                        user={u}
                        className="size-8"
                        fallbackClassName="bg-muted text-muted-foreground text-xs"
                      />
                      <Link href={`/app/players/${u.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary">
                        {u.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">karma {u.karmaBalance}</span>
                      <ParticipantStatusBadge status={p.status} />
                    </div>
                  );
                })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CourtDistributionCard({
  teams, users, format, highlightUserId,
}: {
  teams: GameTeam[];
  users: User[];
  format: Parameters<typeof courtLabel>[1];
  highlightUserId: string;
}) {
  const byCourt = [...teams].sort((a, b) => a.court - b.court);
  const courts = Array.from(new Set(byCourt.map((t) => t.court)));
  return (
    <Card className="rounded-2xl border-primary/30 bg-primary/[0.03] py-0 shadow-sm">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="flex items-center gap-1.5 font-heading text-base">
          <LayoutGrid className="size-4 text-primary" /> Court distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-3">
        {courts.map((court) => (
          <div key={court} className="rounded-xl border p-3">
            <Badge variant={court <= 3 ? 'default' : 'secondary'} className="mb-1.5">
              {courtLabel(court, format)}
            </Badge>
            <div className="space-y-0.5">
              {byCourt.filter((t) => t.court === court).map((t) => {
                const mine = t.playerIds.includes(highlightUserId);
                return (
                  <p key={t.id} className={`text-sm ${mine ? 'font-semibold text-primary' : ''}`}>
                    {teamLabel(t.playerIds, users)}{mine && ' · you'}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
