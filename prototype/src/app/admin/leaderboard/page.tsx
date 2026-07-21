'use client';

import * as React from 'react';
import Link from 'next/link';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { VerifiedBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { leaderboard, visibleGames } from '@/lib/derive';
import { LEVEL_LABELS, formatDate } from '@/lib/format';
import type { User } from '@/types';

export default function AdminLeaderboardPage() {
  const { users, participants, games, adjustRating, ratingAdjustments } = useMockData();
  const [target, setTarget] = React.useState<User | null>(null);
  const [mode, setMode] = React.useState<'delta' | 'absolute'>('delta');
  const [value, setValue] = React.useState('');
  const [reason, setReason] = React.useState<string | null>('correction');
  const [note, setNote] = React.useState('');

  const board = leaderboard(users, participants, games);
  const pastGames = visibleGames(games)
    .filter((g) => g.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date));

  const apply = () => {
    if (!target || !value || !reason) return;
    adjustRating(target.id, mode, Number(value), reason, note.trim() || undefined);
    setTarget(null); setValue(''); setNote('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Leaderboard &amp; results</h1>
        <p className="text-sm text-muted-foreground">
          Rankings recalculate when results are published or ratings adjusted. Banned players are excluded.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl py-0 shadow-sm lg:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-4">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden sm:table-cell">Level</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="pr-4 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {board.map((r) => (
                  <TableRow key={r.user.id}>
                    <TableCell className="pl-4 font-semibold">{r.rank}</TableCell>
                    <TableCell className="font-medium">{r.user.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <Badge variant="secondary">{LEVEL_LABELS[r.user.level]}</Badge>
                        {r.user.levelVerified && <VerifiedBadge />}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.gamesPlayed}</TableCell>
                    <TableCell className="text-right font-heading font-bold">{r.user.points}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setTarget(r.user)}>
                        <SlidersHorizontal className="size-3.5" /> Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="font-heading text-base">Recent results</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-4 pt-1">
              {pastGames.slice(0, 6).map((g) => (
                <Link key={g.id} href={`/admin/games/${g.id}`} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{g.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(g.date)} · {g.venue}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="font-heading text-base">Adjustment audit trail</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-4 pt-1">
              {ratingAdjustments.slice(0, 5).map((ra) => {
                const u = users.find((x) => x.id === ra.userId);
                return (
                  <div key={ra.id} className="py-2.5">
                    <p className="text-sm font-medium">
                      {u?.name ?? ra.userId}: {ra.pointsBefore} → {ra.pointsAfter}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{ra.reasonCode.replace(/_/g, ' ')}{ra.note ? ` — ${ra.note}` : ''}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rating adjustment dialog (PRD §13.6) */}
      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust rating — {target?.name}</DialogTitle>
            <DialogDescription>
              Current points: {target?.points}. Adjustments are append-only and audited; they can only be
              compensated by a new adjustment, never deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as 'delta' | 'absolute')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delta">Delta (+/−)</SelectItem>
                  <SelectItem value="absolute">Set absolute value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{mode === 'delta' ? 'Points delta' : 'New total'}</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === 'delta' ? 'e.g. 20 or -10' : 'e.g. 350'} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Reason (mandatory)</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as string)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="retroactive_result">Retroactive result</SelectItem>
                  <SelectItem value="penalty">Penalty</SelectItem>
                  <SelectItem value="migration_fix">Migration fix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Note</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional context for the audit trail" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button>
            <Button disabled={!value || !reason} onClick={apply}>Apply adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
