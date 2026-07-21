'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, Play, Ban, Trash2,
  UserPlus, Search, AlertTriangle, MessageCircle, Trophy, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { GameStatusBadge, KarmaTierBadge, ParticipantStatusBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { spotsTaken } from '@/lib/derive';
import { FORMAT_LABELS, LEVEL_LABELS, formatDateLong, initials } from '@/lib/format';
import type { GameParticipant, User } from '@/types';

export default function AdminGameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    games, participants, users, phones,
    setGameStatus, deleteGame, addPlayerToGame, removePlayerFromGame,
    markAttendance, markPayment, setResult, publishResults,
  } = useMockData();

  const [addOpen, setAddOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [overrideTarget, setOverrideTarget] = React.useState<User | null>(null);
  const [overrideReason, setOverrideReason] = React.useState('');
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const game = games.find((g) => g.id === id && !g.deleted);
  if (!game) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">Game not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/games')}>Back to games</Button>
      </div>
    );
  }

  const roster = participants
    .filter((p) => p.gameId === game.id)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  const activeRoster = roster.filter((p) => !['cancelled'].includes(p.status));
  const taken = spotsTaken(participants, game.id);
  const userFor = (userId: string) => users.find((u) => u.id === userId);

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

  const resultsReady = activeRoster.some((p) => p.position != null);

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
            {FORMAT_LABELS[game.format]} · {formatDateLong(game.date)} · {game.startTime}–{game.endTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {game.status === 'upcoming' && (
            <>
              <Button onClick={() => setGameStatus(game.id, 'live')}>
                <Play className="size-4" /> Start game
              </Button>
              <Button variant="outline" onClick={() => setGameStatus(game.id, 'cancelled')}>
                <Ban className="size-4" /> Cancel
              </Button>
            </>
          )}
          {game.status === 'live' && (
            <Button onClick={() => publishResults(game.id)} disabled={!resultsReady}>
              <Trophy className="size-4" /> Publish results &amp; complete
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => toast.success('Player list sent (simulated)', { description: `Formatted list for ${game.title} sent 1:1 to ${activeRoster.length} registered players via WhatsApp.` })}
          >
            <MessageCircle className="size-4" /> Send list via WhatsApp
          </Button>
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
          <span className="flex items-center gap-1.5"><Users className="size-4 text-primary" /> {taken}/{game.capacity} · {game.courts} courts</span>
          <Badge variant="secondary">{LEVEL_LABELS[game.level]}</Badge>
          {game.price != null && <Badge variant="outline">AED {game.price}</Badge>}
          {game.reminderSchedule && game.reminderSchedule.length > 0 && (
            <Badge variant="outline" className="gap-1"><MessageCircle className="size-3" /> Reminders: {game.reminderSchedule.join(', ')}</Badge>
          )}
        </CardContent>
      </Card>

      {/* Roster */}
      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="flex-row items-center justify-between p-4 pb-0">
          <CardTitle className="font-heading text-base">
            Players ({activeRoster.filter((p) => p.status !== 'waitlisted').length}/{game.capacity})
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
              return (
                <ParticipantRow
                  key={p.id}
                  participant={p}
                  user={u}
                  gameStatus={game.status}
                  onRemove={() => removePlayerFromGame(game.id, u.id)}
                  onAttendance={(v) => markAttendance(p.id, v)}
                  onPayment={(v) => markPayment(p.id, v)}
                  onResult={(pos, pts) => setResult(p.id, pos, pts)}
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

      {game.status === 'live' && (
        <p className="text-center text-xs text-muted-foreground">
          Mark attendance and payment per player, enter final positions and points, then publish results.
          Publishing updates the leaderboard, player history, and karma (+2 per on-time player).
        </p>
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
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{LEVEL_LABELS[u.level]} · {u.points} pts</p>
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

function ParticipantRow({
  participant: p, user: u, gameStatus, onRemove, onAttendance, onPayment, onResult,
}: {
  participant: GameParticipant;
  user: User;
  gameStatus: string;
  onRemove: () => void;
  onAttendance: (v: NonNullable<GameParticipant['attendance']>) => void;
  onPayment: (v: NonNullable<GameParticipant['paymentStatus']>) => void;
  onResult: (position: number, points: number) => void;
}) {
  const inGame = gameStatus === 'live';
  const past = gameStatus === 'completed';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(u.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {u.name}
          <KarmaTierBadge tier={u.karmaTier} />
        </p>
        <p className="text-xs text-muted-foreground">{LEVEL_LABELS[u.level]}</p>
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
          <Input
            type="number" min={1} placeholder="Pos"
            className="h-8 w-16"
            value={p.position ?? ''}
            onChange={(e) => {
              const pos = Number(e.target.value);
              if (pos > 0) onResult(pos, Math.max(2, 22 - pos * 2));
            }}
          />
          {p.pointsAwarded ? <span className="text-xs text-green-600">+{p.pointsAwarded}</span> : null}
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
