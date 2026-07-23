'use client';

import Link from 'next/link';
import { CalendarDays, Clock, Lock, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameStatusBadge, ParticipantStatusBadge } from '@/components/badges';
import { ParticipationActions } from '@/components/participation-actions';
import { ClubLink } from '@/components/club-link';
import { useMockData } from '@/data/provider';
import { spotsTaken, maxFixedTeams } from '@/lib/derive';
import { gameJoinEligibility } from '@/lib/eligibility';
import { LEVEL_LABELS, formatDate, isFixedTeamFormat } from '@/lib/format';
import { FormatLabel } from '@/components/format-icon';
import { cn } from '@/lib/utils';
import type { Game } from '@/types';

// Game card per PRD §7.3 — title, format, date, times, venue, level,
// spots/capacity, status, plus inline confirm / cancel when relevant.
export function GameCard({
  game,
  href,
  showActions = false,
  showEligibility = false,
}: {
  game: Game;
  href: string;
  /** Embed confirm/cancel/register actions (home screen). */
  showActions?: boolean;
  /** Show why the current user cannot join (game list). */
  showEligibility?: boolean;
}) {
  const { participants, currentUser, externalPartnerInvites } = useMockData();
  const taken = spotsTaken(participants, game.id, externalPartnerInvites, game.format);
  const available = Math.max(0, game.capacity - taken);
  const fixed = isFixedTeamFormat(game.format);
  const teamsTaken = fixed ? taken / 2 : 0;
  const teamsMax = fixed ? maxFixedTeams(game.capacity) : 0;
  const teamsLeft = Math.max(0, teamsMax - teamsTaken);
  const mine = participants.find(
    (p) => p.gameId === game.id && p.userId === currentUser.id && p.status !== 'cancelled',
  );
  const needsAction = Boolean(
    mine && ['confirmed', 'registered', 'pending_replacement', 'waitlisted'].includes(mine.status),
  );
  const highlight = showActions && mine?.status === 'confirmed' && !mine.letsGoAt;
  const eligibility = gameJoinEligibility(currentUser, game);
  const blocked =
    showEligibility
    && !mine
    && game.status === 'upcoming'
    && !eligibility.ok;

  return (
    <Card
      className={cn(
        'rounded-2xl border-white/10 bg-card py-0 shadow-none transition-colors hover:bg-white/[0.04]',
        highlight && 'ring-2 ring-amber-400/70',
        blocked && 'opacity-70',
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div className="space-y-3">
          <Link href={href} className="block space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading font-semibold">{game.title}</h3>
                <p className="text-xs text-muted-foreground">
                  <FormatLabel format={game.format} className="text-xs" iconClassName="size-3" />
                </p>
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
            </div>
          </Link>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <ClubLink name={game.venue} />
          </p>

          <Link href={href} className="block space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{LEVEL_LABELS[game.level]}</Badge>
              {game.genderRestriction && game.genderRestriction !== 'mixed' && (
                <Badge variant="secondary" className="capitalize">
                  {game.genderRestriction === 'female' ? 'Ladies' : 'Men'} only
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Users className="size-3" />
                {fixed ? (
                  <>
                    {teamsTaken}/{teamsMax}
                    <span className={teamsLeft === 0 ? 'text-destructive' : 'text-green-600'}>
                      · {teamsLeft === 0 ? 'Full' : `${teamsLeft} team${teamsLeft === 1 ? '' : 's'} left`}
                    </span>
                  </>
                ) : (
                  <>
                    {taken}/{game.capacity}
                    <span className={available === 0 ? 'text-destructive' : 'text-green-600'}>
                      · {available === 0 ? 'Full' : `${available} spots`}
                    </span>
                  </>
                )}
              </Badge>
              {game.price != null && <Badge variant="outline">AED {game.price}</Badge>}
              {mine && <ParticipantStatusBadge status={mine.status} />}
            </div>

            {showEligibility && !mine && game.status === 'upcoming' && !eligibility.ok && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                <span>{eligibility.reason}</span>
              </p>
            )}
          </Link>
        </div>

        {showActions && needsAction && (
          <ParticipationActions game={game} mine={mine} compact />
        )}
      </CardContent>
    </Card>
  );
}
