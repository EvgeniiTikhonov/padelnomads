'use client';

import * as React from 'react';
import {
  Pencil, Users, User, Clock, Trophy, ArrowUpDown, Shuffle, LayoutGrid, Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useMockData } from '@/data/provider';
import {
  COMPETITION_STRUCTURE_HINTS,
  COMPETITION_STRUCTURE_LABELS,
  ENTRY_MODE_LABELS,
  FORMAT_GENDER_LABELS,
  POINT_RULE_LABELS,
  type CompetitionStructure,
  type FormatDefinition,
  type FormatEntryMode,
  type FormatGenderMode,
  type PointRuleKind,
} from '@/lib/gameFormats';
import { formatDateTime } from '@/lib/format';
import { FormatIcon, FormatBadge } from '@/components/format-icon';

const ALL_GENDER_MODES: FormatGenderMode[] = ['male', 'female', 'mixed', 'mixed_pairs'];

const STRUCTURE_ICON: Record<CompetitionStructure, React.ReactNode> = {
  social: <Shuffle className="size-3.5" />,
  court_movement: <ArrowUpDown className="size-3.5" />,
  tournament: <LayoutGrid className="size-3.5" />,
};

export default function AdminFormatsPage() {
  const { formatDefinitions, updateFormatDefinition } = useMockData();
  const [editingId, setEditingId] = React.useState<FormatDefinition['id'] | null>(null);
  const editing = formatDefinitions.find((d) => d.id === editingId) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Game formats</h1>
        <p className="text-sm text-muted-foreground">
          Configure how each format runs — solo vs team, gender rules, round length, scoring, and session structure.
        </p>
      </div>

      <div className="space-y-3">
        {formatDefinitions.map((def) => (
          <Card key={def.id} className={`rounded-2xl py-0 shadow-sm ${!def.active ? 'opacity-60' : ''}`}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted">
                    <FormatIcon format={def.id} className="size-4 text-primary" />
                  </span>
                  <p className="font-heading text-base font-semibold">{def.name}</p>
                  {!def.active && <Badge variant="outline">Inactive</Badge>}
                  <FormatBadge format={def.id} className="hidden sm:inline-flex" />
                  <Badge variant="secondary" className="gap-1">
                    {def.entryMode === 'team' ? <Users className="size-3" /> : <User className="size-3" />}
                    {ENTRY_MODE_LABELS[def.entryMode]}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {STRUCTURE_ICON[def.competitionStructure]}
                    {COMPETITION_STRUCTURE_LABELS[def.competitionStructure].split(' (')[0]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{def.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {def.allowedGenderModes.map((g) => (
                    <Badge key={g} variant="outline" className="text-[10px]">
                      {FORMAT_GENDER_LABELS[g]}
                      {g === def.defaultGenderMode && ' · default'}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {def.roundMinutes != null
                      ? `${def.roundCount} × ${def.roundMinutes} min`
                      : `${def.roundCount} stages · variable length`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="size-3" />
                    {POINT_RULE_LABELS[def.pointRule]}
                  </span>
                  <span className="capitalize">{def.rankingBasis} ranking</span>
                </div>
                {def.pointsSystem && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Points: </span>
                    {def.pointsSystem}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditingId(def.id)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <FormatEditor
        open={editing !== null}
        definition={editing}
        onClose={() => setEditingId(null)}
        onSave={(patch) => {
          if (!editing) return;
          updateFormatDefinition(editing.id, patch);
          setEditingId(null);
        }}
      />
    </div>
  );
}

function FormatEditor({
  open, definition, onClose, onSave,
}: {
  open: boolean;
  definition: FormatDefinition | null;
  onClose: () => void;
  onSave: (patch: Partial<FormatDefinition>) => void;
}) {
  const [draft, setDraft] = React.useState<FormatDefinition | null>(null);
  const [draftForId, setDraftForId] = React.useState<FormatDefinition['id'] | null>(null);

  if (definition && definition.id !== draftForId) {
    setDraftForId(definition.id);
    setDraft({
      ...definition,
      allowedGenderModes: [...definition.allowedGenderModes],
      boostedRounds: [...definition.boostedRounds],
      notes: [...definition.notes],
    });
  }
  if (!definition && draftForId !== null) {
    setDraftForId(null);
    setDraft(null);
  }

  if (!draft) return null;

  const patch = <K extends keyof FormatDefinition>(key: K, value: FormatDefinition[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const toggleGender = (mode: FormatGenderMode) => {
    setDraft((d) => {
      if (!d) return d;
      const has = d.allowedGenderModes.includes(mode);
      let allowed = has
        ? d.allowedGenderModes.filter((m) => m !== mode)
        : [...d.allowedGenderModes, mode];
      if (allowed.length === 0) allowed = [mode];
      const defaultGenderMode = allowed.includes(d.defaultGenderMode) ? d.defaultGenderMode : allowed[0];
      return { ...d, allowedGenderModes: allowed, defaultGenderMode };
    });
  };

  const toggleBoostedRound = (round: number) => {
    setDraft((d) => {
      if (!d) return d;
      const has = d.boostedRounds.includes(round);
      return {
        ...d,
        boostedRounds: has
          ? d.boostedRounds.filter((r) => r !== round)
          : [...d.boostedRounds, round].sort((a, b) => a - b),
      };
    });
  };

  const valid =
    draft.name.trim() &&
    draft.allowedGenderModes.length > 0 &&
    draft.roundCount >= 1 &&
    (draft.roundMinutes == null || draft.roundMinutes > 0);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-lg">
        <SheetHeader className="p-0">
          <SheetTitle className="font-heading text-lg">Edit {draft.name}</SheetTitle>
          <SheetDescription>
            Updated {formatDateTime(draft.updatedAt)}. Changes apply to scoring guidance and new games.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fmt-name">Display name</Label>
            <Input id="fmt-name" value={draft.name} onChange={(e) => patch('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fmt-desc">Description</Label>
            <Textarea id="fmt-desc" value={draft.description} onChange={(e) => patch('description', e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive formats are hidden when creating games.</p>
            </div>
            <Switch checked={draft.active} onCheckedChange={(c) => patch('active', c === true)} />
          </div>

          {/* Solo / team */}
          <section className="space-y-2">
            <Label>Entry mode</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['solo', 'team'] as FormatEntryMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    patch('entryMode', mode);
                    if (mode === 'solo') {
                      patch('changePartners', true);
                      patch('rankingBasis', 'individual');
                      if (draft.competitionStructure === 'court_movement') {
                        patch('competitionStructure', 'social');
                      }
                    } else {
                      patch('changePartners', false);
                      patch('rankingBasis', 'team');
                    }
                  }}
                  className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                    draft.entryMode === mode ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {mode === 'team' ? <Users className="size-3.5" /> : <User className="size-3.5" />}
                    {ENTRY_MODE_LABELS[mode]}
                    {draft.entryMode === mode && <Check className="ml-auto size-3.5 text-primary" />}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {mode === 'team' ? 'Players register as fixed pairs.' : 'Players enter alone; partners may rotate.'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Gender */}
          <section className="space-y-2">
            <Label>Allowed gender modes</Label>
            <p className="text-xs text-muted-foreground">
              Choose which options appear when creating a game. Mark one as the default.
            </p>
            <div className="space-y-2">
              {ALL_GENDER_MODES.map((mode) => {
                const allowed = draft.allowedGenderModes.includes(mode);
                const isDefault = draft.defaultGenderMode === mode;
                return (
                  <div key={mode} className="flex items-center gap-3 rounded-xl border px-3 py-2">
                    <Checkbox checked={allowed} onCheckedChange={() => toggleGender(mode)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{FORMAT_GENDER_LABELS[mode]}</p>
                      {mode === 'mixed_pairs' && (
                        <p className="text-[11px] text-muted-foreground">Every team must be one man + one woman.</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isDefault ? 'default' : 'outline'}
                      disabled={!allowed}
                      onClick={() => patch('defaultGenderMode', mode)}
                    >
                      {isDefault ? 'Default' : 'Set default'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timing */}
          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fmt-warmup">Warm-up (min)</Label>
              <Input
                id="fmt-warmup"
                type="number"
                min={0}
                value={draft.warmupMinutes}
                onChange={(e) => patch('warmupMinutes', Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fmt-rounds">Number of rounds / stages</Label>
              <Input
                id="fmt-rounds"
                type="number"
                min={1}
                max={12}
                value={draft.roundCount}
                onChange={(e) => patch('roundCount', Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="fmt-round-min">Minutes per round</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="fmt-round-min"
                  type="number"
                  min={1}
                  disabled={draft.roundMinutes == null}
                  value={draft.roundMinutes ?? ''}
                  placeholder="Variable"
                  onChange={(e) => patch('roundMinutes', e.target.value === '' ? null : Math.max(1, Number(e.target.value) || 1))}
                  className="flex-1"
                />
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <Checkbox
                    checked={draft.roundMinutes == null}
                    onCheckedChange={(c) => patch('roundMinutes', c === true ? null : 15)}
                  />
                  Variable length
                </label>
              </div>
            </div>
          </section>

          {/* Point rule */}
          <section className="space-y-2">
            <Label>Point rule</Label>
            <Select value={draft.pointRule} onValueChange={(v) => patch('pointRule', v as PointRuleKind)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(POINT_RULE_LABELS) as PointRuleKind[]).map((k) => (
                  <SelectItem key={k} value={k}>{POINT_RULE_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {/* Points system */}
          <section className="space-y-2">
            <Label htmlFor="fmt-points">Points counting system</Label>
            <Textarea
              id="fmt-points"
              value={draft.pointsSystem}
              onChange={(e) => patch('pointsSystem', e.target.value)}
              rows={3}
              placeholder="e.g. Rounds 4 & 5 — Central Court & Court 2 → 3 pts…"
            />
            {draft.roundCount > 0 && draft.competitionStructure !== 'tournament' && (
              <div className="space-y-1.5 rounded-xl border p-3">
                <p className="text-xs font-medium">Boosted rounds</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: draft.roundCount }, (_, i) => i + 1).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={draft.boostedRounds.includes(r)}
                        onCheckedChange={() => toggleBoostedRound(r)}
                      />
                      R{r}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fmt-streak">Streak bonus from round (optional)</Label>
              <Input
                id="fmt-streak"
                type="number"
                min={1}
                placeholder="None"
                value={draft.streakBonusFromRound ?? ''}
                onChange={(e) =>
                  patch('streakBonusFromRound', e.target.value === '' ? null : Math.max(1, Number(e.target.value) || 1))
                }
              />
              <p className="text-xs text-muted-foreground">
                From this round, two consecutive wins earn +1 bonus. Leave empty for no streak bonus.
              </p>
            </div>
          </section>

          {/* Competition structure */}
          <section className="space-y-2">
            <Label>Session structure</Label>
            <div className="space-y-2">
              {(Object.keys(COMPETITION_STRUCTURE_LABELS) as CompetitionStructure[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    patch('competitionStructure', s);
                    if (s === 'social') {
                      patch('changePartners', true);
                      patch('rankingBasis', 'individual');
                      patch('entryMode', 'solo');
                    } else if (s === 'court_movement') {
                      patch('changePartners', false);
                    } else if (s === 'tournament') {
                      patch('changePartners', false);
                      patch('entryMode', 'team');
                      patch('rankingBasis', 'team');
                      patch('roundMinutes', null);
                      patch('boostedRounds', []);
                      patch('streakBonusFromRound', null);
                    }
                  }}
                  className={`flex w-full gap-3 rounded-xl border p-3 text-left transition-colors ${
                    draft.competitionStructure === s ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <span className="mt-0.5 text-primary">{STRUCTURE_ICON[s]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {COMPETITION_STRUCTURE_LABELS[s]}
                      {draft.competitionStructure === s && <Check className="size-3.5 text-primary" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {COMPETITION_STRUCTURE_HINTS[s]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">Change partners each round</p>
              <p className="text-xs text-muted-foreground">Typical for social shuffle; off for fixed pairs.</p>
            </div>
            <Switch checked={draft.changePartners} onCheckedChange={(c) => patch('changePartners', c === true)} />
          </div>

          <div className="space-y-2">
            <Label>Ranking basis</Label>
            <Select
              value={draft.rankingBasis}
              onValueChange={(v) => patch('rankingBasis', v as FormatDefinition['rankingBasis'])}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fmt-notes">Notes (one per line)</Label>
            <Textarea
              id="fmt-notes"
              value={draft.notes.join('\n')}
              onChange={(e) =>
                patch(
                  'notes',
                  e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                )
              }
              rows={3}
            />
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={!valid}
            onClick={() => {
              const { id, updatedAt, ...rest } = draft;
              void id;
              void updatedAt;
              onSave(rest);
            }}
          >
            Save format
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
