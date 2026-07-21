'use client';

import * as React from 'react';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useMockData } from '@/data/provider';
import { leaderboard } from '@/lib/derive';
import { LEVEL_LABELS, initials } from '@/lib/format';
import type { Level } from '@/types';

type Filter = 'overall' | Level | 'male' | 'female';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'professional', label: 'Pro' },
  { key: 'male', label: 'Men' },
  { key: 'female', label: 'Women' },
];

export default function LeaderboardPage() {
  const { users, participants, games, currentUser } = useMockData();
  const [filter, setFilter] = React.useState<Filter>('overall');

  const board = leaderboard(users, participants, games);
  const filtered = board.filter((r) => {
    if (filter === 'overall') return true;
    if (filter === 'male' || filter === 'female') return r.user.gender === filter;
    return r.user.level === filter;
  });
  const myRow = board.find((r) => r.user.id === currentUser.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Community ranking by points. Banned players are excluded.</p>
        </div>
        {myRow && (
          <Badge variant="secondary" className="h-7 gap-1.5 px-3">
            <Trophy className="size-3.5 text-amber-500" /> Your rank: #{myRow.rank}
          </Badge>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'h-8 rounded-full border px-3.5 text-sm font-medium transition-colors',
              filter === f.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 pl-4">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="hidden sm:table-cell">Level</TableHead>
                <TableHead className="text-right">Games</TableHead>
                <TableHead className="pr-4 text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.user.id}
                  className={cn(r.user.id === currentUser.id && 'bg-primary/5 hover:bg-primary/10')}
                >
                  <TableCell className="pl-4 font-semibold">
                    {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                          {initials(r.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {r.user.name}
                        {r.user.id === currentUser.id && <span className="text-muted-foreground"> (you)</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{LEVEL_LABELS[r.user.level]}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.gamesPlayed}</TableCell>
                  <TableCell className="pr-4 text-right font-heading font-bold">{r.user.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
