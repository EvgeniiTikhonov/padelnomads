'use client';

import Link from 'next/link';
import { ArrowRight, Trophy, Sparkles, Bell, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { GameCard } from '@/components/game-card';
import { KarmaTierBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { leaderboard, upcomingGamesNextTwoWeeks } from '@/lib/derive';
import { KARMA_TIER_META, formatDate, timeAgo } from '@/lib/format';

export default function PlayerDashboard() {
  const { games, participants, users, currentUser, notifications, offers } = useMockData();

  const upcoming = upcomingGamesNextTwoWeeks(games);
  const myGames = upcoming.filter((g) =>
    participants.some((p) => p.gameId === g.id && p.userId === currentUser.id && !['cancelled'].includes(p.status)));
  const nextGame = myGames[0];
  const board = leaderboard(users, participants, games);
  const myRow = board.find((r) => r.user.id === currentUser.id);
  const recentNotifications = notifications
    .filter((n) => n.userId === currentUser.id)
    .slice(0, 3);
  const activeOffers = offers.filter((o) => o.status === 'active').slice(0, 2);
  const tierMeta = KARMA_TIER_META[currentUser.karmaTier];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Hey {currentUser.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening in your padel world.</p>
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/app/leaderboard">
          <Card className="rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Trophy className="size-3.5 text-amber-500" /> Leaderboard rank
              </div>
              <p className="mt-1 font-heading text-2xl font-bold">#{myRow?.rank ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{currentUser.points} points</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/profile">
          <Card className="rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
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
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Games next 2 weeks</p>
            <p className="mt-1 font-heading text-2xl font-bold">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">{myGames.length} you&apos;re in</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Next game</p>
            <p className="mt-1 truncate font-heading text-base font-bold">
              {nextGame ? formatDate(nextGame.date) : 'None yet'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {nextGame ? `${nextGame.startTime} · ${nextGame.title}` : 'Browse games to register'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next registered game */}
      {nextGame && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Your next game</h2>
          </div>
          <GameCard game={nextGame} href={`/app/games/${nextGame.id}`} />
        </section>
      )}

      {/* Upcoming games */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Upcoming games</h2>
          <Link href="/app/games" className="flex items-center gap-1 text-sm font-medium text-primary">
            All games <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {upcoming.slice(0, 4).map((g) => (
            <GameCard key={g.id} game={g} href={`/app/games/${g.id}`} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Benefits preview */}
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
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{o.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{o.partnerName}</span>
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Recent notifications */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent notifications</h2>
            <Link href="/app/notifications" className="flex items-center gap-1 text-sm font-medium text-primary">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="divide-y p-0">
              {recentNotifications.map((n) => (
                <Link key={n.id} href="/app/notifications" className="flex items-start gap-3 p-3.5">
                  <span className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg ${n.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    <Bell className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-sm ${n.isRead ? '' : 'font-semibold'}`}>{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{n.message}</span>
                    <span className="block text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
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
