'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
import { FORMAT_LABELS, LEVELS, LEVEL_LABELS } from '@/lib/format';
import type { Game, GameFormat, Level } from '@/types';

const VENUES = ['Padel Point, Al Quoz', 'Matcha Club, Al Quoz', 'The Padel Lab, JLT', 'Real Padel Club, Al Barsha', 'ISD Sports City'];

export default function CreateGamePage() {
  const { createGame } = useMockData();
  const router = useRouter();

  const [title, setTitle] = React.useState('');
  const [format, setFormat] = React.useState<GameFormat | null>(null);
  const [venue, setVenue] = React.useState<string | null>(null);
  const [date, setDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('19:00');
  const [endTime, setEndTime] = React.useState('21:00');
  const [courts, setCourts] = React.useState(2);
  const [capacity, setCapacity] = React.useState(8);
  const [level, setLevel] = React.useState<Game['level'] | null>('mixed');
  const [genderRestriction, setGenderRestriction] = React.useState<NonNullable<Game['genderRestriction']> | null>('mixed');
  const [price, setPrice] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [rem24, setRem24] = React.useState(true);
  const [rem2, setRem2] = React.useState(true);
  const [confirmTiming, setConfirmTiming] = React.useState('48h');

  const valid = title.trim() && format && venue && date && startTime && endTime && capacity > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const game = createGame({
      title: title.trim(), format: format!, venue: venue!,
      date, startTime, endTime,
      courts, capacity, level: level ?? 'mixed',
      genderRestriction: genderRestriction ?? undefined,
      price: price ? Number(price) : undefined,
      description: description.trim() || undefined,
      reminderSchedule: [rem24 && '24h', rem2 && '2h'].filter(Boolean) as string[],
      confirmationSchedule: confirmTiming,
    });
    router.push(`/admin/games/${game.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All games
      </Link>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Create game</CardTitle>
          <CardDescription>New games appear immediately under Upcoming and in the player app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Game name *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tuesday Americano" />
              </div>
              <div className="space-y-2">
                <Label>Format *</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as GameFormat)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select format" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FORMAT_LABELS) as GameFormat[]).map((f) => (
                      <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Venue *</Label>
                <Select value={venue} onValueChange={(v) => setVenue(v as string)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select venue" /></SelectTrigger>
                  <SelectContent>
                    {VENUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start">Start *</Label>
                  <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End *</Label>
                  <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="courts">Courts</Label>
                  <Input id="courts" type="number" min={1} value={courts} onChange={(e) => setCourts(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input id="capacity" type="number" min={2} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as Game['level'])}>
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
                <Select value={genderRestriction} onValueChange={(v) => setGenderRestriction(v as NonNullable<Game['genderRestriction']>)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed (no restriction)</SelectItem>
                    <SelectItem value="male">Male only</SelectItem>
                    <SelectItem value="female">Female only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (AED)</Label>
                <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What players should know…" />
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-muted/60 p-4">
              <p className="text-sm font-semibold">WhatsApp options</p>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox checked={rem24} onCheckedChange={(c) => setRem24(c === true)} /> Reminder 24h before start
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox checked={rem2} onCheckedChange={(c) => setRem2(c === true)} /> Reminder 2h before start
              </label>
              <div className="flex items-center gap-3">
                <Label className="shrink-0 text-sm font-normal">Confirmation request</Label>
                <Select value={confirmTiming} onValueChange={(v) => setConfirmTiming(v as string)}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_add">Immediately when added</SelectItem>
                    <SelectItem value="72h">72h before start</SelectItem>
                    <SelectItem value="48h">48h before start</SelectItem>
                    <SelectItem value="24h">24h before start</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Utility templates, sent 1:1 to opted-in registered players. No real messages are sent in this prototype.
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
