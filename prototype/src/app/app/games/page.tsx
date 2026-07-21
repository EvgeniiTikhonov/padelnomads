'use client';

import { CalendarX } from 'lucide-react';
import { GameCard } from '@/components/game-card';
import { useMockData } from '@/data/provider';
import { upcomingGamesNextTwoWeeks } from '@/lib/derive';

export default function GamesPage() {
  const { games } = useMockData();
  const upcoming = upcomingGamesNextTwoWeeks(games);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Games</h1>
        <p className="text-sm text-muted-foreground">Everything scheduled for the next 2 weeks.</p>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <CalendarX className="size-8 text-muted-foreground" />
          <p className="font-medium">No games scheduled</p>
          <p className="text-sm text-muted-foreground">New games are announced on WhatsApp — check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((g) => (
            <GameCard key={g.id} game={g} href={`/app/games/${g.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
