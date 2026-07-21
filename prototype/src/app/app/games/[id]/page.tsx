'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, LayoutGrid, Check, X, UserPlus, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GameStatusBadge, ParticipantStatusBadge } from '@/components/badges';
import { useMockData, ALLOW_SELF_REGISTER } from '@/data/provider';
import { spotsTaken } from '@/lib/derive';
import { FORMAT_LABELS, LEVEL_LABELS, formatDateLong, initials } from '@/lib/format';

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    games, participants, users, currentUser,
    confirmParticipation, declineParticipation, registerForGame,
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
  const waitlist = roster.filter((p) => p.status === 'waitlisted');
  const taken = spotsTaken(participants, game.id);
  const available = Math.max(0, game.capacity - taken);
  const mine = roster.find((p) => p.userId === currentUser.id);
  const karmaBlocked = currentUser.karmaTier === 'restricted' || currentUser.karmaTier === 'suspended';

  const userFor = (userId: string) => users.find((u) => u.id === userId);

  return (
    <div className="space-y-5">
      <Link href="/app/games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All games
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">{game.title}</h1>
          <p className="text-sm text-muted-foreground">{FORMAT_LABELS[game.format]}</p>
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
            <MapPin className="size-4 text-primary" /> {game.venue}
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
              <Users className="size-3" /> {taken}/{game.capacity} · {available === 0 ? 'Full' : `${available} spots left`}
            </Badge>
            {game.price != null && <Badge variant="outline">AED {game.price}</Badge>}
          </div>
          {game.description && (
            <p className="col-span-full text-sm text-muted-foreground">{game.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Participation actions (PRD §16.5) */}
      {game.status === 'upcoming' && (
        <>
          {mine?.status === 'registered' && (
            <Card className="rounded-2xl border-amber-200 bg-amber-50/60 py-0">
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-medium">
                  You&apos;re registered — please confirm your participation.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="h-11 flex-1" onClick={() => confirmParticipation(game.id, currentUser.id)}>
                    <Check className="size-4" /> Confirm
                  </Button>
                  <Button variant="outline" className="h-11 flex-1" onClick={() => declineParticipation(game.id, currentUser.id)}>
                    <X className="size-4" /> Cannot play
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  In production this arrives as a WhatsApp message with Confirm / Cannot play buttons.
                </p>
              </CardContent>
            </Card>
          )}
          {mine?.status === 'confirmed' && (
            <Card className="rounded-2xl border-green-200 bg-green-50/60 py-0">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <p className="text-sm font-medium text-green-800">You&apos;re confirmed for this game. See you on court!</p>
                <Button variant="outline" size="sm" onClick={() => declineParticipation(game.id, currentUser.id)}>
                  Cancel my spot
                </Button>
              </CardContent>
            </Card>
          )}
          {mine?.status === 'cancelled' && (
            <Alert>
              <X className="size-4" />
              <AlertTitle>You cancelled this game</AlertTitle>
              <AlertDescription>Your spot was freed for other players.</AlertDescription>
            </Alert>
          )}
          {mine?.status === 'waitlisted' && (
            <Alert>
              <Users className="size-4" />
              <AlertTitle>You&apos;re on the waitlist</AlertTitle>
              <AlertDescription>We&apos;ll notify you if a spot opens up.</AlertDescription>
            </Alert>
          )}
          {!mine && ALLOW_SELF_REGISTER && (
            karmaBlocked ? (
              <Alert className="border-orange-300 bg-orange-50 text-orange-900">
                <Lock className="size-4" />
                <AlertTitle>Sign-up blocked by karma tier</AlertTitle>
                <AlertDescription className="text-orange-800">
                  Your karma balance ({currentUser.karmaBalance}) puts you in the {currentUser.karmaTier} tier, which blocks
                  self-registration. Play reliably (+2 per on-time game) to recover — see your{' '}
                  <Link href="/app/profile" className="font-medium underline">karma history</Link>.
                </AlertDescription>
              </Alert>
            ) : (
              <Button size="lg" className="h-12 w-full text-base" onClick={() => registerForGame(game.id, currentUser.id)}>
                <UserPlus className="size-4" /> {available === 0 ? 'Join waitlist' : 'Register for this game'}
              </Button>
            )
          )}
        </>
      )}

      {/* Roster */}
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
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {u.name}{u.id === currentUser.id && <span className="text-muted-foreground"> (you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{LEVEL_LABELS[u.level]}</p>
                </div>
                <ParticipantStatusBadge status={p.status} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {waitlist.length > 0 && (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="font-heading text-base">Waitlist ({waitlist.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-4 pt-2">
            {waitlist.map((p) => {
              const u = userFor(p.userId);
              if (!u) return null;
              return (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                      {initials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="flex-1 truncate text-sm font-medium">{u.name}</p>
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
