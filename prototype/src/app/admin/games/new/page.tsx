'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useMockData } from '@/data/provider';
import { visibleGames } from '@/lib/derive';
import { FORMAT_LABELS, LEVELS, LEVEL_LABELS, formatDate, GENDER_RESTRICTION_LABELS, CLUB_AMENITY_LABELS } from '@/lib/format';
import { FORMAT_GENDER_LABELS, type FormatGenderMode } from '@/lib/gameFormats';
import { FormatIcon } from '@/components/format-icon';
import type { Game, GameFormat, Level } from '@/types';

/** Shift a YYYY-MM-DD date by N days (week-over-week default = +7). */
function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface GameDraft {
  copiedFromId: string | null;
  title: string;
  format: GameFormat | null;
  venue: string | null;
  date: string;
  startTime: string;
  endTime: string;
  courts: number;
  capacity: number;
  level: Game['level'] | null;
  genderRestriction: FormatGenderMode | null;
  price: string;
  description: string;
  rem24: boolean;
  rem2: boolean;
}

const EMPTY_DRAFT: GameDraft = {
  copiedFromId: null,
  title: '',
  format: null,
  venue: null,
  date: '',
  startTime: '19:00',
  endTime: '21:00',
  courts: 2,
  capacity: 8,
  level: 'mixed',
  genderRestriction: 'mixed',
  price: '',
  description: '',
  rem24: true,
  rem2: true,
};

function draftFromGame(source: Game): GameDraft {
  const rem = source.reminderSchedule ?? [];
  return {
    copiedFromId: source.id,
    title: source.title,
    format: source.format,
    venue: source.venue,
    date: shiftDate(source.date, 7),
    startTime: source.startTime,
    endTime: source.endTime,
    courts: source.courts,
    capacity: source.capacity,
    level: source.level,
    genderRestriction: source.genderRestriction ?? 'mixed',
    price: source.price != null ? String(source.price) : '',
    description: source.description ?? '',
    rem24: rem.length === 0 ? true : rem.includes('24h'),
    rem2: rem.length === 0 ? true : rem.includes('2h'),
  };
}

export default function CreateGamePage() {
  return (
    <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <CreateGameForm />
    </React.Suspense>
  );
}

function CreateGameForm() {
  const { createGame, games, formatDefinitions, clubs } = useMockData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from');

  const activeFormats = React.useMemo(
    () => formatDefinitions.filter((d) => d.active),
    [formatDefinitions],
  );

  const activeClubs = React.useMemo(
    () => clubs.filter((c) => c.status === 'active').sort((a, b) => a.name.localeCompare(b.name)),
    [clubs],
  );

  const templates = React.useMemo(
    () =>
      visibleGames(games)
        .slice()
        .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)),
    [games],
  );

  const [draft, setDraft] = React.useState<GameDraft>(() => {
    if (!fromId) return EMPTY_DRAFT;
    const source = games.find((g) => g.id === fromId && !g.deleted);
    return source ? draftFromGame(source) : EMPTY_DRAFT;
  });

  // Keep form in sync when navigating here with a different ?from= id.
  const [syncedFrom, setSyncedFrom] = React.useState<string | null>(fromId);
  if (fromId !== syncedFrom) {
    setSyncedFrom(fromId);
    if (fromId) {
      const source = games.find((g) => g.id === fromId && !g.deleted);
      if (source) setDraft(draftFromGame(source));
    }
  }

  const patch = <K extends keyof GameDraft>(key: K, value: GameDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const applyTemplate = (source: Game) => {
    setDraft(draftFromGame(source));
    toast.success('Game duplicated', {
      description: `Copied from “${source.title}” (${formatDate(source.date)}). Date set to next week — tweak anything before creating.`,
    });
  };

  const selectedFormatDef = draft.format
    ? formatDefinitions.find((d) => d.id === draft.format)
    : undefined;
  const genderOptions = selectedFormatDef?.allowedGenderModes ?? (['mixed'] as FormatGenderMode[]);

  // Keep gender selection valid for the chosen format.
  if (
    draft.genderRestriction &&
    genderOptions.length > 0 &&
    !genderOptions.includes(draft.genderRestriction)
  ) {
    setDraft((d) => ({
      ...d,
      genderRestriction: selectedFormatDef?.defaultGenderMode ?? genderOptions[0],
    }));
  }

  const venueOptions = React.useMemo(() => {
    const names = activeClubs.map((c) => c.name);
    if (draft.venue && !names.includes(draft.venue)) return [draft.venue, ...names];
    return names;
  }, [activeClubs, draft.venue]);

  const selectedClub = draft.venue
    ? clubs.find((c) => c.name === draft.venue)
    : undefined;

  const valid =
    draft.title.trim() &&
    draft.format &&
    draft.venue &&
    draft.date &&
    draft.startTime &&
    draft.endTime &&
    draft.capacity > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const game = createGame({
      title: draft.title.trim(),
      format: draft.format!,
      venue: draft.venue!,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      courts: draft.courts,
      capacity: draft.capacity,
      level: draft.level ?? 'mixed',
      genderRestriction: draft.genderRestriction ?? undefined,
      price: draft.price ? Number(draft.price) : undefined,
      description: draft.description.trim() || undefined,
      reminderSchedule: [draft.rem24 && '24h', draft.rem2 && '2h'].filter(Boolean) as string[],
    });
    router.push(`/admin/games/${game.id}`);
  };

  const copiedFrom = draft.copiedFromId ? games.find((g) => g.id === draft.copiedFromId) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All games
      </Link>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Create game</CardTitle>
          <CardDescription>
            New games appear immediately under Upcoming and in the player app. Duplicate a previous week&apos;s
            game to keep the same setup and only change what you need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-4">
              <Label className="flex items-center gap-1.5">
                <Copy className="size-3.5 text-primary" /> Duplicate from previous game
              </Label>
              <Select
                value={draft.copiedFromId}
                onValueChange={(id) => {
                  if (!id) return;
                  const source = games.find((g) => g.id === id);
                  if (source) applyTemplate(source);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a past or upcoming game to copy…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title} · {formatDate(g.date)} · {FORMAT_LABELS[g.format]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {copiedFrom && (
                <p className="text-xs text-muted-foreground">
                  Prefilling from “{copiedFrom.title}” ({formatDate(copiedFrom.date)} {copiedFrom.startTime}).
                  Date bumped +7 days — edit any field below before creating.
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Game name *</Label>
                <Input id="title" value={draft.title} onChange={(e) => patch('title', e.target.value)} placeholder="e.g. Tuesday Americano" />
              </div>
              <div className="space-y-2">
                <Label>Format *</Label>
                <Select
                  value={draft.format}
                  onValueChange={(v) => {
                    const fmt = v as GameFormat;
                    const def = formatDefinitions.find((d) => d.id === fmt);
                    setDraft((d) => ({
                      ...d,
                      format: fmt,
                      genderRestriction: def?.defaultGenderMode ?? d.genderRestriction,
                    }));
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select format" /></SelectTrigger>
                  <SelectContent>
                    {activeFormats.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <span className="inline-flex items-center gap-2">
                          <FormatIcon format={f.id} className="size-3.5" />
                          {f.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFormatDef && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFormatDef.entryMode === 'team' ? 'Team entry' : 'Solo entry'}
                    {' · '}
                    {selectedFormatDef.roundMinutes != null
                      ? `${selectedFormatDef.roundCount} × ${selectedFormatDef.roundMinutes} min`
                      : `${selectedFormatDef.roundCount} stages`}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Venue / club *</Label>
                <Select
                  value={draft.venue}
                  onValueChange={(v) => {
                    const club = clubs.find((c) => c.name === v);
                    setDraft((d) => ({
                      ...d,
                      venue: v as string,
                      courts: club?.courtCount ?? d.courts,
                    }));
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select club" /></SelectTrigger>
                  <SelectContent>
                    {venueOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedClub && (
                  <p className="text-xs text-muted-foreground">
                    {selectedClub.courtCount} courts
                    {selectedClub.amenities.length > 0
                      ? ` · ${selectedClub.amenities.slice(0, 3).map((a) => CLUB_AMENITY_LABELS[a]).join(', ')}${selectedClub.amenities.length > 3 ? '…' : ''}`
                      : ''}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={draft.date} onChange={(e) => patch('date', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start">Start *</Label>
                  <Input id="start" type="time" value={draft.startTime} onChange={(e) => patch('startTime', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End *</Label>
                  <Input id="end" type="time" value={draft.endTime} onChange={(e) => patch('endTime', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="courts">Courts</Label>
                  <Input id="courts" type="number" min={1} value={draft.courts} onChange={(e) => patch('courts', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input id="capacity" type="number" min={2} value={draft.capacity} onChange={(e) => patch('capacity', Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={draft.level} onValueChange={(v) => patch('level', v as Game['level'])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['mixed', ...LEVELS] as (Level | 'mixed')[]).map((l) => (
                      <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gender restriction</Label>
                <Select
                  value={draft.genderRestriction}
                  onValueChange={(v) => patch('genderRestriction', v as FormatGenderMode)}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((g) => (
                      <SelectItem key={g} value={g}>
                        {FORMAT_GENDER_LABELS[g] ?? GENDER_RESTRICTION_LABELS[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (AED)</Label>
                <Input id="price" type="number" min={0} value={draft.price} onChange={(e) => patch('price', e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={draft.description} onChange={(e) => patch('description', e.target.value)} placeholder="What players should know…" />
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-muted/60 p-4">
              <p className="text-sm font-semibold">WhatsApp reminders</p>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox checked={draft.rem24} onCheckedChange={(c) => patch('rem24', c === true)} /> Reminder 24h before start
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox checked={draft.rem2} onCheckedChange={(c) => patch('rem2', c === true)} /> Reminder 2h before start
              </label>
              <p className="text-xs text-muted-foreground">
                Players are confirmed as soon as they register. Reminders are sent 1:1 to opted-in players (simulated).
              </p>
            </div>

            <Button type="submit" size="lg" className="h-12 w-full" disabled={!valid}>
              Create game
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
