'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatConfig } from '@/lib/gameFormats';
import { computeStandings } from '@/lib/scoring';
import type { Game, GameMatch, GameTeam, User } from '@/types';

const MEDALS = ['🥇', '🥈', '🥉'];

export function GameResults({
  game, teams, matches, users, highlightTeamId, linkPlayers = false,
}: {
  game: Game;
  teams: GameTeam[];
  matches: GameMatch[];
  users: User[];
  highlightTeamId?: string;
  linkPlayers?: boolean;
}) {
  const cfg = formatConfig(game.format);
  const standings = computeStandings(game, teams, matches);
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? 'Team';
  const playersOf = (id: string) => {
    const playerIds = teams.find((t) => t.id === id)?.playerIds ?? [];
    if (!linkPlayers) {
      return playerIds.map((uid) => users.find((u) => u.id === uid)?.name ?? 'Player').join(' · ');
    }
    return playerIds.map((uid, index) => {
      const user = users.find((u) => u.id === uid);
      return (
        <React.Fragment key={uid}>
          {index > 0 && ' · '}
          {user ? (
            <Link href={`/app/players/${uid}`} className="hover:text-primary hover:underline">
              {user.name}
            </Link>
          ) : 'Player'}
        </React.Fragment>
      );
    });
  };
  const rounds = cfg.rounds.map((_, r) =>
    matches.filter((m) => m.gameId === game.id && m.round === r).sort((a, b) => a.court - b.court),
  );

  if (teams.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Final standings */}
      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="font-heading text-base">Final standings</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Team</th>
                  <th className="pb-2 pr-3 text-center font-medium">Wins</th>
                  <th className="pb-2 text-center font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr
                    key={s.team.id}
                    className={`border-t ${s.team.id === highlightTeamId ? 'bg-primary/[0.06]' : ''}`}
                  >
                    <td className="py-2 pr-2 font-semibold">{s.rank <= 3 ? MEDALS[s.rank - 1] : `#${s.rank}`}</td>
                    <td className="py-2 pr-3">
                      <span className="font-medium">{s.team.name}</span>
                      <span className="block text-xs text-muted-foreground">{playersOf(s.team.id)}</span>
                    </td>
                    <td className="py-2 pr-3 text-center">{s.wins}</td>
                    <td className="py-2 text-center font-semibold text-primary">{s.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Round-by-round scores */}
      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="font-heading text-base">Match scores by round</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-3">
          {rounds.map((roundMatches, r) =>
            roundMatches.length === 0 ? null : (
              <div key={r} className="space-y-1.5">
                <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  {cfg.rounds[r].label}
                  {cfg.rounds[r].boosted && <Badge variant="outline" className="text-[10px] text-amber-600">boosted</Badge>}
                </p>
                {roundMatches.map((m) => {
                  const aWon = m.scoreA != null && m.scoreB != null && m.scoreA > m.scoreB;
                  const bWon = m.scoreA != null && m.scoreB != null && m.scoreB > m.scoreA;
                  return (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <Badge variant={m.court <= 2 ? 'default' : 'secondary'} className="shrink-0">Court {m.court}</Badge>
                      <span className={`flex-1 truncate text-right ${aWon ? 'font-semibold' : ''} ${m.teamAId === highlightTeamId ? 'text-primary' : ''}`}>
                        {teamName(m.teamAId)}
                      </span>
                      <span className="shrink-0 tabular-nums font-semibold">{m.scoreA ?? '–'} : {m.scoreB ?? '–'}</span>
                      <span className={`flex-1 truncate ${bWon ? 'font-semibold' : ''} ${m.teamBId === highlightTeamId ? 'text-primary' : ''}`}>
                        {teamName(m.teamBId)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ),
          )}
        </CardContent>
      </Card>
    </div>
  );
}
