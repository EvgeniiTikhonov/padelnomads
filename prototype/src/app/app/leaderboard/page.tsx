'use client';

import * as React from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerAvatar } from '@/components/player-avatar';
import { VerifiedBadge } from '@/components/badges';
import { cn } from '@/lib/utils';
import { useMockData } from '@/data/provider';
import { leaderboardDetailed } from '@/lib/derive';
import { LEVELS, LEVEL_LABELS, LEADERBOARD_KIND_LABELS } from '@/lib/format';
import type { LeaderboardKind, Level } from '@/types';

type LevelFilter = 'all' | Level;
type GenderFilter = 'all' | 'male' | 'female';
type TimeFilter = 'all' | 'week' | 'month' | '3months' | 'year' | 'custom';

const BOARD_OPTIONS: { key: LeaderboardKind; short: string }[] = [
  { key: 'community', short: 'Community' },
  { key: 'mens_c_plus', short: "Men's C+" },
  { key: 'womens_c', short: "Women's C" },
];

const TIME_OPTIONS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'week', label: 'Last week' },
  { key: 'month', label: 'Last month' },
  { key: '3months', label: 'Last 3 months' },
  { key: 'year', label: 'Last year' },
  { key: 'custom', label: 'Custom range' },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function LeaderboardPage() {
  const { users, participants, games, currentUser } = useMockData();
  const [boardKind, setBoardKind] = React.useState<LeaderboardKind>('community');
  // null = untouched → the trigger shows the filter's name as placeholder
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter | null>(null);
  const [genderFilter, setGenderFilter] = React.useState<GenderFilter | null>(null);
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter | null>(null);
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');

  const range = React.useMemo(() => {
    switch (timeFilter) {
      case 'week': return { from: isoDaysAgo(7) };
      case 'month': return { from: isoDaysAgo(30) };
      case '3months': return { from: isoDaysAgo(91) };
      case 'year': return { from: isoDaysAgo(365) };
      case 'custom': return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
      default: return undefined;
    }
  }, [timeFilter, customFrom, customTo]);
  const timeFiltered = Boolean(range?.from || range?.to);
  const leagueScoped = boardKind !== 'community';
  const hideZeroGames = timeFiltered || leagueScoped;

  const board = leaderboardDetailed(users, participants, games, range, boardKind);
  const filtered = board
    .filter((r) => !levelFilter || levelFilter === 'all' || r.user.level === levelFilter)
    .filter((r) => !genderFilter || genderFilter === 'all' || r.user.gender === genderFilter)
    .filter((r) => !hideZeroGames || r.gamesPlayed > 0);
  const myRow = board.find((r) => r.user.id === currentUser.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            {boardKind === 'community'
              ? 'Community ranking by points. Banned players are excluded.'
              : `${LEADERBOARD_KIND_LABELS[boardKind]} — points from league games only.`}
          </p>
        </div>
        {myRow && (!leagueScoped || myRow.gamesPlayed > 0) && (
          <Badge variant="secondary" className="h-7 gap-1.5 px-3">
            <Trophy className="size-3.5 text-amber-500" /> Your rank: #{myRow.rank}
          </Badge>
        )}
      </div>

      <Tabs value={boardKind} onValueChange={(v) => setBoardKind(v as LeaderboardKind)}>
        <TabsList className="flex h-auto flex-wrap">
          {BOARD_OPTIONS.map((o) => (
            <TabsTrigger key={o.key} value={o.key}>{o.short}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={levelFilter ?? undefined} onValueChange={(v) => setLevelFilter(v as LevelFilter)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={genderFilter ?? undefined} onValueChange={(v) => setGenderFilter(v as GenderFilter)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="male">Men</SelectItem>
            <SelectItem value="female">Women</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeFilter ?? undefined} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Time" /></SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((o) => (
              <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {timeFilter === 'custom' && (
          <div className="flex items-center gap-1.5">
            <Input
              type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 w-36" aria-label="From date"
            />
            <span className="text-sm text-muted-foreground">–</span>
            <Input
              type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 w-36" aria-label="To date"
            />
          </div>
        )}
      </div>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 pl-4">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Games</TableHead>
                <TableHead className="text-center">🥇</TableHead>
                <TableHead className="text-center">🥈</TableHead>
                <TableHead className="text-center">🥉</TableHead>
                <TableHead className="pr-4 text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => {
                const displayRank = i + 1;
                return (
                  <TableRow
                    key={r.user.id}
                    className={cn(r.user.id === currentUser.id && 'bg-primary/5 hover:bg-primary/10')}
                  >
                    <TableCell className="pl-4 font-semibold">
                      {displayRank <= 3 ? ['🥇', '🥈', '🥉'][displayRank - 1] : displayRank}
                    </TableCell>
                    <TableCell>
                      <Link href={`/app/players/${r.user.id}`} className="flex items-center gap-2.5 hover:text-primary">
                        <PlayerAvatar user={r.user} className="size-7" fallbackClassName="text-[10px]" />
                        <span className="flex items-center gap-1.5 font-medium">
                          {r.user.name}
                          {r.user.id === currentUser.id && <span className="text-muted-foreground"> (you)</span>}
                          <Badge variant="secondary" className="px-1.5 text-[10px]">{r.user.level}</Badge>
                          {r.user.levelVerified && <VerifiedBadge className="size-3.5" />}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.gamesPlayed}</TableCell>
                    <TableCell className="text-center tabular-nums">{r.first || <span className="text-muted-foreground/50">–</span>}</TableCell>
                    <TableCell className="text-center tabular-nums">{r.second || <span className="text-muted-foreground/50">–</span>}</TableCell>
                    <TableCell className="text-center tabular-nums">{r.third || <span className="text-muted-foreground/50">–</span>}</TableCell>
                    <TableCell className="pr-4 text-right font-heading font-bold">{r.points}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No players match these filters
                    {hideZeroGames
                      ? leagueScoped
                        ? ' — no completed league games yet'
                        : ' — no completed games in this period'
                      : ''}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(timeFiltered || leagueScoped) && (
        <p className="text-xs text-muted-foreground">
          {leagueScoped
            ? 'Points, games, and podiums reflect completed games tagged for this league.'
            : 'Points, games, and podiums reflect completed games in the selected period.'}
          {' '}Players without games{leagueScoped ? ' in this league' : ' in the period'} are hidden.
        </p>
      )}
    </div>
  );
}
