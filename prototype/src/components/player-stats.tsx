'use client';

import * as React from 'react';
import Link from 'next/link';
import { BarChart3, ChevronDown, Hand, Heart, MapPin, Swords, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { VerifiedBadge } from '@/components/badges';
import { cn } from '@/lib/utils';
import {
  FORMAT_GROUP_LABELS, winLossByGroup, winLossStats, partnerStats, headToHead,
  type PlayerMatchRecord,
} from '@/lib/playerStats';
import {
  BEST_HAND_LABELS, LEVEL_LABELS, MATCH_TYPE_LABELS, PLAY_TIME_LABELS, PREFERRED_CLUBS,
  SIDE_LABELS, initials,
} from '@/lib/format';
import type {
  BestHand, Game, GameMatch, GameTeam, MatchTypePref, PlayTimePref, PreferredSide, User,
} from '@/types';

// ---- Win/loss statistics with effectiveness % and a time filter ----

type TimeFilter = 'all' | 'week' | 'month' | '3months' | 'custom';

const TIME_OPTIONS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'week', label: 'Last week' },
  { key: 'month', label: 'Last month' },
  { key: '3months', label: 'Last 3 months' },
  { key: 'custom', label: 'Custom range' },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function PlayerStatsCard({ records }: { records: PlayerMatchRecord[] }) {
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>('all');
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');

  const range = React.useMemo(() => {
    switch (timeFilter) {
      case 'week': return { from: isoDaysAgo(7) };
      case 'month': return { from: isoDaysAgo(30) };
      case '3months': return { from: isoDaysAgo(91) };
      case 'custom': return { from: customFrom || undefined, to: customTo || undefined };
      default: return undefined;
    }
  }, [timeFilter, customFrom, customTo]);

  const filtered = React.useMemo(
    () => records.filter(
      (r) => (!range?.from || r.game.date >= range.from) && (!range?.to || r.game.date <= range.to),
    ),
    [records, range],
  );

  const overall = winLossStats(filtered);
  const groups = winLossByGroup(filtered);
  const timeFiltered = Boolean(range?.from || range?.to);

  return (
    <Card className="rounded-2xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 font-heading text-base">
          <span className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" /> Statistics
          </span>
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <SelectTrigger className="h-8 w-36 text-xs font-normal">
              <SelectValue>{TIME_OPTIONS.find((o) => o.key === timeFilter)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-1.5">
            <Input
              type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9" aria-label="From date"
            />
            <span className="text-sm text-muted-foreground">–</span>
            <Input
              type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="h-9" aria-label="To date"
            />
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Matches', value: overall.played },
            { label: 'Won', value: overall.won, className: 'text-green-600' },
            { label: 'Lost', value: overall.lost, className: 'text-red-500' },
            { label: 'Win rate', value: overall.winRate != null ? `${overall.winRate}%` : '—' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-2.5">
              <p className={`font-heading text-lg font-bold ${s.className ?? ''}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {overall.played > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">By format</p>
            {groups.map(({ group, stats }) => (
              <div key={group} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{FORMAT_GROUP_LABELS[group]}</span>
                  <span className="text-xs text-muted-foreground">
                    {stats.won}W – {stats.lost}L · <span className="font-semibold text-foreground">{stats.winRate}%</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${stats.winRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {overall.played === 0 && (
          <p className="text-sm text-muted-foreground">
            {timeFiltered
              ? 'No recorded matches in this period.'
              : 'No recorded matches yet — stats appear after the first game with round scores.'}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Counted from round-by-round match scores of completed games.
        </p>
      </CardContent>
    </Card>
  );
}

// ---- Frequent partners & best duo ----

export function PartnersCard({
  playerId, users, games, teams, matches, linkPlayers = false,
}: {
  playerId: string;
  users: User[];
  games: Game[];
  teams: GameTeam[];
  matches: GameMatch[];
  linkPlayers?: boolean;
}) {
  const partners = partnerStats(playerId, users, games, teams, matches);
  const top = partners.slice(0, 5);
  // Best duo: best win rate among partners with at least 3 matches together.
  const bestDuo = partners.filter((p) => p.matches >= 3).sort((a, b) => b.winRate - a.winRate)[0];

  return (
    <Card className="rounded-2xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="flex items-center gap-2 font-heading text-base">
          <Users className="size-4 text-primary" /> Partners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-5">
        {top.map((p) => {
          const inner = (
            <>
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials(p.partner.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {p.partner.name}
                  {p.partner.levelVerified && <VerifiedBadge className="size-3.5" />}
                  {bestDuo && p.partner.id === bestDuo.partner.id && (
                    <Badge className="gap-1 bg-pink-500/15 text-pink-600 hover:bg-pink-500/15">
                      <Heart className="size-3" /> Best duo
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {LEVEL_LABELS[p.partner.level]} · {p.gamesTogether} game{p.gamesTogether === 1 ? '' : 's'} · {p.matches} matches together
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{p.winRate}%</p>
                <p className="text-[11px] text-muted-foreground">{p.wins}W – {p.matches - p.wins}L</p>
              </div>
            </>
          );
          return linkPlayers ? (
            <Link key={p.partner.id} href={`/app/players/${p.partner.id}`} className="flex items-center gap-3 rounded-xl border p-2.5 transition-colors hover:bg-muted/50">
              {inner}
            </Link>
          ) : (
            <div key={p.partner.id} className="flex items-center gap-3 rounded-xl border p-2.5">
              {inner}
            </div>
          );
        })}
        {top.length === 0 && (
          <p className="text-sm text-muted-foreground">No partners yet — play a game with recorded scores to see who you team up with most.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Head-to-head (public profile, viewer vs player) ----

export function HeadToHeadCard({
  viewer, other, games, teams, matches,
}: {
  viewer: User;
  other: User;
  games: Game[];
  teams: GameTeam[];
  matches: GameMatch[];
}) {
  const h2h = headToHead(viewer.id, other.id, games, teams, matches);

  return (
    <Card className="rounded-2xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="flex items-center gap-2 font-heading text-base">
          <Swords className="size-4 text-primary" /> Head-to-head
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {h2h.matches > 0 ? (
          <>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="font-heading text-2xl font-bold text-green-600">{h2h.viewerWins}</p>
                <p className="max-w-24 truncate text-xs text-muted-foreground">You</p>
              </div>
              <span className="text-lg font-bold text-muted-foreground">–</span>
              <div className="text-center">
                <p className="font-heading text-2xl font-bold">{h2h.otherWins}</p>
                <p className="max-w-24 truncate text-xs text-muted-foreground">{other.name.split(' ')[0]}</p>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${(h2h.viewerWins / h2h.matches) * 100}%` }} />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {h2h.matches} match{h2h.matches === 1 ? '' : 'es'} on opposite sides of the net.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t faced {other.name.split(' ')[0]} yet — your record will show up after your first match against each other.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Preferences card (read-only, or editable on own profile) ----

const SINGLE_PREFS = [
  { key: 'preferredSide', label: 'Court side', labels: SIDE_LABELS, options: ['left', 'right', 'both'] },
  { key: 'bestHand', label: 'Best hand', labels: BEST_HAND_LABELS, options: ['right', 'left', 'ambidextrous'] },
  { key: 'preferredMatchType', label: 'Match type', labels: MATCH_TYPE_LABELS, options: ['competitive', 'social', 'both'] },
] as const;

const PLAY_TIME_OPTIONS: PlayTimePref[] = ['morning', 'afternoon', 'evening'];

type PreferencesPatch = Partial<
  Pick<User, 'preferredSide' | 'bestHand' | 'preferredMatchType' | 'preferredPlayTime' | 'preferredClubs'>
>;

export function PreferencesCard({
  user, onUpdate,
}: {
  user: User;
  /** When provided, the card becomes editable (own profile). */
  onUpdate?: (patch: PreferencesPatch) => void;
}) {
  const playTimes = user.preferredPlayTime ?? [];
  const clubs = user.preferredClubs ?? [];

  const togglePlayTime = (t: PlayTimePref) => {
    if (!onUpdate) return;
    const next = playTimes.includes(t) ? playTimes.filter((x) => x !== t) : [...playTimes, t];
    onUpdate({ preferredPlayTime: next });
  };

  const toggleClub = (club: string) => {
    if (!onUpdate) return;
    const next = clubs.includes(club) ? clubs.filter((c) => c !== club) : [...clubs, club];
    onUpdate({ preferredClubs: next });
  };

  return (
    <Card className="rounded-2xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="flex items-center gap-2 font-heading text-base">
          <Hand className="size-4 text-primary" /> Playing preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SINGLE_PREFS.map((item) => {
            const value = user[item.key] as string | undefined;
            if (!onUpdate) {
              return (
                <div key={item.key} className="rounded-xl border p-3">
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">
                    {value ? (item.labels as Record<string, string>)[value] : 'Not set'}
                  </p>
                </div>
              );
            }
            return (
              <div key={item.key} className="space-y-1">
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <Select
                  value={value ?? ''}
                  onValueChange={(v) =>
                    onUpdate({ [item.key]: v as PreferredSide & BestHand & MatchTypePref })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not set">
                      {value ? (item.labels as Record<string, string>)[value] : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {item.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {(item.labels as Record<string, string>)[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        {/* Preferred time — multi-select */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Preferred time</p>
          {onUpdate ? (
            <div className="flex flex-wrap gap-1.5">
              {PLAY_TIME_OPTIONS.map((t) => {
                const active = playTimes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => togglePlayTime(t)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {PLAY_TIME_LABELS[t]}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm font-medium">
              {playTimes.length > 0 ? playTimes.map((t) => PLAY_TIME_LABELS[t]).join(', ') : 'Not set'}
            </p>
          )}
        </div>

        {/* Preferred clubs — multi-select */}
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3" /> Preferred clubs
          </p>
          {onUpdate && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="w-full justify-between font-normal">
                    {clubs.length > 0 ? `${clubs.length} club${clubs.length === 1 ? '' : 's'} selected` : 'Select clubs'}
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto">
                {PREFERRED_CLUBS.map((club) => (
                  <DropdownMenuCheckboxItem
                    key={club}
                    checked={clubs.includes(club)}
                    onCheckedChange={() => toggleClub(club)}
                    closeOnClick={false}
                  >
                    {club}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {clubs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {clubs.map((club) => (
                <Badge key={club} variant="secondary">{club}</Badge>
              ))}
            </div>
          ) : (
            !onUpdate && <p className="text-sm font-medium">Not set</p>
          )}
        </div>

        {onUpdate && (
          <p className="text-[11px] text-muted-foreground">
            Visible on your public profile and used by organizers to compose balanced teams.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
