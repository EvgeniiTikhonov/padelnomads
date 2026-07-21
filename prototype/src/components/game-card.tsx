'use client';

import Link from 'next/link';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameStatusBadge, ParticipantStatusBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { spotsTaken } from '@/lib/derive';
import { FORMAT_LABELS, LEVEL_LABELS, formatDate } from '@/lib/format';
import type { Game } from '@/types';

// Game card per PRD §7.3 — title, format, date, times, venue, level,
// spots/capacity, status, registration + confirmation status.
export function GameCard({ game, href }: { game: Game; href: string }) {
  const { participants, currentUser } = useMockData();
  const taken = spotsTaken(participants, game.id);
  const available = Math.max(0, game.capacity - taken);
  const mine = participants.find((p) => p.gameId === game.id && p.userId === currentUser.id);

  return (
    <Link href={href} className="block">
      <Card className="rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading font-semibold">{game.title}</h3>
              <p className="text-xs text-muted-foreground">{FORMAT_LABELS[game.format]}</p>
            </div>
            <GameStatusBadge status={game.status} />
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0" /> {formatDate(game.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" /> {game.startTime}–{game.endTime}
            </span>
            <span className="col-span-2 flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" /> {game.venue}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{LEVEL_LABELS[game.level]}</Badge>
            {game.genderRestriction && game.genderRestriction !== 'mixed' && (
              <Badge variant="secondary" className="capitalize">{game.genderRestriction} only</Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Users className="size-3" /> {taken}/{game.capacity}
              <span className={available === 0 ? 'text-destructive' : 'text-green-600'}>
                · {available === 0 ? 'Full' : `${available} spots`}
              </span>
            </Badge>
            {game.price != null && <Badge variant="outline">AED {game.price}</Badge>}
            {mine && <ParticipantStatusBadge status={mine.status} />}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
