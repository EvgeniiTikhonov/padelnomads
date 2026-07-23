'use client';

import * as React from 'react';
import { MessageCircle, Search, UserPlus, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMockData } from '@/data/provider';
import { EXTERNAL_PARTNER_HOLD_HOURS, LEVEL_LABELS, initials } from '@/lib/format';
import { partnerPairEligibility, requiresMixedGenderPair } from '@/lib/eligibility';
import { VerifiedBadge } from '@/components/badges';
import type { Game } from '@/types';

type Step = 'choose' | 'pick_partner' | 'invite_friend';

/**
 * Fixed-team registration: solo, invite a Nomad, or invite a friend
 * who is not on the app yet (24h partner spot hold).
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
  /** register = first signup; find = already solo and looking for a partner */
  mode?: 'register' | 'find';
}) {
  const {
    users, participants, currentUser,
    registerForGame, invitePartner, inviteExternalPartner,
  } = useMockData();

  const [step, setStep] = React.useState<Step>('choose');
  const [query, setQuery] = React.useState('');
  const [friendName, setFriendName] = React.useState('');
  const [friendPhone, setFriendPhone] = React.useState('+971');

  React.useEffect(() => {
    if (open) {
      setStep('choose');
      setQuery('');
      setFriendName('');
      setFriendPhone('+971');
    }
  }, [open, mode]);

  const onGame = participants.filter(
    (p) => p.gameId === game.id && !['cancelled', 'waitlisted'].includes(p.status),
  );
  const onGameIds = new Set(onGame.map((p) => p.userId));

  // Solo players already on this game (looking for a partner, no pending invite)
  const solosOnGame = onGame
    .filter((p) =>
      p.lookingForPartner
      && !p.partnerUserId
      && !p.partnerInviteFrom
      && p.userId !== currentUser.id)
    .map((p) => users.find((u) => u.id === p.userId))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .filter((u) => partnerPairEligibility(currentUser, u, game).ok);

  // Other approved community members not yet on this game
  const community = users
    .filter((u) =>
      u.role === 'player'
      && u.status === 'approved'
      && u.id !== currentUser.id
      && !onGameIds.has(u.id)
      && partnerPairEligibility(currentUser, u, game).ok)
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredSolos = solosOnGame.filter((u) =>
    !query || u.name.toLowerCase().includes(query.toLowerCase()));
  const filteredCommunity = community.filter((u) =>
    !query || u.name.toLowerCase().includes(query.toLowerCase()));
  const mixedPairHint = requiresMixedGenderPair(game);

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'find' ? 'Find a partner' : 'Register with a partner'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'find'
              ? 'Invite a Nomad, or a friend who is not on the app yet (spot held 24h).'
              : 'This format needs a fixed team of two. Register solo, invite a Nomad, or reserve a spot for a friend.'}
            {mixedPairHint && (
              <span className="mt-1.5 block text-amber-200/90">
                King &amp; Queen teams must be one man and one woman.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'choose' && (
          <div className="space-y-2">
            {mode === 'register' && (
              <Button
                className="h-auto w-full justify-start gap-3 px-3 py-3 text-left"
                variant="outline"
                onClick={() => {
                  registerForGame(game.id, currentUser.id, { lookingForPartner: true });
                  close();
                }}
              >
                <UserPlus className="size-4 shrink-0 text-primary" />
                <span>
                  <span className="block font-medium">Register as solo</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    You still need a partner — you can invite someone after joining.
                  </span>
                </span>
              </Button>
            )}
            <Button
              className="h-auto w-full justify-start gap-3 px-3 py-3 text-left"
              variant="outline"
              onClick={() => setStep('pick_partner')}
            >
              <Search className="size-4 shrink-0 text-primary" />
              <span>
                <span className="block font-medium">Invite Nomad to play with you</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Pick a solo player on this game, or invite another member to join.
                </span>
              </span>
            </Button>
            <Button
              className="h-auto w-full justify-start gap-3 px-3 py-3 text-left"
              variant="outline"
              onClick={() => setStep('invite_friend')}
            >
              <MessageCircle className="size-4 shrink-0 text-primary" />
              <span>
                <span className="block font-medium">Invite a friend not on the app</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Reserve their spot for {EXTERNAL_PARTNER_HOLD_HOURS}h as Partner (TBC) and send a WhatsApp invite.
                </span>
              </span>
            </Button>
          </div>
        )}

        {step === 'pick_partner' && (
          <div className="space-y-3">
            <Input
              placeholder="Search players…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {filteredSolos.length > 0 && (
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
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
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
                  Invite a Nomad to this game
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
                      invitePartner(game.id, currentUser.id, u.id);
                      close();
                    }}
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials(u.name)}
                      </AvatarFallback>
                    </Avatar>
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
                We&apos;ll open WhatsApp with an apply link and hold their spot for {EXTERNAL_PARTNER_HOLD_HOURS} hours
                as Partner (TBC) next to your name.
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
