'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KarmaTierBadge, UserStatusBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { KARMA_TIER_META, KARMA_EVENT_LABELS, formatDateTime } from '@/lib/format';
import type { KarmaTier } from '@/types';

function Bars({ data, unit }: { data: { label: string; value: number; tone?: string }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-0.5 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-mono font-semibold">{d.value}{unit ?? ''}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${d.tone ?? 'bg-primary'}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { users, games, participants, applications, outbound, karmaEvents, duplicates, banRecords, importRecords, offers, activityLogs, phones } = useMockData();
  const [supportQuery, setSupportQuery] = React.useState('');

  const players = users.filter((u) => u.role === 'player');
  const approved = players.filter((u) => u.status === 'approved');
  const completed = games.filter((g) => g.status === 'completed' && !g.deleted);

  // Funnel
  const funnel = [
    { label: 'Landing views (30d)', value: 1240, tone: 'bg-slate-400' },
    { label: 'Applications started', value: 96 },
    { label: 'Applications submitted', value: applications.length + 54 },
    { label: 'Approved', value: applications.filter((a) => a.status === 'approved').length + 38 },
    { label: 'Profiles claimed', value: 31, tone: 'bg-green-500' },
  ];

  // Game ops
  const fillRates = completed.slice(0, 5).map((g) => {
    const roster = participants.filter((p) => p.gameId === g.id && p.status !== 'cancelled').length;
    return { label: g.title, value: Math.min(100, Math.round((roster / g.capacity) * 100)) };
  });
  const noShows = participants.filter((p) => p.attendance === 'no_show').length;
  const lateCancels = karmaEvents.filter((k) => ['late_cancellation', 'very_late_cancellation'].includes(k.eventType)).length;

  // WhatsApp
  const waByStatus = ['sent', 'delivered', 'read', 'failed', 'dropped'].map((s) => ({
    label: s, value: outbound.filter((m) => m.status === s).length,
    tone: s === 'failed' || s === 'dropped' ? 'bg-red-400' : s === 'read' ? 'bg-green-500' : undefined,
  }));
  const estSpend = (outbound.length * 0.012).toFixed(2);

  // Karma
  const tierDist = (['good', 'warning', 'restricted', 'suspended'] as KarmaTier[]).map((t) => ({
    label: KARMA_TIER_META[t].label, value: players.filter((p) => p.karmaTier === t).length,
    tone: t === 'good' ? 'bg-green-500' : t === 'warning' ? 'bg-amber-400' : t === 'restricted' ? 'bg-orange-500' : 'bg-red-500',
  }));

  const supportUser = supportQuery
    ? players.find((u) => u.name.toLowerCase().includes(supportQuery.toLowerCase())
        || phones.some((p) => p.userId === u.id && p.phoneNumber.includes(supportQuery)))
    : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Operational telemetry for admins and support (PRD §21). Mock data, stub dashboards.
        </p>
      </div>

      <Tabs defaultValue="dashboards">
        <TabsList>
          <TabsTrigger value="dashboards">Admin dashboards</TabsTrigger>
          <TabsTrigger value="support">Support diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="pt-3">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="font-heading text-base">Onboarding funnel</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <Bars data={funnel} />
                <p className="mt-2 text-xs text-muted-foreground">Median time-to-decision: 1.8 days</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="font-heading text-base">Growth &amp; activity</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Approved', approved.length], ['Active 30d', Math.round(approved.length * 0.7)], ['Churn risk', 4],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-lg border p-2">
                      <p className="font-heading text-lg font-bold">{v}</p>
                      <p className="text-[10px] text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>
                <Bars data={[
                  { label: 'New members (May)', value: 9 },
                  { label: 'New members (Jun)', value: 14 },
                  { label: 'New members (Jul)', value: 11 },
                ]} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="font-heading text-base">Game operations</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <Bars data={fillRates} unit="%" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Confirm rate', '78%'], ['No-shows', noShows], ['Late cancels', lateCancels],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="rounded-lg border p-2">
                      <p className="font-heading text-lg font-bold">{v}</p>
                      <p className="text-[10px] text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="font-heading text-base">WhatsApp cost &amp; deliverability</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <Bars data={waByStatus} />
                <p className="text-xs text-muted-foreground">
                  Est. spend this month: <strong>${estSpend}</strong> · quality rating: <Badge className="border-none bg-primary/15 text-primary">High</Badge> · tier: 1k/24h
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="font-heading text-base">Karma health</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <Bars data={tierDist} />
                <p className="text-xs text-muted-foreground">{karmaEvents.filter((k) => k.points < 0).length} penalties total · suspension queue resolution: 60% recovery / 40% ban</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="font-heading text-base">Data quality</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <Bars data={[
                  { label: 'Open duplicates', value: duplicates.filter((d) => !d.dismissed && !d.merged).length, tone: 'bg-orange-500' },
                  { label: 'Merges performed', value: 3 },
                  { label: 'Import errors', value: importRecords.filter((r) => r.action === 'error').length, tone: 'bg-red-400' },
                  { label: 'Active bans', value: banRecords.filter((b) => b.action === 'ban').length, tone: 'bg-red-500' },
                  { label: 'Blacklist entries', value: banRecords.length },
                ]} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="font-heading text-base">Offers</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <Bars data={offers.filter((o) => o.status === 'active').map((o) => ({
                  label: o.title.length > 26 ? o.title.slice(0, 26) + '…' : o.title,
                  value: 20 + (o.id.charCodeAt(1) % 40),
                }))} unit=" views" />
                <p className="mt-2 text-xs text-muted-foreground">Promo copy rate: 31% · link CTR: 18% · read rate on WA sends: 74%</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Support per-player diagnostics (PRD §21.4) */}
        <TabsContent value="support" className="space-y-3 pt-3">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Find a player by name or phone… (try 'Igor' or 'Max')" value={supportQuery} onChange={(e) => setSupportQuery(e.target.value)} className="pl-8" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Applications stuck > 48h (3)', 'WA failures error 131026 (1)', 'Karma-blocked this week (3)'].map((s) => (
              <Badge key={s} variant="outline" className="cursor-pointer hover:bg-muted">{s}</Badge>
            ))}
          </div>

          {supportUser ? (
            <Card className="rounded-2xl py-0 shadow-sm">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="flex flex-wrap items-center gap-2 font-heading text-base">
                  {supportUser.name}
                  <UserStatusBadge status={supportUser.status} />
                  <KarmaTierBadge tier={supportUser.karmaTier} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Access diagnostics</p>
                    <p className="mt-1">
                      Login: {supportUser.status === 'banned' ? '❌ denied (banned)' : supportUser.status === 'approved' ? '✅ allowed' : `⚠️ blocked (${supportUser.status})`}
                      <br />Sign-up: {supportUser.karmaTier === 'restricted' || supportUser.karmaTier === 'suspended' ? `❌ blocked by karma (${supportUser.karmaBalance})` : '✅ allowed'}
                      <br />WhatsApp: {supportUser.whatsappOptIn ? '✅ opted in, service window closed' : '❌ opted out — in-app only'}
                    </p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Karma diagnostics</p>
                    <ul className="mt-1 space-y-1">
                      {karmaEvents.filter((k) => k.userId === supportUser.id).slice(0, 3).map((k) => (
                        <li key={k.id} className="text-xs">
                          <span className={`font-mono font-bold ${k.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>{k.points >= 0 ? '+' : ''}{k.points}</span>{' '}
                          {KARMA_EVENT_LABELS[k.eventType]}
                        </li>
                      ))}
                      {karmaEvents.filter((k) => k.userId === supportUser.id).length === 0 && <li className="text-xs text-muted-foreground">No karma events.</li>}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Unified timeline</p>
                  <ul className="space-y-1.5">
                    {[
                      ...activityLogs.filter((a) => a.userId === supportUser.id).map((a) => ({ at: a.createdAt, text: a.summary })),
                      ...outbound.filter((m) => m.userId === supportUser.id).map((m) => ({ at: m.createdAt, text: `WhatsApp ${m.status}: ${m.payload.slice(0, 60)}…` })),
                      ...karmaEvents.filter((k) => k.userId === supportUser.id).map((k) => ({ at: k.createdAt, text: `Karma ${k.points >= 0 ? '+' : ''}${k.points}: ${KARMA_EVENT_LABELS[k.eventType]}` })),
                    ]
                      .sort((a, b) => b.at.localeCompare(a.at))
                      .slice(0, 10)
                      .map((e, i) => (
                        <li key={i} className="flex gap-2 text-xs">
                          <span className="w-28 shrink-0 text-muted-foreground/70">{formatDateTime(e.at)}</span>
                          <span className="text-muted-foreground">{e.text}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Search for a player to see their unified timeline: applications, logins, games, messages, karma and admin actions in one view.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
