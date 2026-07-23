'use client';

import Link from 'next/link';
import { ArrowRight, Trophy, Sparkles, AlertTriangle, Check, X } from 'lucide-react';
import { PlayerAvatar } from '@/components/player-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { GameCard } from '@/components/game-card';
import { KarmaTierBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { leaderboard, upcomingGamesNextTwoWeeks } from '@/lib/derive';
import { KARMA_TIER_META, formatDate, LEVEL_LABELS } from '@/lib/format';

export default function PlayerDashboard() {
  const {
    games, participants, users, currentUser, offers,
    acceptPartnerInvite, declinePartnerInvite,
  } = useMockData();

  const upcoming = upcomingGamesNextTwoWeeks(games);

  const awaitingConfirmation = participants
    .filter((p) =>
      p.userId === currentUser.id
      && Boolean(p.partnerInviteFrom)
      && !['cancelled'].includes(p.status))
    .map((p) => {
      const game = games.find((g) => g.id === p.gameId && !g.deleted);
      const inviter = users.find((u) => u.id === p.partnerInviteFrom);
      if (!game || !inviter) return null;
      return { part: p, game, inviter };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => (a.game.date + a.game.startTime).localeCompare(b.game.date + b.game.startTime));

  const awaitingGameIds = new Set(awaitingConfirmation.map((x) => x.game.id));

  const myGames = upcoming.filter((g) =>
    !awaitingGameIds.has(g.id)
    && participants.some((p) =>
      p.gameId === g.id
      && p.userId === currentUser.id
      && ['confirmed', 'registered', 'pending_replacement', 'waitlisted'].includes(p.status)));
  const nextGame = myGames[0];
  const upcomingOthers = upcoming.filter((g) => g.id !== nextGame?.id).slice(0, 4);
  const board = leaderboard(users, participants, games);
  const myRow = board.find((r) => r.user.id === currentUser.id);
  const activeOffers = offers.filter((o) => o.status === 'active').slice(0, 2);
  const tierMeta = KARMA_TIER_META[currentUser.karmaTier];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PlayerAvatar user={currentUser} className="size-12 shrink-0" fallbackClassName="text-base" />
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Hey {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening in your padel world.</p>
        </div>
      </div>

      {(currentUser.karmaTier === 'warning' || currentUser.karmaTier === 'restricted') && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="size-4" />
          <AlertTitle>Karma {tierMeta.label}</AlertTitle>
          <AlertDescription className="text-amber-800">
            Your karma dropped to {currentUser.karmaBalance}. {currentUser.karmaTier === 'restricted'
              ? 'Game sign-up is currently blocked — play reliably and karma recovers (+2 per on-time game).'
              : 'Recent cancellations or no-shows caused this. Keep showing up on time to recover.'}
            {' '}<Link href="/app/profile" className="font-medium underline">See your karma history</Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 items-stretch gap-3">
        <Link href="/app/leaderboard" className="block h-full min-h-0">
          <Card className="h-full rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Trophy className="size-3.5 text-amber-500" /> Leaderboard rank
              </div>
              <p className="mt-1 font-heading text-2xl font-bold">#{myRow?.rank ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{currentUser.points} points</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/profile" className="block h-full min-h-0">
          <Card className="h-full rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className={`size-2 rounded-full ${tierMeta.dot}`} /> Karma status
              </div>
              <p className="mt-1 font-heading text-2xl font-bold">{currentUser.karmaBalance}</p>
              <Progress value={Math.max(0, currentUser.karmaBalance)} className="mt-1.5 h-1.5" />
              <div className="mt-1.5"><KarmaTierBadge tier={currentUser.karmaTier} /></div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {awaitingConfirmation.length > 0 && (
        <section>
          <div className="mb-2">
            <h2 className="font-heading text-lg font-semibold">Awaiting confirmation</h2>
            <p className="text-sm text-muted-foreground">
              Someone invited you — accept to join their team, or decline.
            </p>
          </div>
          <div className="space-y-3">
            {awaitingConfirmation.map(({ part, game, inviter }) => {
              const isJoinRequest = Boolean(part.lookingForPartner);
              return (
                <Card key={part.id} className="rounded-2xl border-sky-500/30 bg-sky-500/5 py-0 shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <PlayerAvatar user={inviter} className="size-10 shrink-0" fallbackClassName="text-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {isJoinRequest
                            ? `${inviter.name} wants to join your team`
                            : `${inviter.name} invited you to play`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {LEVEL_LABELS[inviter.level]} · karma {inviter.karmaBalance}
                        </p>
                        <Link
                          href={`/app/games/${game.id}`}
                          className="mt-1 block text-sm font-medium text-primary hover:underline"
                        >
                          {game.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(game.date)} · {game.startTime} · {game.venue}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="h-10 flex-1"
                        onClick={() => acceptPartnerInvite(game.id, currentUser.id)}
                      >
                        <Check className="size-4" /> {isJoinRequest ? 'Approve' : 'Accept'}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 flex-1"
                        onClick={() => declinePartnerInvite(game.id, currentUser.id)}
                      >
                        <X className="size-4" /> Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {nextGame && (
        <section>
          <div className="mb-2">
            <h2 className="font-heading text-lg font-semibold">Your next game</h2>
            <p className="text-sm text-muted-foreground">
              Reminders go out 24 hours and 2 hours before kickoff.
            </p>
          </div>
          <GameCard game={nextGame} href={`/app/games/${nextGame.id}`} showActions />
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Upcoming games</h2>
          <Link href="/app/games" className="flex items-center gap-1 text-sm font-medium text-primary">
            All games <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {upcomingOthers.map((g) => {
            const mine = participants.find((p) => p.gameId === g.id && p.userId === currentUser.id && p.status !== 'cancelled');
            const showActions = Boolean(mine);
            return (
              <GameCard key={g.id} game={g} href={`/app/games/${g.id}`} showActions={showActions} />
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Member benefits</h2>
            <Link href="/app/benefits" className="flex items-center gap-1 text-sm font-medium text-primary">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="space-y-3 p-4">
              {activeOffers.map((o) => (
                <Link key={o.id} href="/app/offers" className="flex items-center gap-3">
                  {(o.logoUrl || o.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.logoUrl || o.imageUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-lg border border-white/10 object-cover"
                    />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{o.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {o.partnerName}
                      {o.promoCode ? ` · ${o.promoCode}` : ''}
                    </span>
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
