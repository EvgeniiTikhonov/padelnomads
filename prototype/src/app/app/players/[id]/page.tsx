'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameResults } from '@/components/game-results';
import { VerifiedBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { leaderboard, upcomingGamesNextTwoWeeks } from '@/lib/derive';
import {
  FORMAT_LABELS, GENDER_LABELS, LEVEL_LABELS, SIDE_LABELS, formatDate, initials,
} from '@/lib/format';

export default function PublicPlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { users, games, participants, teams, matches, currentUser } = useMockData();
  const player = users.find((u) => u.id === id && u.role === 'player' && u.status !== 'banned');

  if (!player) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">Player not found</p>
        <Button variant="outline" onClick={() => router.push('/app/leaderboard')}>Back to leaderboard</Button>
      </div>
    );
  }

  const board = leaderboard(users, participants, games);
  const row = board.find((r) => r.user.id === player.id);
  const completed = games
    .filter((g) => g.status === 'completed' && !g.deleted)
    .map((game) => ({
      game,
      participant: participants.find((p) => p.gameId === game.id && p.userId === player.id),
    }))
    .filter(({ participant }) => participant && participant.status !== 'cancelled')
    .sort((a, b) => b.game.date.localeCompare(a.game.date));
  const upcomingCount = upcomingGamesNextTwoWeeks(games).filter((g) =>
    participants.some((p) => p.gameId === g.id && p.userId === player.id && p.status !== 'cancelled'),
  ).length;
  const lastGame = completed[0]?.game;

  return (
    <div className="space-y-5">
      <Link href="/app/leaderboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Leaderboard
      </Link>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
              {initials(player.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-bold">
              {player.name}
              {player.id === currentUser.id && <span className="text-sm font-normal text-muted-foreground"> (you)</span>}
            </h1>
            {player.email && <p className="text-sm text-muted-foreground">{player.email}</p>}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="gap-1">
                {LEVEL_LABELS[player.level]}
                {player.levelVerified && <VerifiedBadge className="size-3.5" />}
              </Badge>
              <Badge variant="secondary">Side: {SIDE_LABELS[player.preferredSide]}</Badge>
              {player.gender && <Badge variant="outline">{GENDER_LABELS[player.gender]}</Badge>}
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="size-3 text-green-600" /> Approved member
              </Badge>
            </div>
          </div>
          <div className="text-right">
            {player.memberSince && <p className="text-xs text-muted-foreground">Member since {formatDate(player.memberSince)}</p>}
            {player.id === currentUser.id && (
              <Link href="/app/profile" className="text-xs font-medium text-primary hover:underline">Manage my profile</Link>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Games played', value: completed.length },
          { label: 'Total points', value: player.points },
          { label: 'Rank', value: row ? `#${row.rank}` : '—' },
          { label: 'Upcoming', value: upcomingCount },
          { label: 'Last game', value: lastGame ? formatDate(lastGame.date) : '—' },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl py-0 shadow-sm">
            <CardContent className="p-3.5 text-center">
              <p className="font-heading text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="font-heading text-lg font-bold">Game history</h2>
        <p className="text-sm text-muted-foreground">Match scores, standings, courts, and every participating player.</p>
      </div>

      <div className="space-y-4">
        {completed.map(({ game, participant }, index) => {
          const gameParticipants = participants.filter(
            (p) => p.gameId === game.id && !['cancelled', 'waitlisted'].includes(p.status),
          );
          const gameTeams = teams.filter((t) => t.gameId === game.id);
          const gameMatches = matches.filter((m) => m.gameId === game.id);
          const playerTeamId = gameTeams.find((t) => t.playerIds.includes(player.id))?.id;

          return (
            <details key={game.id} open={index === 0} className="group rounded-2xl border bg-card shadow-sm">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-heading font-semibold">{game.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {formatDate(game.date)}</span>
                    <span className="flex items-center gap-1"><MapPin className="size-3" /> {game.venue}</span>
                    <span>{FORMAT_LABELS[game.format]}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {participant?.position && (
                    <Badge variant="secondary">
                      {participant.position <= 3 ? ['🥇', '🥈', '🥉'][participant.position - 1] : `#${participant.position}`}
                    </Badge>
                  )}
                  <Badge>{participant?.pointsAwarded ?? 0} points</Badge>
                  <span className="text-xs text-muted-foreground group-open:hidden">Show details</span>
                  <span className="hidden text-xs text-muted-foreground group-open:inline">Hide details</span>
                </div>
              </summary>

              <div className="space-y-4 border-t p-4">
                {gameTeams.length > 0 && gameMatches.length > 0 ? (
                  <GameResults
                    game={game}
                    teams={gameTeams}
                    matches={gameMatches}
                    users={users}
                    highlightTeamId={playerTeamId}
                    linkPlayers
                  />
                ) : (
                  <Card className="rounded-xl py-0">
                    <CardContent className="p-4 text-sm text-muted-foreground">
                      Detailed round scores were not recorded for this historical game.
                    </CardContent>
                  </Card>
                )}

                <Card className="rounded-xl py-0">
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="flex items-center gap-2 font-heading text-base">
                      <Users className="size-4 text-primary" /> Players ({gameParticipants.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 p-4 pt-3 sm:grid-cols-2">
                    {gameParticipants.map((p) => {
                      const member = users.find((u) => u.id === p.userId);
                      if (!member) return null;
                      return (
                        <Link
                          key={p.id}
                          href={`/app/players/${member.id}`}
                          className="flex items-center gap-3 rounded-xl border p-2.5 transition-colors hover:bg-muted/50"
                        >
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                              {initials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{member.name}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              {LEVEL_LABELS[member.level]}
                              {member.levelVerified && <VerifiedBadge className="size-3.5" />}
                            </p>
                          </div>
                          <div className="text-right text-xs">
                            {p.position && <p className="font-semibold">#{p.position}</p>}
                            <p className="text-muted-foreground">{p.pointsAwarded ?? 0} pts</p>
                          </div>
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>

                <Link href={`/app/games/${game.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  <Trophy className="size-3.5" /> Open full game page
                </Link>
              </div>
            </details>
          );
        })}
        {completed.length === 0 && (
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">No completed games yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
