'use client';

import * as React from 'react';
import { Gauge, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KarmaTierBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { KARMA_EVENT_LABELS, formatDateTime } from '@/lib/format';
import type { KarmaTier } from '@/types';

const TIERS: KarmaTier[] = ['good', 'warning', 'restricted', 'suspended'];

export default function KarmaPage() {
  const { users, karmaEvents, banPlayer, addKarmaEvent } = useMockData();
  const players = users.filter((u) => u.role === 'player' && u.status !== 'banned');
  const byTier = TIERS.map((t) => ({ tier: t, players: players.filter((p) => p.karmaTier === t) }));
  const recentPenalties = karmaEvents
    .filter((k) => k.points < 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  const suspensionQueue = players.filter((p) => p.karmaTier === 'suspended');

  const [decay, setDecay] = React.useState(false);
  const [multiplier, setMultiplier] = React.useState(true);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Karma</h1>
        <p className="text-sm text-muted-foreground">
          Behavioral score, separate from the sport rating. Config values here are editable but non-binding in this prototype.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queue">Suspension queue ({suspensionQueue.length})</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {byTier.map(({ tier, players: p }) => (
              <Card key={tier} className="rounded-2xl py-0 shadow-sm">
                <CardContent className="p-4">
                  <KarmaTierBadge tier={tier} />
                  <p className="mt-2 font-heading text-3xl font-bold">{p.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {tier === 'good' ? '50–100' : tier === 'warning' ? '20–49' : tier === 'restricted' ? '1–19' : '≤ 0'} karma
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-0"><CardTitle className="font-heading text-base">Recent penalties</CardTitle></CardHeader>
              <CardContent className="divide-y p-4 pt-1">
                {recentPenalties.map((k) => {
                  const u = users.find((x) => x.id === k.userId);
                  return (
                    <div key={k.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u?.name ?? k.userId}</p>
                        <p className="text-xs text-muted-foreground">{KARMA_EVENT_LABELS[k.eventType]} · {formatDateTime(k.createdAt)}</p>
                      </div>
                      <span className="font-mono font-bold text-red-600">{k.points}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-0"><CardTitle className="font-heading text-base">Watchlist (warning &amp; below)</CardTitle></CardHeader>
              <CardContent className="divide-y p-4 pt-1">
                {players.filter((p) => p.karmaTier !== 'good').sort((a, b) => a.karmaBalance - b.karmaBalance).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono font-bold">{p.karmaBalance}</span>
                      <KarmaTierBadge tier={p.karmaTier} />
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-3 pt-3">
          {suspensionQueue.length === 0 && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No players awaiting suspension review.
            </div>
          )}
          {suspensionQueue.map((p) => (
            <Card key={p.id} className="rounded-2xl py-0 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      <ShieldAlert className="size-4 text-red-600" /> {p.name}
                      <Badge className="border-none bg-red-500/15 text-red-300">balance {p.karmaBalance}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sign-up automatically suspended. Decide: recovery plan or ban (PRD §16.16).
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addKarmaEvent(p.id, 'manual_correction', 25, 'recovery_plan', 'Recovery plan agreed with player')}>
                      Recovery plan (+25)
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => banPlayer(p.id, 'conduct', 'Suspension review outcome: ban')}>
                      Ban
                    </Button>
                  </div>
                </div>
                <ul className="space-y-1">
                  {karmaEvents.filter((k) => k.userId === p.id).slice(0, 4).map((k) => (
                    <li key={k.id} className="flex items-baseline gap-2 text-xs text-muted-foreground">
                      <span className={`w-8 shrink-0 text-right font-mono font-bold ${k.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>{k.points >= 0 ? '+' : ''}{k.points}</span>
                      {KARMA_EVENT_LABELS[k.eventType]}{k.note ? ` — ${k.note}` : ''}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="config" className="pt-3">
          <Card className="max-w-2xl rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <Gauge className="size-4 text-primary" /> Point values &amp; thresholds (PRD §14 defaults)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['On-time game', '+2'], ['Punctuality streak (5 games)', '+5'],
                  ['Late cancellation (<24h)', '-15'], ['Very late cancellation (<4h)', '-25'],
                  ['No-show', '-30'], ['Late arrival', '-5'],
                  ['Non-payment', '-20'], ['Minor misconduct', '-10'], ['Major misconduct', '-30'],
                ].map(([label, v]) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-normal">{label}</Label>
                    <Input defaultValue={v} className="h-8 w-20 text-right font-mono" />
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-semibold">Tiers</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TIERS.map((t) => (
                    <div key={t} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                      <KarmaTierBadge tier={t} />
                      <span className="font-mono text-xs text-muted-foreground">
                        {t === 'good' ? '50–100' : t === 'warning' ? '20–49' : t === 'restricted' ? '1–19' : '≤ 0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Repeated offense multiplier (×1.5)</p>
                    <p className="text-xs text-muted-foreground">Second identical offense within 60 days.</p>
                  </div>
                  <Switch checked={multiplier} onCheckedChange={(c) => setMultiplier(c === true)} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Penalty decay (6 months)</p>
                    <p className="text-xs text-muted-foreground">Expired penalties restore their points. Default off.</p>
                  </div>
                  <Switch checked={decay} onCheckedChange={(c) => setDecay(c === true)} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm font-normal">Payment deadline (non-payment penalty)</Label>
                  <Input defaultValue="48h" className="h-8 w-20 text-right font-mono" />
                </div>
              </div>
              <Button className="w-full" onClick={() => toast.success('Karma configuration saved (simulated)', { description: 'Values are non-binding in this prototype.' })}>
                <Save className="size-4" /> Save configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
