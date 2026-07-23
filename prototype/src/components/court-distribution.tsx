'use client';

import * as React from 'react';
import {
  Sparkles, RefreshCw, ArrowUp, ArrowDown, MessageCircle, Copy, Check,
  Lock, Pencil, Trophy, ArrowLeftRight, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { VerifiedBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { LEVEL_LABELS } from '@/lib/format';
import { buildDistributionMessage, courtLabel, groupByCourt } from '@/lib/allocation';
import type { Game, User } from '@/types';

interface Selection { t: number; p: number }

export function CourtDistribution({ game }: { game: Game }) {
  const {
    participants, users, teams,
    prepareDistribution, saveDistribution, finalizeDistribution, reopenDistribution,
  } = useMockData();

  const userFor = React.useCallback((id: string) => users.find((u) => u.id === id), [users]);

  // Stored distribution (source of truth) = this game's teams ordered by court.
  const stored = React.useMemo(
    () =>
      teams
        .filter((t) => t.gameId === game.id)
        .sort((a, b) => a.court - b.court)
        .map((t) => t.playerIds),
    [teams, game.id],
  );
  const storedSig = JSON.stringify(stored);

  const prepared = Boolean(game.distributionPreparedAt) && stored.length > 0;
  const finalized = Boolean(game.distributionFinalizedAt);

  const [ordered, setOrdered] = React.useState<string[][]>(stored);
  const [swapSel, setSwapSel] = React.useState<Selection | null>(null);
  const [msgOpen, setMsgOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Re-sync local editing state whenever the stored distribution changes
  // (prepare / regenerate / external update) — adjust-state-during-render pattern.
  const [syncedSig, setSyncedSig] = React.useState(storedSig);
  if (syncedSig !== storedSig) {
    setSyncedSig(storedSig);
    setOrdered(stored);
    setSwapSel(null);
  }

  const dirty = JSON.stringify(ordered) !== storedSig;
  const activePlayers = participants.filter(
    (p) => p.gameId === game.id && !['cancelled', 'waitlisted', 'no_show'].includes(p.status),
  ).length;

  const message = React.useMemo(
    () => buildDistributionMessage(game, ordered, users),
    [game, ordered, users],
  );

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const next = ordered.map((t) => [...t]);
    [next[index], next[target]] = [next[target], next[index]];
    setOrdered(next);
    setSwapSel(null);
  };

  const tapPlayer = (t: number, p: number) => {
    if (finalized) return;
    if (!swapSel) {
      setSwapSel({ t, p });
      return;
    }
    if (swapSel.t === t && swapSel.p === p) {
      setSwapSel(null);
      return;
    }
    const next = ordered.map((team) => [...team]);
    const a = next[swapSel.t][swapSel.p];
    next[swapSel.t][swapSel.p] = next[t][p];
    next[t][p] = a;
    setOrdered(next);
    setSwapSel(null);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Copied to clipboard', { description: 'Paste it into the game WhatsApp group.' });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed', { description: 'Select the text and copy it manually.' });
    }
  };

  const onFinalize = () => {
    if (dirty) saveDistribution(game.id, ordered);
    finalizeDistribution(game.id);
    setMsgOpen(true);
  };

  const groups = groupByCourt(ordered);

  // ---- Empty state: nothing prepared yet ----
  if (!prepared) {
    return (
      <Card className="rounded-2xl border-primary/20 bg-primary/[0.03] py-0 shadow-sm">
        <CardContent className="space-y-3 p-4">
          <p className="flex items-center gap-1.5 font-heading text-base font-semibold">
            <Trophy className="size-4 text-primary" /> Court distribution
          </p>
          <p className="text-sm text-muted-foreground">
            Seed the courts before the game. The system ranks pairs by level, verified status, rating
            and win rate, then places the strongest on the top courts (Court&nbsp;1 / Central). You can
            fine-tune everything by hand afterwards.
          </p>
          <Button onClick={() => prepareDistribution(game.id)} disabled={activePlayers < 2}>
            <Sparkles className="size-4" /> Prepare initial distribution
          </Button>
          {activePlayers < 2 && (
            <p className="text-xs text-muted-foreground">Need at least two registered players.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // ---- Prepared: editable / finalized distribution ----
  return (
    <Card className="rounded-2xl py-0 shadow-sm">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 p-4 pb-0">
        <CardTitle className="flex items-center gap-1.5 font-heading text-base">
          <Trophy className="size-4 text-primary" /> Court distribution
          {finalized ? (
            <Badge className="gap-1 bg-primary/15 text-primary"><Lock className="size-3" /> Finalized</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {!finalized && (
            <Button variant="outline" size="sm" onClick={() => prepareDistribution(game.id)}>
              <RefreshCw className="size-3.5" /> Regenerate
            </Button>
          )}
          {finalized ? (
            <>
              <Button variant="outline" size="sm" onClick={() => reopenDistribution(game.id)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button size="sm" onClick={() => setMsgOpen(true)}>
                <MessageCircle className="size-3.5" /> WhatsApp message
              </Button>
            </>
          ) : (
            <>
              {dirty && (
                <Button variant="outline" size="sm" onClick={() => saveDistribution(game.id, ordered)}>
                  Save changes
                </Button>
              )}
              <Button size="sm" onClick={onFinalize}>
                <Check className="size-3.5" /> Finalize &amp; send
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {!finalized && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Use the arrows to move a pair between courts. Tap two players to swap them. Manual moves are
            remembered and nudge future auto-distributions.
          </p>
        )}

        <div className="space-y-2.5">
          {groups.map((group) => (
            <div key={group.court} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={group.court <= 3 ? 'default' : 'secondary'} className="shrink-0">
                  {courtLabel(group.court, game.format)}
                </Badge>
                {group.court === 1 && <span className="text-xs text-muted-foreground">Top court</span>}
              </div>
              <div className="space-y-2">
                {group.teams.map((team) => {
                  const flatIndex = ordered.findIndex((t) => t === team);
                  return (
                    <div key={flatIndex} className="flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        {team.map((uid, pIdx) => {
                          const u = userFor(uid);
                          const selected = swapSel?.t === flatIndex && swapSel?.p === pIdx;
                          return (
                            <React.Fragment key={uid}>
                              {pIdx > 0 && <span className="text-muted-foreground">+</span>}
                              <PlayerChip
                                user={u}
                                selected={selected}
                                disabled={finalized}
                                onClick={() => tapPlayer(flatIndex, pIdx)}
                              />
                            </React.Fragment>
                          );
                        })}
                      </div>
                      {!finalized && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            variant="ghost" size="icon-sm"
                            disabled={flatIndex === 0}
                            onClick={() => move(flatIndex, -1)}
                            aria-label="Move up"
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm"
                            disabled={flatIndex === ordered.length - 1}
                            onClick={() => move(flatIndex, 1)}
                            aria-label="Move down"
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {swapSel && (
          <p className="flex items-center gap-1.5 text-xs text-primary">
            <ArrowLeftRight className="size-3.5" /> Tap another player to swap, or tap the same one to cancel.
          </p>
        )}
      </CardContent>

      {/* WhatsApp message */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>WhatsApp announcement</DialogTitle>
            <DialogDescription>
              Copy this into the game group. It includes the schedule, points system and the initial
              court distribution.
            </DialogDescription>
          </DialogHeader>
          <Textarea readOnly value={message} className="h-80 font-mono text-xs leading-relaxed" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgOpen(false)}>Close</Button>
            <Button onClick={copyMessage}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PlayerChip({
  user, selected, disabled, onClick,
}: {
  user?: User;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  if (!user) {
    return <span className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground">Open</span>;
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-colors ${
        selected ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:bg-muted'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span className="font-medium">{user.name}</span>
      <span className="text-xs text-muted-foreground">{LEVEL_LABELS[user.level]}</span>
      {user.levelVerified && <VerifiedBadge className="size-3.5" />}
    </button>
  );
}
