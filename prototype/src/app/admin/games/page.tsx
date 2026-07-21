'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameStatusBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { spotsTaken, visibleGames } from '@/lib/derive';
import { FORMAT_LABELS, formatDate } from '@/lib/format';

export default function AdminGamesPage() {
  const { games, participants } = useMockData();
  const [tab, setTab] = React.useState<'upcoming' | 'live' | 'past'>('upcoming');

  const all = visibleGames(games);
  const lists = {
    upcoming: all.filter((g) => g.status === 'upcoming').sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    live: all.filter((g) => g.status === 'live'),
    past: all.filter((g) => g.status === 'completed' || g.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date)),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Games</h1>
          <p className="text-sm text-muted-foreground">Create, manage, run and close games.</p>
        </div>
        <Link href="/admin/games/new">
          <Button><Plus className="size-4" /> Create game</Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({lists.upcoming.length})</TabsTrigger>
          <TabsTrigger value="live">Live ({lists.live.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({lists.past.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {lists[tab].length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No {tab} games.
          </div>
        )}
        {lists[tab].map((g) => {
          const taken = spotsTaken(participants, g.id);
          return (
            <Link key={g.id} href={`/admin/games/${g.id}`} className="block">
              <Card className="rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {g.title} <GameStatusBadge status={g.status} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {FORMAT_LABELS[g.format]} · {formatDate(g.date)} · {g.startTime}–{g.endTime} · {g.venue}
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Users className="size-3" /> {taken}/{g.capacity}
                  </Badge>
                  <ArrowRight className="size-4 text-muted-foreground/50" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
