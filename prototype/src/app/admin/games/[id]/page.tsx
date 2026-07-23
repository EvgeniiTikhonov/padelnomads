'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, Play, Ban, Trash2,
  UserPlus, Search, AlertTriangle, MessageCircle, Trophy, X, ArrowUpDown,
  ChevronRight, CheckCircle2, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlayerAvatar } from '@/components/player-avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { GameStatusBadge, KarmaTierBadge, ParticipantStatusBadge, VerifiedBadge } from '@/components/badges';
import { GameResults } from '@/components/game-results';
import { CourtDistribution } from '@/components/court-distribution';
import { FormatLabel } from '@/components/format-icon';
import { useMockData } from '@/data/provider';
import { spotsTaken, maxFixedTeams } from '@/lib/derive';
import { waitlistOrdered, waitlistUnitsOrdered } from '@/lib/waitlist';
import { LEVEL_LABELS, formatDateLong, isFixedTeamFormat } from '@/lib/format';
import { TEAM_ENTRY_LABELS } from '@/lib/teamPriority';
import { formatConfig } from '@/lib/gameFormats';
import { computeStandings, matchDecided } from '@/lib/scoring';
import type { Game, GameMatch, GameParticipant, GameTeam, User } from '@/types';

type LiveStep = 'attendance' | 'scores';

export default function AdminGameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    games, participants, teams, matches, users, phones, externalPartnerInvites,
    setGameStatus, deleteGame, addPlayerToGame, removePlayerFromGame,
    markAttendance, markPayment, startGame, updateMatchScore, generateNextRound, collectScores,
  } = useMockData();

  const [addOpen, setAddOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [overrideTarget, setOverrideTarget] = React.useState<User | null>(null);
  const [overrideReason, setOverrideReason] = React.useState('');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [step, setStep] = React.useState<LiveStep>('attendance');
  const [currentRound, setCurrentRound] = React.useState(0);

  const game = games.find((g) => g.id === id && !g.deleted);
  if (!game) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">Game not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/games')}>Back to games</Button>
      </div>
    );
  }

  const cfg = formatConfig(game.format);
  const roster = participants
    .filter((p) => p.gameId === game.id)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  const activeRoster = roster.filter((p) => !['cancelled', 'waitlisted'].includes(p.status));
  const waitlist = waitlistOrdered(participants, users, game.id);
  const taken = spotsTaken(participants, game.id, externalPartnerInvites, game.format);
  const isFixedTeam = isFixedTeamFormat(game.format);
  const waitlistUnits = isFixedTeam
    ? waitlistUnitsOrdered(participants, users, game.id)
    : null;
  const teamsTaken = isFixedTeam ? taken / 2 : 0;
  const teamsMax = isFixedTeam ? maxFixedTeams(game.capacity) : 0;
  const userFor = (userId: string) => users.find((u) => u.id === userId);
  const gameTeams = teams.filter((t) => t.gameId === game.id);
  const gameMatches = matches.filter((m) => m.gameId === game.id);
  const totalRounds = cfg.rounds.length;
  const roundsGenerated = gameMatches.length > 0 ? Math.max(...gameMatches.map((m) => m.round)) + 1 : 0;
  const allDecided = gameMatches.length > 0 && gameMatches.every(matchDecided);
  const canCollect = allDecided && roundsGenerated >= totalRounds;

  const candidates = users.filter((u) => {
    if (u.role !== 'player') return false;
    if (roster.some((p) => p.userId === u.id && p.status !== 'cancelled')) return false;
    const q = query.toLowerCase();
    const phone = phones.find((p) => p.userId === u.id && p.isPrimary)?.phoneNumber ?? '';
    return !q || u.name.toLowerCase().includes(q) || phone.includes(q) || u.level.includes(q);
  }).slice(0, 8);

  const tryAdd = (u: User) => {
    if (u.status === 'banned') {
      addPlayerToGame(game.id, u.id); // provider shows the blocking toast
      return;
    }
    const needsOverride =
      u.karmaTier === 'restricted' || u.karmaTier === 'suspended' || taken >= game.capacity;
    if (needsOverride) {
      setOverrideTarget(u);
      return;
    }
    if (addPlayerToGame(game.id, u.id)) setQuery('');
  };

  const confirmOverride = () => {
    if (!overrideTarget || !overrideReason.trim()) return;
    addPlayerToGame(game.id, overrideTarget.id, { overrideReason: overrideReason.trim() });
    setOverrideTarget(null);
    setOverrideReason('');
  };

  const showRoster = game.status === 'upcoming' || game.status === 'completed' || (game.status === 'live' && step === 'attendance');

  return (
    <div className="space-y-5">
      <Link href="/admin/games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All games
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 font-heading text-2xl font-bold">
            {game.title} <GameStatusBadge status={game.status} />
          </h1>
          <p className="text-sm text-muted-foreground">
            <FormatLabel format={game.format} className="inline" /> · {formatDateLong(game.date)} · {game.startTime}–{game.endTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {game.status === 'upcoming' && (
            <>
              <Button onClick={() => { startGame(game.id); setStep('attendance'); setCurrentRound(0); }}>
                <Play className="size-4" /> Start game
              </Button>
              <Button variant="outline" onClick={() => setGameStatus(game.id, 'cancelled')}>
                <Ban className="size-4" /> Cancel
              </Button>
            </>
          )}
          {game.status === 'live' && step === 'scores' && (
            <Button onClick={() => collectScores(game.id)} disabled={!canCollect}>
              <Trophy className="size-4" /> Collect scores
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => toast.success('Player list sent (simulated)', { description: `Formatted list for ${game.title} sent 1:1 to ${activeRoster.length} registered players via WhatsApp.` })}
          >
            <MessageCircle className="size-4" /> Send list via WhatsApp
          </Button>
          <Link href={`/admin/games/new?from=${game.id}`}>
            <Button variant="outline">
              <Copy className="size-4" /> Duplicate
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardContent className="flex flex-wrap gap-x-6 gap-y-2 p-4 text-sm">
          <span className="flex items-center gap-1.5"><CalendarDays className="size-4 text-primary" /> {formatDateLong(game.date)}</span>
          <span className="flex items-center gap-1.5"><Clock className="size-4 text-primary" /> {game.startTime}–{game.endTime}</span>
          <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" /> {game.venue}</span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4 text-primary" />
            {isFixedTeam
              ? `${teamsTaken}/${teamsMax} teams · ${game.courts} courts`
              : `${taken}/${game.capacity} · ${game.courts} courts`}
          </span>
          <Badge variant="secondary">{LEVEL_LABELS[game.level]}</Badge>
          {game.price != null && <Badge variant="outline">AED {game.price}</Badge>}
        </CardContent>
      </Card>

      {/* Format rules reference (pre-game + attendance step) */}
      {(game.status === 'upcoming' || (game.status === 'live' && step === 'attendance')) && (
        <FormatRulesCard format={game.format} />
      )}

      {/* Court distribution — seed the courts before the game starts */}
      {game.status === 'upcoming' && <CourtDistribution game={game} />}

      {/* Live step 1: confirm attendance */}
      {game.status === 'live' && step === 'attendance' && (
        <Card className="rounded-2xl border-primary/30 bg-primary/[0.03] py-0 shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="flex items-center gap-1.5 font-heading text-base font-semibold">
                <CheckCircle2 className="size-4 text-primary" /> Step 1 · Confirm attendance
              </p>
              <p className="text-sm text-muted-foreground">
                Everyone is pre-marked on-time & paid. Adjust any latecomers or no-shows below, then continue to scoring.
              </p>
            </div>
            <Button onClick={() => { if (gameTeams.length === 0) startGame(game.id); setStep('scores'); setCurrentRound(0); }}>
              Confirm &amp; enter scores <ChevronRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Live step 2: match scores by round */}
      {game.status === 'live' && step === 'scores' && (
        <ScoringStep
          game={game}
          teams={gameTeams}
          matches={gameMatches}
          users={users}
          currentRound={Math.min(currentRound, Math.max(0, roundsGenerated - 1))}
          roundsGenerated={roundsGenerated}
          totalRounds={totalRounds}
          canCollect={canCollect}
          onBack={() => setStep('attendance')}
          onSelectRound={setCurrentRound}
          onScore={updateMatchScore}
          onNextRound={(from) => { generateNextRound(game.id, from); setCurrentRound(from + 1); }}
          onCollect={() => collectScores(game.id)}
        />
      )}

      {/* Completed: stored results (also shown to players in their history) */}
      {game.status === 'completed' && gameTeams.length > 0 && (
        <GameResults game={game} teams={gameTeams} matches={gameMatches} users={users} />
      )}

      {/* Roster */}
      {showRoster && (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between p-4 pb-0">
            <CardTitle className="font-heading text-base">
              {isFixedTeam
                ? `Teams (${teamsTaken}/${teamsMax}) · ${activeRoster.length} players`
                : `Players (${activeRoster.length}/${game.capacity})`}
            </CardTitle>
            {game.status !== 'completed' && game.status !== 'cancelled' && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus className="size-3.5" /> Add player
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="divide-y">
              {activeRoster.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No players yet.</p>
              )}
              {activeRoster.map((p) => {
                const u = userFor(p.userId);
                if (!u) return null;
                const team = gameTeams.find((t) => t.id === p.teamId);
                return (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    user={u}
                    teamName={team?.name}
                    gameStatus={game.status}
                    onRemove={() => removePlayerFromGame(game.id, u.id)}
                    onAttendance={(v) => markAttendance(p.id, v)}
                    onPayment={(v) => markPayment(p.id, v)}
                  />
                );
              })}
            </div>
            {roster.some((p) => p.status === 'cancelled') && (
              <div className="mt-3 border-t pt-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Cancelled</p>
                {roster.filter((p) => p.status === 'cancelled').map((p) => {
                  const u = userFor(p.userId);
                  return u ? (
                    <p key={p.id} className="py-1 text-sm text-muted-foreground line-through">{u.name}</p>
                  ) : null;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showRoster && (waitlistUnits ? waitlistUnits.length > 0 : waitlist.length > 0) && (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="font-heading text-base">
              Waitlist ({waitlistUnits ? waitlistUnits.length : waitlist.length}
              {waitlistUnits ? ' units' : ''})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {isFixedTeam
                ? 'Priority: full pairs → partner pending → solos, then karma — #1 is promoted first when a team slot opens.'
                : 'Karma priority — #1 is promoted first when a main-list spot opens.'}
            </p>
          </CardHeader>
          <CardContent className="divide-y p-4 pt-2">
            {waitlistUnits
              ? waitlistUnits.map((unit, i) => {
                  const members = unit.participants
                    .map((p) => ({ p, u: userFor(p.userId) }))
                    .filter((x): x is { p: typeof unit.participants[0]; u: NonNullable<ReturnType<typeof userFor>> } => Boolean(x.u));
                  if (members.length === 0) return null;
                  return (
                    <div key={unit.participants.map((p) => p.id).join('-')} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-center text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {members.map((m) => m.u.name).join(' + ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {TEAM_ENTRY_LABELS[unit.entryKind]} · karma {unit.karma}
                        </p>
                      </div>
                      <Badge variant="secondary">{TEAM_ENTRY_LABELS[unit.entryKind]}</Badge>
                      {members.map(({ p, u }) => (
                        <Button
                          key={p.id}
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removePlayerFromGame(game.id, u.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ))}
                    </div>
                  );
                })
              : waitlist.map((p, i) => {
                  const u = userFor(p.userId);
                  if (!u) return null;
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-center text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                      <PlayerAvatar
                        user={u}
                        className="size-8"
                        fallbackClassName="bg-muted text-muted-foreground text-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">karma {u.karmaBalance} · {u.karmaTier}</p>
                      </div>
                      <KarmaTierBadge tier={u.karmaTier} />
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removePlayerFromGame(game.id, u.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
          </CardContent>
        </Card>
      )}

      {/* Add player dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setQuery(''); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add player</DialogTitle>
            <DialogDescription>
              Search by name, phone, or level. Banned players are blocked; karma-restricted players and
              overbooking require an override with a logged reason.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus placeholder="Search players…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
          <div className="max-h-72 divide-y overflow-y-auto">
            {candidates.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2.5">
                <PlayerAvatar user={u} className="size-8" fallbackClassName="text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {LEVEL_LABELS[u.level]}
                    {u.levelVerified && <VerifiedBadge className="size-3.5" />}
                    · {u.points} pts
                  </p>
                </div>
                {u.status === 'banned' ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <KarmaTierBadge tier={u.karmaTier} />
                )}
                <Button size="sm" variant="outline" disabled={u.status === 'banned'} onClick={() => tryAdd(u)}>
                  Add
                </Button>
              </div>
            ))}
            {candidates.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No matching players.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Override dialog */}
      <Dialog open={overrideTarget !== null} onOpenChange={(o) => { if (!o) { setOverrideTarget(null); setOverrideReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-orange-600" /> Override required
            </DialogTitle>
            <DialogDescription>
              {overrideTarget && (overrideTarget.karmaTier === 'restricted' || overrideTarget.karmaTier === 'suspended')
                ? `${overrideTarget.name} is karma-${overrideTarget.karmaTier} (balance ${overrideTarget.karmaBalance}). Adding them requires an explicit override with a logged reason.`
                : 'This game is at capacity. Adding another player requires an overbooking override.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ovr">Override reason (logged)</Label>
            <Textarea id="ovr" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="e.g. Player settled outstanding payment; approved by lead admin" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideTarget(null)}>Cancel</Button>
            <Button disabled={!overrideReason.trim()} onClick={confirmOverride}>Override &amp; add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this game?</DialogTitle>
            <DialogDescription>
              Soft delete — the game is hidden from all lists but its history is preserved. This can be reversed in the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Keep game</Button>
            <Button variant="destructive" onClick={() => { deleteGame(game.id); router.push('/admin/games'); }}>
              <Trash2 className="size-4" /> Delete game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormatRulesCard({ format }: { format: Game['format'] }) {
  const cfg = formatConfig(format);
  const roundsLabel = cfg.roundMinutes
    ? `${cfg.rounds.length} rounds × ${cfg.roundMinutes} min`
    : `${cfg.rounds.length} stages`;
  return (
    <Card className="rounded-2xl border-primary/20 bg-primary/[0.03] py-0 shadow-sm">
      <CardContent className="space-y-2 p-4 text-sm">
        <p className="flex items-center gap-1.5 font-heading text-base font-semibold">
          <FormatLabel format={format} /> — format rules
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{cfg.warmupMinutes} min warm-up</Badge>
          <Badge variant="outline">{roundsLabel}</Badge>
          <Badge variant="outline">{cfg.pointRule}</Badge>
          {cfg.courtMovement && <Badge variant="outline" className="gap-1"><ArrowUpDown className="size-3" /> Winners up · losers down</Badge>}
          {cfg.changePartners && <Badge variant="outline">Partners rotate each round</Badge>}
          <Badge variant="outline" className="capitalize">{cfg.rankingBasis} ranking</Badge>
        </div>
        {cfg.boostRule && <p className="text-muted-foreground"><span className="font-medium text-foreground">Boosted points:</span> {cfg.boostRule}</p>}
        {cfg.streakBonusFromRound != null && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Streak bonus:</span> from Round {cfg.streakBonusFromRound}, two consecutive wins add +1 to that round&apos;s score.
          </p>
        )}
        {cfg.notes.map((n) => (
          <p key={n} className="text-muted-foreground">· {n}</p>
        ))}
      </CardContent>
    </Card>
  );
}

function ScoringStep({
  game, teams, matches, users, currentRound, roundsGenerated, totalRounds, canCollect,
  onBack, onSelectRound, onScore, onNextRound, onCollect,
}: {
  game: Game;
  teams: GameTeam[];
  matches: GameMatch[];
  users: User[];
  currentRound: number;
  roundsGenerated: number;
  totalRounds: number;
  canCollect: boolean;
  onBack: () => void;
  onSelectRound: (r: number) => void;
  onScore: (matchId: string, side: 'A' | 'B', value: number | null) => void;
  onNextRound: (fromRound: number) => void;
  onCollect: () => void;
}) {
  const cfg = formatConfig(game.format);
  const standings = computeStandings(game, teams, matches);
  const teamName = (tid: string) => teams.find((t) => t.id === tid)?.name ?? 'Team';
  const playersOf = (tid: string) =>
    (teams.find((t) => t.id === tid)?.playerIds ?? [])
      .map((uid) => users.find((u) => u.id === uid)?.name.split(' ')[0] ?? 'Player')
      .join(' · ');

  const roundMatches = matches
    .filter((m) => m.round === currentRound)
    .sort((a, b) => a.court - b.court);
  const roundDecided = roundMatches.length > 0 && roundMatches.every(matchDecided);
  const isLastGenerated = currentRound === roundsGenerated - 1;
  const moreRounds = roundsGenerated < totalRounds;

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="gap-2 p-4 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base">Step 2 · Match scores</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="size-3.5" /> Attendance
            </Button>
          </div>
          {/* Round tabs */}
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: roundsGenerated }).map((_, r) => (
              <Button
                key={r}
                size="sm"
                variant={r === currentRound ? 'default' : 'outline'}
                onClick={() => onSelectRound(r)}
              >
                {cfg.rounds[r]?.label ?? `Round ${r + 1}`}
                {cfg.rounds[r]?.boosted && <span className="ml-1 text-[10px]">★</span>}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-3">
          {cfg.rounds[currentRound]?.boosted && (
            <p className="text-xs text-amber-600">
              Boosted round — winners earn court points (Court 1–2 → 3, Court 3–4 → 2, else 1){cfg.streakBonusFromRound != null ? ', plus +1 for a 2-win streak.' : '.'}
            </p>
          )}
          {roundMatches.map((m) => {
            const aWon = matchDecided(m) && (m.scoreA as number) > (m.scoreB as number);
            const bWon = matchDecided(m) && (m.scoreB as number) > (m.scoreA as number);
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-2.5">
                <Badge variant={m.court <= 2 ? 'default' : 'secondary'} className="shrink-0">Court {m.court}</Badge>
                <div className={`min-w-0 flex-1 text-right text-sm ${aWon ? 'font-semibold' : ''}`}>
                  {teamName(m.teamAId)}
                  <span className="block text-xs text-muted-foreground">{playersOf(m.teamAId)}</span>
                </div>
                <Input
                  type="number" min={0} aria-label="Team A score"
                  className="h-9 w-14 text-center"
                  value={m.scoreA ?? ''}
                  onChange={(e) => onScore(m.id, 'A', e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                />
                <span className="text-muted-foreground">:</span>
                <Input
                  type="number" min={0} aria-label="Team B score"
                  className="h-9 w-14 text-center"
                  value={m.scoreB ?? ''}
                  onChange={(e) => onScore(m.id, 'B', e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                />
                <div className={`min-w-0 flex-1 text-sm ${bWon ? 'font-semibold' : ''}`}>
                  {teamName(m.teamBId)}
                  <span className="block text-xs text-muted-foreground">{playersOf(m.teamBId)}</span>
                </div>
              </div>
            );
          })}
          {roundMatches.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No matches for this round.</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Round {currentRound + 1} of {totalRounds}. Enter a decisive score for each court.
            </p>
            {isLastGenerated && moreRounds ? (
              <Button size="sm" disabled={!roundDecided} onClick={() => onNextRound(currentRound)}>
                Next round <ChevronRight className="size-4" />
              </Button>
            ) : isLastGenerated && !moreRounds ? (
              <Button size="sm" disabled={!canCollect} onClick={onCollect}>
                <Trophy className="size-4" /> Collect scores
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Live standings preview */}
      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="font-heading text-base">Live standings</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Team</th>
                  <th className="pb-2 pr-3 text-center font-medium">Court</th>
                  <th className="pb-2 pr-3 text-center font-medium">Wins</th>
                  <th className="pb-2 text-center font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s.team.id} className="border-t">
                    <td className="py-2 pr-2 font-semibold">{s.rank}</td>
                    <td className="py-2 pr-3">
                      <span className="font-medium">{s.team.name}</span>
                      <span className="block text-xs text-muted-foreground">{playersOf(s.team.id)}</span>
                    </td>
                    <td className="py-2 pr-3 text-center">{s.finalCourt}</td>
                    <td className="py-2 pr-3 text-center">{s.wins}</td>
                    <td className="py-2 text-center font-semibold text-primary">{s.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ParticipantRow({
  participant: p, user: u, teamName, gameStatus, onRemove, onAttendance, onPayment,
}: {
  participant: GameParticipant;
  user: User;
  teamName?: string;
  gameStatus: string;
  onRemove: () => void;
  onAttendance: (v: NonNullable<GameParticipant['attendance']>) => void;
  onPayment: (v: NonNullable<GameParticipant['paymentStatus']>) => void;
}) {
  const inGame = gameStatus === 'live';
  const past = gameStatus === 'completed';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
      <PlayerAvatar user={u} className="size-8" fallbackClassName="text-xs" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {u.name}
          <KarmaTierBadge tier={u.karmaTier} />
          {teamName && <Badge variant="outline" className="text-[10px]">{teamName}</Badge>}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {LEVEL_LABELS[u.level]}
          {u.levelVerified && <VerifiedBadge className="size-3.5" />}
        </p>
      </div>

      {past ? (
        <div className="flex items-center gap-2 text-sm">
          {p.position ? (
            <span className="font-semibold">{p.position <= 3 ? ['🥇', '🥈', '🥉'][p.position - 1] : `#${p.position}`}</span>
          ) : <span className="text-muted-foreground">—</span>}
          {p.pointsAwarded ? <span className="text-green-600">+{p.pointsAwarded} pts</span> : null}
          {p.attendance && <Badge variant="outline" className="capitalize">{p.attendance.replace('_', ' ')}</Badge>}
          {p.paymentStatus && <Badge variant="outline" className="capitalize">{p.paymentStatus}</Badge>}
        </div>
      ) : inGame ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={p.attendance ?? null} onValueChange={(v) => { if (v) onAttendance(v as NonNullable<GameParticipant['attendance']>); }}>
            <SelectTrigger size="sm" className="w-28"><SelectValue placeholder="Attendance" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="on_time">On time</SelectItem>
              <SelectItem value="late">Late (−5)</SelectItem>
              <SelectItem value="no_show">No-show (−30)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={p.paymentStatus ?? null} onValueChange={(v) => { if (v) onPayment(v as NonNullable<GameParticipant['paymentStatus']>); }}>
            <SelectTrigger size="sm" className="w-28"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid (−20)</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <ParticipantStatusBadge status={p.status} />
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <X className="size-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      )}
    </div>
  );
}
