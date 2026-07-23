'use client';

import * as React from 'react';
import { MessageCircle, Search, UserPlus, Users } from 'lucide-react';
import { PlayerAvatar } from '@/components/player-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMockData } from '@/data/provider';
import { isGameFull } from '@/lib/derive';
import { EXTERNAL_PARTNER_HOLD_HOURS, LEVEL_LABELS } from '@/lib/format';
import { partnerPairEligibility, requiresMixedGenderPair } from '@/lib/eligibility';
import { VerifiedBadge } from '@/components/badges';
import type { Game } from '@/types';

type Step =
  | 'choose'
  | 'pick_partner'
  | 'name_partner'
  | 'invite_friend'
  | 'confirm_waitlist';

type PendingAction =
  | { type: 'solo' }
  | { type: 'full_pair_user'; partnerId: string }
  | { type: 'full_pair_name'; partnerName: string };

/**
 * Fixed-team registration with priority tiers:
 * 1) Full pair (both names)  2) Partner pending (name by 8pm)  3) Solo / needs partner
 */
export function FixedPairsRegisterDialog({
  game,
  open,
  onOpenChange,
  mode = 'register',
}: {
  game: Game;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'register' | 'find';
}) {
  const {
    users, participants, currentUser, externalPartnerInvites,
    registerForGame, invitePartner, inviteExternalPartner,
  } = useMockData();

  const [step, setStep] = React.useState<Step>('choose');
  const [query, setQuery] = React.useState('');
  const [friendName, setFriendName] = React.useState('');
  const [friendPhone, setFriendPhone] = React.useState('+971');
  const [partnerName, setPartnerName] = React.useState('');
  const [pending, setPending] = React.useState<PendingAction | null>(null);

  const full = isGameFull(participants, game.id, externalPartnerInvites, game);
  const waitlistMode = mode === 'register' && full;

  React.useEffect(() => {
    if (open) {
      setStep('choose');
      setQuery('');
      setFriendName('');
      setFriendPhone('+971');
      setPartnerName('');
      setPending(null);
    }
  }, [open, mode]);

  const onGame = participants.filter(
    (p) => p.gameId === game.id && !['cancelled', 'waitlisted'].includes(p.status),
  );
  const onGameIds = new Set(onGame.map((p) => p.userId));
  const waitlistedIds = new Set(
    participants
      .filter((p) => p.gameId === game.id && p.status === 'waitlisted')
      .map((p) => p.userId),
  );

  const solosOnGame = onGame
    .filter((p) =>
      p.lookingForPartner
      && !p.partnerUserId
      && !p.partnerInviteFrom
      && p.userId !== currentUser.id)
    .map((p) => users.find((u) => u.id === p.userId))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .filter((u) => partnerPairEligibility(currentUser, u, game).ok);

  const community = users
    .filter((u) =>
      u.role === 'player'
      && u.status === 'approved'
      && u.id !== currentUser.id
      && !onGameIds.has(u.id)
      && (!waitlistedIds.has(u.id) || waitlistMode)
      && partnerPairEligibility(currentUser, u, game).ok)
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredSolos = solosOnGame.filter((u) =>
    !query || u.name.toLowerCase().includes(query.toLowerCase()));
  const filteredCommunity = community.filter((u) =>
    !query || u.name.toLowerCase().includes(query.toLowerCase()));
  const mixedPairHint = requiresMixedGenderPair(game);

  const close = () => onOpenChange(false);

  const confirmCopy = (() => {
    if (!pending) return '';
    if (pending.type === 'full_pair_user' || pending.type === 'full_pair_name') {
      return 'This game is full. Confirm to add your full team to the waiting list. We\'ll notify you if a spot opens.';
    }
    return 'This game is full. Confirm to join the waitlist as a solo. We\'ll notify you if a spot opens.';
  })();

  const commit = (action: PendingAction) => {
    if (action.type === 'solo') {
      registerForGame(game.id, currentUser.id, { lookingForPartner: true });
    } else if (action.type === 'full_pair_user') {
      registerForGame(game.id, currentUser.id, { withPartnerUserId: action.partnerId });
    } else {
      registerForGame(game.id, currentUser.id, { partnerName: action.partnerName });
    }
    close();
  };

  const requestOrCommit = (action: PendingAction) => {
    if (waitlistMode) {
      setPending(action);
      setStep('confirm_waitlist');
    } else {
      commit(action);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'find'
              ? 'Find a partner'
              : waitlistMode
                ? 'Join the waitlist'
                : 'Register with a partner'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'find'
              ? 'Invite a Nomad, or a friend who is not on the app yet.'
              : waitlistMode
                ? 'All team slots are taken — join the waitlist as a full team or solo.'
                : 'Choose how you want to register for this team format.'}
            {mixedPairHint && (
              <span className="mt-1.5 block text-amber-200/90">
                King &amp; Queen teams must be one man and one woman.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm_waitlist' && pending && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{confirmCopy}</p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setStep('choose')}>Back</Button>
              <Button onClick={() => commit(pending)}>Confirm waitlist spot</Button>
            </DialogFooter>
          </div>
        )}

        {step === 'choose' && mode === 'register' && (
          <div className="space-y-2">
            <Button
              className="h-11 w-full justify-start gap-3 px-3 text-left"
              variant="outline"
              onClick={() => setStep('pick_partner')}
            >
              <Users className="size-4 shrink-0 text-primary" />
              <span className="font-medium">Full team - Specify your partner</span>
            </Button>
            <Button
              className="h-11 w-full justify-start gap-3 px-3 text-left"
              variant="outline"
              onClick={() => requestOrCommit({ type: 'solo' })}
            >
              <UserPlus className="size-4 shrink-0 text-primary" />
              <span className="font-medium">Solo - Needs a partner</span>
            </Button>
          </div>
        )}

        {step === 'choose' && mode === 'find' && (
          <div className="space-y-2">
            <Button
              className="h-11 w-full justify-start gap-3 px-3 text-left"
              variant="outline"
              onClick={() => setStep('pick_partner')}
            >
              <Search className="size-4 shrink-0 text-primary" />
              <span className="font-medium">Invite Nomad to play with you</span>
            </Button>
            <Button
              className="h-11 w-full justify-start gap-3 px-3 text-left"
              variant="outline"
              onClick={() => setStep('invite_friend')}
            >
              <MessageCircle className="size-4 shrink-0 text-primary" />
              <span className="font-medium">Invite a friend not on the app</span>
            </Button>
          </div>
        )}

        {step === 'pick_partner' && (
          <div className="space-y-3">
            {mode === 'register' && (
              <Button
                variant="secondary"
                className="h-auto w-full justify-start gap-3 px-3 py-3 text-left"
                onClick={() => setStep('name_partner')}
              >
                <Users className="size-4 shrink-0" />
                <span>
                  <span className="block font-medium">Type partner&apos;s name</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    Both names at registration — full pair priority.
                  </span>
                </span>
              </Button>
            )}
            <Input
              placeholder="Search players…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {!waitlistMode && filteredSolos.length > 0 && (
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Users className="size-3" /> Looking for a partner on this game
                  </p>
                  {filteredSolos.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors hover:bg-muted/50"
                      onClick={() => {
                        invitePartner(game.id, currentUser.id, u.id);
                        close();
                      }}
                    >
                      <PlayerAvatar user={u} className="size-8" fallbackClassName="text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 truncate text-sm font-medium">
                          {u.name}
                          {u.levelVerified && <VerifiedBadge className="size-3.5" />}
                        </span>
                        <span className="text-xs text-muted-foreground">{LEVEL_LABELS[u.level]}</span>
                      </span>
                      <Badge variant="secondary">Solo</Badge>
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Invite a Nomad
                </p>
                {filteredCommunity.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No matching players.</p>
                )}
                {filteredCommunity.slice(0, 12).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors hover:bg-muted/50"
                    onClick={() => {
                      if (mode === 'register') {
                        requestOrCommit({ type: 'full_pair_user', partnerId: u.id });
                      } else {
                        invitePartner(game.id, currentUser.id, u.id);
                        close();
                      }
                    }}
                  >
                    <PlayerAvatar user={u} className="size-8" fallbackClassName="text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 truncate text-sm font-medium">
                        {u.name}
                        {u.levelVerified && <VerifiedBadge className="size-3.5" />}
                      </span>
                      <span className="text-xs text-muted-foreground">{LEVEL_LABELS[u.level]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setStep('choose')}>Back</Button>
          </div>
        )}

        {step === 'name_partner' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="partner-name">Partner&apos;s full name</Label>
              <Input
                id="partner-name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Sara Ahmed"
                className="h-10"
              />
              <p className="text-[11px] text-muted-foreground">
                Both names are recorded now — this registers you as a full pair (1st priority).
              </p>
            </div>
            <Button
              className="h-11 w-full"
              disabled={partnerName.trim().length < 2}
              onClick={() => requestOrCommit({ type: 'full_pair_name', partnerName: partnerName.trim() })}
            >
              Register full pair
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep('pick_partner')}>Back</Button>
          </div>
        )}

        {step === 'invite_friend' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="friend-name">Friend&apos;s name</Label>
              <Input
                id="friend-name"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="Sara Ahmed"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="friend-phone">WhatsApp number</Label>
              <Input
                id="friend-phone"
                type="tel"
                value={friendPhone}
                onChange={(e) => setFriendPhone(e.target.value)}
                placeholder="+971501234567"
                className="h-10 font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                We&apos;ll open WhatsApp with an apply link and hold their spot for {EXTERNAL_PARTNER_HOLD_HOURS} hours.
                {mixedPairHint && ' Your friend must be the opposite gender for this format.'}
              </p>
            </div>
            <Button
              className="h-11 w-full"
              disabled={!friendName.trim() || !/^\+[1-9]\d{7,14}$/.test(friendPhone.trim())}
              onClick={() => {
                inviteExternalPartner(game.id, currentUser.id, friendName, friendPhone);
                close();
              }}
            >
              <MessageCircle className="size-4" /> Hold spot &amp; send WhatsApp
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep('choose')}>Back</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
