'use client';

import * as React from 'react';
import {
  Search, Ban, Undo2, GitMerge, Upload, Phone, History, Star, Trophy, ShieldAlert, FileUp, Check, BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { KarmaTierBadge, UserStatusBadge, VerifiedBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import {
  LEVEL_LABELS, LEVELS, KARMA_EVENT_LABELS, USER_STATUS_LABELS, formatDateTime, formatDate, initials,
} from '@/lib/format';
import type { Level, User, UserStatus } from '@/types';

export default function PlayersPage() {
  const {
    users, phones, participants, games, karmaEvents, activityLogs, banRecords,
    ratingAdjustments, mergeLogs, duplicates, importBatches, importRecords,
    banPlayer, unbanPlayer, mergeDuplicate, dismissDuplicate, addKarmaEvent, setLevelVerified, setPlayerLevel,
  } = useMockData();

  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'all'>('all');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [banTarget, setBanTarget] = React.useState<User | null>(null);
  const [banReason, setBanReason] = React.useState<string | null>('conduct');
  const [banNote, setBanNote] = React.useState('');
  const [importStep, setImportStep] = React.useState(0);

  const selected = users.find((u) => u.id === selectedId) ?? null;

  const players = users
    .filter((u) => u.role === 'player')
    .filter((u) => statusFilter === 'all' || u.status === statusFilter)
    .filter((u) => {
      const q = query.toLowerCase();
      if (!q) return true;
      const userPhones = phones.filter((p) => p.userId === u.id).map((p) => p.phoneNumber).join(' ');
      return u.name.toLowerCase().includes(q) || userPhones.includes(q) || u.level.includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const openDuplicates = duplicates.filter((d) => !d.dismissed && !d.merged);

  const confirmBan = () => {
    if (!banTarget || !banReason) return;
    banPlayer(banTarget.id, banReason, banNote.trim());
    setBanTarget(null); setBanNote('');
  };

  const runImport = () => {
    setImportStep(0);
    toast.success('Import batch committed (simulated)', {
      description: '18 rows: 14 created as shell profiles, 2 updated, 1 skipped (existing phone), 1 error.',
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Players</h1>
        <p className="text-sm text-muted-foreground">
          Directory, duplicates queue, imports and bans. Merge/import tools are simulated in this prototype.
        </p>
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory ({users.filter((u) => u.role === 'player').length})</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates ({openDuplicates.length})</TabsTrigger>
          <TabsTrigger value="imports">Imports</TabsTrigger>
          <TabsTrigger value="bans">Bans</TabsTrigger>
        </TabsList>

        {/* Directory */}
        <TabsContent value="directory" className="space-y-3 pt-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-52 flex-1">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name, any phone, level…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | 'all')}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(USER_STATUS_LABELS) as UserStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{USER_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="divide-y p-0">
              {players.map((u) => {
                const primary = phones.find((p) => p.userId === u.id && p.isPrimary);
                return (
                  <button key={u.id} onClick={() => setSelectedId(u.id)} className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/50">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <span className="truncate">{primary?.phoneNumber ?? 'no phone'} · {LEVEL_LABELS[u.level]}</span>
                        {u.levelVerified && <VerifiedBadge className="size-3.5" />}
                        <span className="shrink-0">· {u.points} pts</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="hidden sm:block"><KarmaTierBadge tier={u.karmaTier} /></span>
                      <UserStatusBadge status={u.status} />
                    </div>
                  </button>
                );
              })}
              {players.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No players match.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duplicates queue */}
        <TabsContent value="duplicates" className="space-y-3 pt-3">
          {openDuplicates.length === 0 && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No open duplicate candidates. 🎉
            </div>
          )}
          {openDuplicates.map((d) => {
            const a = users.find((u) => u.id === d.userIdA);
            const b = users.find((u) => u.id === d.userIdB);
            if (!a || !b) return null;
            return (
              <Card key={d.id} className="rounded-2xl py-0 shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge className={`border-none ${d.confidence === 'high' ? 'bg-red-500/15 text-red-300' : d.confidence === 'medium' ? 'bg-amber-500/15 text-amber-300' : 'bg-white/10 text-white/60'}`}>
                      {d.confidence} confidence
                    </Badge>
                    <p className="text-xs text-muted-foreground">{d.reason}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[a, b].map((u) => (
                      <div key={u.id} className="rounded-xl border p-3">
                        <p className="flex items-center gap-2 text-sm font-semibold">{u.name} <UserStatusBadge status={u.status} /></p>
                        <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between"><dt>Phone</dt><dd className="font-mono">{phones.find((p) => p.userId === u.id)?.phoneNumber ?? '—'}</dd></div>
                          <div className="flex justify-between"><dt>Level</dt><dd>{LEVEL_LABELS[u.level]}</dd></div>
                          <div className="flex justify-between"><dt>Points</dt><dd>{u.points}</dd></div>
                          <div className="flex justify-between"><dt>Games</dt><dd>{participants.filter((p) => p.userId === u.id).length}</dd></div>
                          <div className="flex justify-between"><dt>Source</dt><dd className="capitalize">{u.source}</dd></div>
                        </dl>
                        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => mergeDuplicate(d.id, u.id)}>
                          <GitMerge className="size-3.5" /> Keep this profile
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => dismissDuplicate(d.id)}>
                    Not a duplicate
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Imports */}
        <TabsContent value="imports" className="space-y-3 pt-3">
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between p-4 pb-0">
              <CardTitle className="font-heading text-base">Import wizard (simulated)</CardTitle>
              {importStep === 0 && (
                <Button size="sm" onClick={() => setImportStep(1)}><Upload className="size-3.5" /> New import</Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {importStep === 0 && (
                <p className="text-sm text-muted-foreground">
                  Upload → map columns → validate → preview → run. Imported players become shell profiles
                  that can be added to games before they claim their account.
                </p>
              )}
              {importStep > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {['Upload', 'Map columns', 'Validate', 'Preview', 'Run'].map((s, i) => (
                      <React.Fragment key={s}>
                        <span className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium ${i < importStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {i < importStep - 1 && <Check className="size-3" />}{s}
                        </span>
                        {i < 4 && <span className="h-px w-2 bg-border" />}
                      </React.Fragment>
                    ))}
                  </div>
                  {importStep === 1 && (
                    <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:bg-muted/50">
                      <FileUp className="size-6" /> Drop CSV / XLSX / Google Sheets export
                      <input type="file" className="sr-only" onChange={() => setImportStep(2)} />
                      <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); setImportStep(2); }}>Use sample file</Button>
                    </label>
                  )}
                  {importStep === 2 && (
                    <div className="space-y-2 text-sm">
                      {[['Column A — "Name"', 'name'], ['Column B — "WhatsApp"', 'phoneNumber (E.164, default +971)'], ['Column C — "Level"', 'level (E–A+ letter ladder)'], ['Column D — "Points 2026"', 'points (carried-over rating)']].map(([from, to]) => (
                        <div key={from} className="flex items-center justify-between rounded-lg border px-3 py-2">
                          <span className="text-muted-foreground">{from}</span>
                          <span className="font-medium">→ {to}</span>
                        </div>
                      ))}
                      <Button size="sm" onClick={() => setImportStep(3)}>Validate</Button>
                    </div>
                  )}
                  {importStep === 3 && (
                    <div className="space-y-2 text-sm">
                      <p>✅ 16 rows valid · ⚠️ 1 duplicate within file · ❌ 1 phone not parseable</p>
                      <Button size="sm" onClick={() => setImportStep(4)}>Show dry-run preview</Button>
                    </div>
                  )}
                  {importStep === 4 && (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[['14', 'create'], ['2', 'update'], ['1', 'skip'], ['1', 'error']].map(([n, l]) => (
                          <div key={l} className="rounded-lg border p-2">
                            <p className="font-heading text-lg font-bold">{n}</p>
                            <p className="text-xs text-muted-foreground capitalize">{l}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={runImport}>Commit batch</Button>
                        <Button size="sm" variant="outline" onClick={() => setImportStep(0)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-4 pb-0"><CardTitle className="font-heading text-base">Batch history</CardTitle></CardHeader>
            <CardContent className="divide-y p-4 pt-1">
              {importBatches.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{b.fileName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {b.sourceType.replace(/_/g, ' ')} · {formatDateTime(b.createdAt)} ·{' '}
                      {importRecords.filter((r) => r.importBatchId === b.id).length || 18} rows
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border-none capitalize ${b.status === 'committed' ? 'bg-primary/15 text-primary' : 'bg-white/10 text-white/60'}`}>
                      {b.status.replace('_', ' ')}
                    </Badge>
                    {b.status === 'committed' && (
                      <Button variant="ghost" size="sm" onClick={() => toast('Rollback simulated', { description: 'Unclaimed shell profiles from this batch would be removed.' })}>
                        <Undo2 className="size-3.5" /> Rollback
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bans */}
        <TabsContent value="bans" className="space-y-3 pt-3">
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between p-4 pb-0">
              <CardTitle className="font-heading text-base">Blacklist &amp; ban audit</CardTitle>
              <Button
                size="sm" variant="outline"
                onClick={() => toast('Raw number blacklisted (simulated)', { description: '+971 5X XXX XXXX added to blacklist with reason "other".' })}
              >
                <ShieldAlert className="size-3.5" /> Blacklist raw number
              </Button>
            </CardHeader>
            <CardContent className="divide-y p-4 pt-1">
              {banRecords.map((br) => {
                const u = br.userId ? users.find((x) => x.id === br.userId) : undefined;
                return (
                  <div key={br.id} className="py-3">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <Badge className={`border-none capitalize ${br.action === 'ban' ? 'bg-red-500/15 text-red-300' : br.action === 'unban' ? 'bg-primary/15 text-primary' : 'bg-white/10 text-white/60'}`}>
                        {br.action.replace(/_/g, ' ')}
                      </Badge>
                      {u?.name ?? br.phoneNumbers.join(', ')}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Reason: {br.reasonCode.replace(/_/g, ' ')}{br.note ? ` — ${br.note}` : ''} · {formatDateTime(br.createdAt)} · by admin
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Player card */}
      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="p-0">
                <SheetTitle className="flex flex-wrap items-center gap-2 font-heading text-lg">
                  {selected.name} <UserStatusBadge status={selected.status} />
                </SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1">
                  {LEVEL_LABELS[selected.level]}
                  {selected.levelVerified && <VerifiedBadge className="size-3.5" />}
                  <span>· {selected.points} pts · member since {selected.memberSince ? formatDate(selected.memberSince) : '—'} · source: {selected.source}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5">
                {/* Karma panel */}
                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Star className="size-3.5 text-amber-500" /> Karma</h3>
                  <div className="flex items-center justify-between rounded-xl border p-3">
                    <span className="font-heading text-2xl font-bold">{selected.karmaBalance}</span>
                    <KarmaTierBadge tier={selected.karmaTier} />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => addKarmaEvent(selected.id, 'conduct_award', 5, 'fair_play', 'Manual admin award')}>
                      +5 Award
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => addKarmaEvent(selected.id, 'misconduct_minor', -10, 'arguing', 'Manual admin penalty')}>
                      −10 Penalize
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {karmaEvents.filter((k) => k.userId === selected.id).slice(0, 5).map((k) => (
                      <li key={k.id} className="flex items-baseline gap-2 text-xs">
                        <span className={`w-8 shrink-0 text-right font-mono font-bold ${k.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {k.points >= 0 ? '+' : ''}{k.points}
                        </span>
                        <span className="text-muted-foreground">{KARMA_EVENT_LABELS[k.eventType]} · {formatDateTime(k.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Phones & consents */}
                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Phone className="size-3.5 text-primary" /> Linked numbers &amp; consents</h3>
                  <div className="space-y-1.5">
                    {phones.filter((p) => p.userId === selected.id).map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span className="font-mono">{p.phoneNumber}</span>
                        <span className="flex items-center gap-1.5">
                          {p.isPrimary && <Badge variant="secondary">Primary</Badge>}
                          <Badge variant="outline" className="capitalize">{p.source}</Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Service messages: {selected.whatsappOptIn ? '✅ opted in' : '❌ opted out'} · Marketing: {selected.whatsappMarketingOptIn ? '✅ opted in' : '❌ opted out'}
                  </p>
                </section>

                {/* Game history */}
                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Trophy className="size-3.5 text-primary" /> Game history</h3>
                  <ul className="space-y-1.5 text-sm">
                    {participants.filter((p) => p.userId === selected.id).slice(0, 6).map((p) => {
                      const g = games.find((x) => x.id === p.gameId);
                      return g ? (
                        <li key={p.id} className="flex items-center justify-between text-xs">
                          <span className="truncate">{g.title} · {formatDate(g.date)}</span>
                          <span className="ml-2 shrink-0 text-muted-foreground capitalize">{p.status}{p.position ? ` · #${p.position}` : ''}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </section>

                {/* Activity + audit */}
                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><History className="size-3.5 text-primary" /> Activity &amp; audit</h3>
                  <ul className="space-y-1.5">
                    {activityLogs.filter((a) => a.userId === selected.id).map((a) => (
                      <li key={a.id} className="text-xs text-muted-foreground">
                        {formatDateTime(a.createdAt)} — {a.summary}
                      </li>
                    ))}
                    {ratingAdjustments.filter((r) => r.userId === selected.id).map((r) => (
                      <li key={r.id} className="text-xs text-muted-foreground">
                        {formatDateTime(r.createdAt)} — Rating {r.pointsBefore} → {r.pointsAfter} ({r.reasonCode.replace(/_/g, ' ')})
                      </li>
                    ))}
                    {mergeLogs.filter((m) => m.survivorUserId === selected.id).map((m) => (
                      <li key={m.id} className="text-xs text-muted-foreground">
                        {formatDateTime(m.performedAt)} — Merged in profile {m.absorbedUserId} ({m.movedData})
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Level */}
                <section className="border-t pt-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <BadgeCheck className="size-3.5 text-blue-500" /> Level
                  </h3>
                  <div className="space-y-3 rounded-xl border p-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="player-level">Playing level</Label>
                      <Select
                        value={selected.level}
                        onValueChange={(v) => {
                          if (v && v !== selected.level) setPlayerLevel(selected.id, v as Level);
                        }}
                      >
                        <SelectTrigger id="player-level" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map((lvl) => (
                            <SelectItem key={lvl} value={lvl}>
                              {LEVEL_LABELS[lvl]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Changing level clears verification — re-verify once the new level has been assessed.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                      <div className="text-sm">
                        {selected.levelVerified ? (
                          <p className="flex items-center gap-1.5 font-medium">
                            Level {selected.level} verified <VerifiedBadge />
                          </p>
                        ) : (
                          <p className="font-medium">Level {selected.level} — not verified</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {selected.levelVerified
                            ? `Verified ${selected.levelVerifiedAt ? formatDateTime(selected.levelVerifiedAt) : ''} by Padel Nomads`
                            : 'The blue verified badge confirms this level was assessed by Padel Nomads.'}
                        </p>
                      </div>
                      {selected.levelVerified ? (
                        <Button size="sm" variant="outline" onClick={() => setLevelVerified(selected.id, false)}>
                          Remove verification
                        </Button>
                      ) : (
                        <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600" onClick={() => setLevelVerified(selected.id, true)}>
                          <BadgeCheck className="size-3.5" /> Verify level
                        </Button>
                      )}
                    </div>
                  </div>
                </section>

                {/* Ban controls */}
                <section className="border-t pt-4">
                  {selected.status === 'banned' ? (
                    <Button variant="outline" className="w-full" onClick={() => { unbanPlayer(selected.id, 'Ban lifted after review'); }}>
                      <Undo2 className="size-4" /> Unban player
                    </Button>
                  ) : (
                    <Button variant="destructive" className="w-full" onClick={() => setBanTarget(selected)}>
                      <Ban className="size-4" /> Ban player
                    </Button>
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Ban dialog */}
      <Dialog open={banTarget !== null} onOpenChange={(o) => !o && setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban {banTarget?.name}?</DialogTitle>
            <DialogDescription>
              All linked phone numbers and email go to the blacklist. The player can&apos;t log in, be added to
              games, or reapply unnoticed. History is preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Reason code (mandatory)</Label>
              <Select value={banReason} onValueChange={(v) => setBanReason(v as string)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conduct">Conduct</SelectItem>
                  <SelectItem value="no_shows">Repeated no-shows</SelectItem>
                  <SelectItem value="payment">Payment issues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea value={banNote} onChange={(e) => setBanNote(e.target.value)} placeholder="Context for the audit trail" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!banReason} onClick={confirmBan}>
              <Ban className="size-4" /> Ban &amp; blacklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
