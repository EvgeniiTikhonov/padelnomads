'use client';

import * as React from 'react';
import Link from 'next/link';
import { Phone, Plus, Star, History, ShieldCheck, LifeBuoy, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlayerAvatar } from '@/components/player-avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { KarmaTierBadge, VerifiedBadge } from '@/components/badges';
import { ClubLink } from '@/components/club-link';
import {
  PartnersCard, PlayerStatsCard, PreferencesCard,
} from '@/components/player-stats';
import { SupportDialog } from '@/components/support-dialog';
import { useMockData } from '@/data/provider';
import { leaderboard, upcomingGamesNextTwoWeeks } from '@/lib/derive';
import { playerMatchRecords } from '@/lib/playerStats';
import {
  LEVEL_LABELS, SIDE_LABELS, GENDER_LABELS, KARMA_EVENT_LABELS,
  formatDate, formatDateTime,
} from '@/lib/format';

export default function ProfilePage() {
  const {
    users, games, participants, teams, matches, phones, karmaEvents, currentUser,
    addPhoneNumber, setWhatsappPref, setPlayerPreferences,
  } = useMockData();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [newPhone, setNewPhone] = React.useState('');
  const [otpStage, setOtpStage] = React.useState(false);
  const [otp, setOtp] = React.useState('');

  const referredBy = currentUser.referredByUserId
    ? users.find((u) => u.id === currentUser.referredByUserId)
    : undefined;

  const board = leaderboard(users, participants, games);
  const myRow = board.find((r) => r.user.id === currentUser.id);
  const myPhones = phones.filter((p) => p.userId === currentUser.id);
  const myKarma = karmaEvents
    .filter((k) => k.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const completedGames = games.filter((g) => g.status === 'completed' && !g.deleted);
  const myPast = completedGames
    .map((g) => ({ game: g, p: participants.find((x) => x.gameId === g.id && x.userId === currentUser.id) }))
    .filter((x) => x.p && x.p.status !== 'cancelled')
    .sort((a, b) => b.game.date.localeCompare(a.game.date));
  const myUpcoming = upcomingGamesNextTwoWeeks(games).filter((g) =>
    participants.some((p) => p.gameId === g.id && p.userId === currentUser.id && p.status !== 'cancelled'));
  const lastGame = myPast[0];
  const myRecords = playerMatchRecords(currentUser.id, games, teams, matches);

  const gameTitle = (gameId?: string) => games.find((g) => g.id === gameId)?.title;

  const submitPhone = () => {
    if (!otpStage) {
      setOtpStage(true);
      return;
    }
    addPhoneNumber(currentUser.id, newPhone, 'mobile');
    setDialogOpen(false);
    setNewPhone(''); setOtp(''); setOtpStage(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="rounded-2xl py-0 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <PlayerAvatar user={currentUser} className="size-16" fallbackClassName="text-xl font-bold" />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-bold">{currentUser.name}</h1>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="gap-1">
                {LEVEL_LABELS[currentUser.level]}
                {currentUser.levelVerified && <VerifiedBadge className="size-3.5" />}
              </Badge>
              <Badge variant="secondary">Side: {SIDE_LABELS[currentUser.preferredSide]}</Badge>
              {currentUser.gender && <Badge variant="outline">{GENDER_LABELS[currentUser.gender]}</Badge>}
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="size-3 text-green-600" /> Approved
              </Badge>
            </div>
            {referredBy && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Referred by{' '}
                <Link href={`/app/players/${referredBy.id}`} className="text-foreground/80 hover:text-primary">
                  {referredBy.name}
                </Link>
              </p>
            )}
          </div>
          {currentUser.memberSince && (
            <p className="text-xs text-muted-foreground">Member since {formatDate(currentUser.memberSince)}</p>
          )}
        </CardContent>
      </Card>

      {/* Quick stats (PRD §7.7) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Games played', value: myPast.length },
          { label: 'Total points', value: currentUser.points },
          { label: 'Rank', value: myRow ? `#${myRow.rank}` : '—' },
          { label: 'Upcoming', value: myUpcoming.length },
          { label: 'Last game', value: lastGame ? formatDate(lastGame.game.date) : '—' },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl py-0 shadow-sm">
            <CardContent className="p-3.5 text-center">
              <p className="font-heading text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Playtomic-style stats, preferences, partners */}
      <div className="grid gap-5 lg:grid-cols-2">
        <PlayerStatsCard records={myRecords} />
        <div className="space-y-5">
          <PreferencesCard
            user={currentUser}
            onUpdate={(patch) => setPlayerPreferences(currentUser.id, patch)}
          />
        </div>
        <PartnersCard
          playerId={currentUser.id}
          users={users}
          games={games}
          teams={teams}
          matches={matches}
          linkPlayers
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Karma (PRD §7.6, §14.7 — own profile only) */}
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="flex items-center justify-between font-heading text-base">
              <span className="flex items-center gap-2"><Star className="size-4 text-amber-500" /> Karma</span>
              <KarmaTierBadge tier={currentUser.karmaTier} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div>
              <div className="flex items-end justify-between">
                <span className="font-heading text-3xl font-bold">{currentUser.karmaBalance}</span>
                <span className="text-xs text-muted-foreground">of 100</span>
              </div>
              <Progress value={Math.max(0, currentUser.karmaBalance)} className="mt-2 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                Karma measures reliability, not skill. Earn +2 per on-time game and +20 when a friend you referred is approved;
                late cancellations, no-shows and unpaid games reduce it. Below 20 restricts sign-ups; 0 suspends them.
              </p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <History className="size-3.5" /> Event history
              </h4>
              <ul className="space-y-2">
                {myKarma.map((k) => (
                  <li key={k.id} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 w-10 shrink-0 text-right font-mono font-bold ${k.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {k.points >= 0 ? '+' : ''}{k.points}
                    </span>
                    <span className="min-w-0">
                      <span className="block">
                        {KARMA_EVENT_LABELS[k.eventType]}
                        {gameTitle(k.gameId) && <span className="text-muted-foreground"> — {gameTitle(k.gameId)}</span>}
                      </span>
                      {k.note && <span className="block text-xs text-muted-foreground">{k.note}</span>}
                      <span className="block text-[11px] text-muted-foreground/70">
                        {formatDateTime(k.createdAt)} · balance {k.balanceAfter}
                      </span>
                    </span>
                  </li>
                ))}
                {myKarma.length === 0 && <li className="text-sm text-muted-foreground">No karma events yet.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {/* Phone numbers */}
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="flex items-center justify-between font-heading text-base">
                <span className="flex items-center gap-2"><Phone className="size-4 text-primary" /> Phone numbers</span>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="size-3.5" /> Add number
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-5 pt-2">
              {myPhones.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="font-mono text-sm font-medium">{p.phoneNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.label}{p.verifiedAt ? ' · verified' : ' · unverified'}</p>
                  </div>
                  {p.isPrimary && <Badge variant="secondary">Primary</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* WhatsApp preferences */}
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="font-heading text-base">WhatsApp preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Service messages</p>
                  <p className="text-xs text-muted-foreground">Game reminders, confirmations, announcements.</p>
                </div>
                <Switch
                  checked={currentUser.whatsappOptIn}
                  onCheckedChange={(c) => setWhatsappPref(currentUser.id, 'whatsappOptIn', c === true)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Offers &amp; promotions</p>
                  <p className="text-xs text-muted-foreground">Partner offers via WhatsApp (marketing consent).</p>
                </div>
                <Switch
                  checked={currentUser.whatsappMarketingOptIn}
                  onCheckedChange={(c) => setWhatsappPref(currentUser.id, 'whatsappMarketingOptIn', c === true)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invite friends */}
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <UserPlus className="size-4 text-primary" />
                Invite friends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                Recommend a friend with their name, WhatsApp number, and level. Referred friends have a higher chance of approval — and you earn +20 karma when they join.
              </p>
              <Button className="w-full sm:w-auto" render={<Link href="/app/referrals" />}>
                <UserPlus className="size-3.5" />
                Invite a friend
              </Button>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <LifeBuoy className="size-4 text-primary" />
                Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                Need help with a booking, payment, or your account? Send us a note and an admin will contact you.
              </p>
              <Button className="w-full sm:w-auto" onClick={() => setSupportOpen(true)}>
                <LifeBuoy className="size-3.5" />
                Contact support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game history */}
      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="font-heading text-base">Game history</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-5 pt-2">
          {myPast.map(({ game, p }) => (
            <div key={game.id} className="flex items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <Link href={`/app/games/${game.id}`} className="truncate text-sm font-medium hover:text-primary">
                  {game.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDate(game.date)} · <ClubLink name={game.venue} className="text-xs" />
                </p>
              </div>
              <div className="text-right">
                {p?.position ? (
                  <p className="text-sm font-semibold">{p.position <= 3 ? ['🥇', '🥈', '🥉'][p.position - 1] : `#${p.position}`}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
                {p?.pointsAwarded ? <p className="text-xs text-green-600">+{p.pointsAwarded} pts</p> : null}
              </div>
            </div>
          ))}
          {myPast.length === 0 && <p className="py-4 text-sm text-muted-foreground">No completed games yet.</p>}
        </CardContent>
      </Card>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />

      {/* Add phone dialog with fake OTP */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setOtpStage(false); setOtp(''); setNewPhone(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add phone number</DialogTitle>
            <DialogDescription>
              {otpStage
                ? `We sent a verification code to ${newPhone} via WhatsApp (simulated — any code works).`
                : 'New numbers are verified with a WhatsApp OTP before they are linked to your profile.'}
            </DialogDescription>
          </DialogHeader>
          {otpStage ? (
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input id="otp" inputMode="numeric" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} className="h-11 font-mono tracking-widest" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="newphone">Phone number</Label>
              <Input id="newphone" type="tel" placeholder="+971 55 987 6543" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="h-11" />
            </div>
          )}
          <DialogFooter>
            <Button onClick={submitPhone} disabled={otpStage ? otp.length < 4 : !/^\+[1-9]\d{7,14}$/.test(newPhone.trim())}>
              {otpStage ? 'Verify & add' : 'Send code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
