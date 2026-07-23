'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Lock, MessageCircle, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FixedPairsRegisterDialog } from '@/components/fixed-pairs-register';
import { ALLOW_SELF_REGISTER, useMockData } from '@/data/provider';
import { isExternalPartnerHoldActive, spotsTaken } from '@/lib/derive';
import { waitlistOrdered, waitlistPosition } from '@/lib/waitlist';
import {
  EXTERNAL_PARTNER_HOLD_HOURS, LATE_CANCEL_HOURS, adminWhatsAppUrl, isFixedTeamFormat, isLateCancel,
} from '@/lib/format';
import { gameJoinEligibility } from '@/lib/eligibility';
import { PARTNER_NAME_DEADLINE_HOUR } from '@/lib/teamPriority';
import type { Game, GameParticipant } from '@/types';

const POLICY_TEXT =
  `I accept the cancellation policy: free cancel until ${LATE_CANCEL_HOURS} hours before kickoff. Within ${LATE_CANCEL_HOURS} hours I must pay the game fee or find a replacement from the waitlist.`;

/**
 * Confirm / cancel / register controls for a game.
 * Used on the game detail page and embedded on home GameCards so players
 * see actions without digging into the detail screen.
 */
export function ParticipationActions({
  game,
  mine,
  compact = false,
}: {
  game: Game;
  mine?: GameParticipant;
  /** Tighter layout for embedding inside a GameCard. */
  compact?: boolean;
}) {
  const {
    participants, users, currentUser, externalPartnerInvites,
    markLetsGo, declineParticipation, registerForGame,
    cancelWithPayment, offerReplacement, claimWaitlistSpot,
    acceptPartnerInvite, declinePartnerInvite, submitPartnerName,
  } = useMockData();

  const [policyAccepted, setPolicyAccepted] = React.useState(false);
  const [lateOpen, setLateOpen] = React.useState(false);
  const [pairsOpen, setPairsOpen] = React.useState(false);
  const [pairsMode, setPairsMode] = React.useState<'register' | 'find'>('register');
  const [waitlistConfirmOpen, setWaitlistConfirmOpen] = React.useState(false);
  const [partnerNameDraft, setPartnerNameDraft] = React.useState('');

  if (game.status !== 'upcoming') return null;

  // Cancelled spots are treated as free — player can register again.
  const activeMine = mine && mine.status !== 'cancelled' ? mine : undefined;
  const previouslyCancelled = mine?.status === 'cancelled';

  const isFixedTeam = isFixedTeamFormat(game.format);
  const waitlist = waitlistOrdered(participants, users, game.id);
  const myWaitPos = waitlistPosition(participants, users, game.id, currentUser.id, game.format);
  const topWaiter = waitlist.find((p) => {
    const u = users.find((x) => x.id === p.userId);
    return u && u.status !== 'banned' && u.karmaTier !== 'restricted' && u.karmaTier !== 'suspended';
  });
  const offering = participants.find((p) => p.gameId === game.id && p.status === 'pending_replacement');
  const karmaBlocked = currentUser.karmaTier === 'restricted' || currentUser.karmaTier === 'suspended';
  const joinEligibility = gameJoinEligibility(currentUser, game);
  const late = isLateCancel(game);
  const feeLabel = game.price != null ? `AED ${game.price}` : 'the game fee';
  const full = spotsTaken(participants, game.id, externalPartnerInvites, game.format) >= game.capacity;
  const partner = activeMine?.partnerUserId
    ? users.find((u) => u.id === activeMine.partnerUserId)
    : undefined;
  const inviteFrom = activeMine?.partnerInviteFrom
    ? users.find((u) => u.id === activeMine.partnerInviteFrom)
    : undefined;
  const outgoingInvite = participants.find(
    (p) => p.gameId === game.id && p.partnerInviteFrom === currentUser.id && !['cancelled', 'waitlisted'].includes(p.status),
  );
  const outgoingInviteUser = outgoingInvite
    ? users.find((u) => u.id === outgoingInvite.userId)
    : undefined;
  const externalInvite = externalPartnerInvites.find(
    (i) => i.gameId === game.id && i.fromUserId === currentUser.id && isExternalPartnerHoldActive(i),
  );
  const needsPartner = Boolean(isFixedTeam && activeMine && !partner && !externalInvite);

  const requestCancel = () => {
    if (late) setLateOpen(true);
    else declineParticipation(game.id, currentUser.id);
  };

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const pad = compact ? 'p-3' : 'p-4';
  const btnH = compact ? 'h-10' : 'h-11';

  return (
    <>
      {activeMine?.partnerInviteFrom && inviteFrom && (
        <div
          className={`space-y-2 rounded-xl border border-sky-500/40 bg-sky-500/10 ${pad}`}
          onClick={stop}
        >
          <p className={`font-medium text-sky-100 ${compact ? 'text-xs' : 'text-sm'}`}>
            {activeMine.lookingForPartner
              ? `${inviteFrom.name} wants to join your team.`
              : `${inviteFrom.name} invited you as their fixed-team partner.`}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className={`${btnH} flex-1`} onClick={() => acceptPartnerInvite(game.id, currentUser.id)}>
              <Check className="size-4" /> {activeMine.lookingForPartner ? 'Approve' : 'Accept'}
            </Button>
            <Button variant="outline" className={`${btnH} flex-1`} onClick={() => declinePartnerInvite(game.id, currentUser.id)}>
              <X className="size-4" /> Decline
            </Button>
          </div>
        </div>
      )}

      {activeMine?.status === 'confirmed' && activeMine.teamEntryKind === 'partner_pending' && (
        <div
          className={`space-y-2 rounded-xl border border-orange-500/40 bg-orange-500/10 ${pad}`}
          onClick={stop}
        >
          <p className={`font-medium text-orange-100 ${compact ? 'text-xs' : 'text-sm'}`}>
            Partner name due by{' '}
            {activeMine.partnerNameDueAt
              ? new Date(activeMine.partnerNameDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : `${PARTNER_NAME_DEADLINE_HOUR}:00`}
          </p>
          <p className={`text-orange-100/70 ${compact ? 'text-[11px]' : 'text-xs'}`}>
            2nd priority — if you don’t send a name in time, your spot moves to the waitlist.
          </p>
          {!compact && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={partnerNameDraft}
                onChange={(e) => setPartnerNameDraft(e.target.value)}
                placeholder="Partner's full name"
                className="h-10 flex-1"
              />
              <Button
                className={btnH}
                disabled={partnerNameDraft.trim().length < 2}
                onClick={() => {
                  submitPartnerName(game.id, currentUser.id, partnerNameDraft);
                  setPartnerNameDraft('');
                }}
              >
                Submit name
              </Button>
            </div>
          )}
        </div>
      )}

      {activeMine?.status === 'confirmed' && (
        <div
          className={`space-y-2 rounded-xl border border-primary/30 bg-primary/10 ${pad}`}
          onClick={stop}
        >
          {activeMine.letsGoAt ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className={`font-medium text-primary ${compact ? 'text-xs' : 'text-sm'}`}>
                  See you on the court!
                </p>
                <p className={`text-primary/70 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                  Reminders 24h and 2h before kickoff.
                </p>
                {isFixedTeam && partner && (
                  <p className={`text-primary/80 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    Partner: {partner.name}
                  </p>
                )}
                {isFixedTeam && externalInvite && !partner && (
                  <p className={`text-amber-200 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    {currentUser.name.split(' ')[0]} + Partner (TBC)
                    <span className="text-amber-200/70">
                      {' '}· {externalInvite.friendName} · held {EXTERNAL_PARTNER_HOLD_HOURS}h
                    </span>
                  </p>
                )}
                {isFixedTeam && outgoingInviteUser && !partner && !externalInvite && (
                  <p className={`text-amber-200 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    Invite sent to {outgoingInviteUser.name} — waiting for accept
                  </p>
                )}
                {isFixedTeam && needsPartner && !outgoingInviteUser && !externalInvite && (
                  <p className={`text-amber-200 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    Still looking for a partner
                  </p>
                )}
              </div>
              <Button variant="outline" size={compact ? 'sm' : 'default'} onClick={requestCancel}>
                Cancel my spot
              </Button>
            </div>
          ) : (
            <>
              <div>
                <p className={`font-medium text-primary ${compact ? 'text-xs' : 'text-sm'}`}>
                  You&apos;re in for this game
                </p>
                <p className={`text-primary/70 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                  We&apos;ll remind you 24h and 2h before kickoff.
                </p>
                {isFixedTeam && activeMine.partnerName && !partner && (
                  <p className={`mt-1 text-primary/80 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    Partner: {activeMine.partnerName}
                  </p>
                )}
                {isFixedTeam && partner && (
                  <p className={`mt-1 text-primary/80 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    Partner: {partner.name}
                  </p>
                )}
                {isFixedTeam && externalInvite && !partner && (
                  <p className={`mt-1 text-amber-200 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    {currentUser.name.split(' ')[0]} + Partner (TBC)
                    <span className="text-amber-200/70">
                      {' '}· {externalInvite.friendName} · held {EXTERNAL_PARTNER_HOLD_HOURS}h
                    </span>
                  </p>
                )}
                {isFixedTeam && outgoingInviteUser && !partner && !externalInvite && (
                  <p className={`mt-1 text-amber-200 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    Invite sent to {outgoingInviteUser.name} — waiting for accept
                  </p>
                )}
                {isFixedTeam && needsPartner && !outgoingInviteUser && !externalInvite && (
                  <p className={`mt-1 text-amber-200 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    Still looking for a partner
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className={`${btnH} flex-1`}
                  onClick={() => markLetsGo(game.id, currentUser.id)}
                >
                  <Sparkles className="size-4" /> Let&apos;s go
                </Button>
                <Button
                  variant="outline"
                  className={`${btnH} flex-1`}
                  onClick={requestCancel}
                >
                  <X className="size-4" /> Cancel my spot
                </Button>
              </div>
            </>
          )}
          {isFixedTeam && (needsPartner || externalInvite) && !activeMine.partnerInviteFrom && (
            <Button
              variant="secondary"
              className={`${btnH} w-full`}
              onClick={() => { setPairsMode('find'); setPairsOpen(true); }}
            >
              <Users className="size-4" /> {outgoingInviteUser || externalInvite ? 'Invite someone else' : 'Find a partner'}
            </Button>
          )}
        </div>
      )}

      {/* Legacy registered status — treat like confirmed (auto-confirm migration). */}
      {activeMine?.status === 'registered' && (
        <div
          className={`space-y-2 rounded-xl border border-primary/30 bg-primary/10 ${pad}`}
          onClick={stop}
        >
          <p className={`font-medium text-primary ${compact ? 'text-xs' : 'text-sm'}`}>
            You&apos;re in for this game
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className={`${btnH} flex-1`}
              onClick={() => markLetsGo(game.id, currentUser.id)}
            >
              <Sparkles className="size-4" /> Let&apos;s go
            </Button>
            <Button variant="outline" className={`${btnH} flex-1`} onClick={requestCancel}>
              <X className="size-4" /> Cancel my spot
            </Button>
          </div>
        </div>
      )}

      {activeMine?.status === 'pending_replacement' && (
        <div
          className={`space-y-1 rounded-xl border border-orange-500/40 bg-orange-500/10 ${pad}`}
          onClick={stop}
        >
          <p className={`flex items-center gap-1.5 font-medium text-orange-200 ${compact ? 'text-xs' : 'text-sm'}`}>
            <Users className="size-3.5 shrink-0" /> Looking for a replacement
          </p>
          <p className={`text-muted-foreground ${compact ? 'text-[11px]' : 'text-xs'}`}>
            Spot offered to the waitlist. Highest-karma player is promoted first — then you&apos;re cancelled with no late fee.
          </p>
        </div>
      )}

      {activeMine?.status === 'waitlisted' && (
        <div className={`space-y-2 rounded-xl border border-white/10 bg-muted/40 ${pad}`} onClick={stop}>
          {offering && topWaiter?.userId === currentUser.id ? (
            <>
              <p className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                A spot opened — you&apos;re first on the karma waitlist.
              </p>
              <Button className={`${btnH} w-full`} onClick={() => claimWaitlistSpot(game.id, currentUser.id)}>
                <Check className="size-4" /> Take this spot
              </Button>
            </>
          ) : (
            <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
              You&apos;re #{myWaitPos ?? '?'} on the waitlist
              {isFixedTeam && activeMine.partnerUserId
                ? ' as a team'
                : isFixedTeam
                  ? ' as a solo'
                  : ''}
              {' '}(karma {currentUser.karmaBalance}). We&apos;ll notify you if you&apos;re moved to the main list — then please confirm your spot.
            </p>
          )}
        </div>
      )}

      {!activeMine && ALLOW_SELF_REGISTER && (
        karmaBlocked ? (
          !compact && (
            <Alert className="border-orange-300 bg-orange-50 text-orange-900">
              <Lock className="size-4" />
              <AlertTitle>Sign-up blocked by karma tier</AlertTitle>
              <AlertDescription className="text-orange-800">
                Your karma balance ({currentUser.karmaBalance}) puts you in the {currentUser.karmaTier} tier.
                See your{' '}
                <Link href="/app/profile" className="font-medium underline">karma history</Link>.
              </AlertDescription>
            </Alert>
          )
        ) : !joinEligibility.ok ? (
          <div
            className={`space-y-2 rounded-xl border border-white/10 bg-muted/30 ${pad} opacity-80`}
            onClick={stop}
          >
            <p className={`flex items-center gap-1.5 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
              <Lock className="size-3.5 shrink-0" /> Can&apos;t join this game
            </p>
            <p className={`text-muted-foreground ${compact ? 'text-[11px]' : 'text-xs'}`}>
              {joinEligibility.reason}
            </p>
            <Button
              size={compact ? 'default' : 'lg'}
              className={`${compact ? 'h-10' : 'h-12'} w-full ${compact ? '' : 'text-base'}`}
              disabled
            >
              <UserPlus className="size-4" /> Register unavailable
            </Button>
          </div>
        ) : (
          <div className={`space-y-3 rounded-xl border border-white/10 bg-card ${pad}`} onClick={stop}>
            {full && (
              <p className={`text-amber-200/90 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                This game is full — you can still join the waiting list. We&apos;ll notify you if a main-list spot opens.
              </p>
            )}
            {previouslyCancelled && !compact && (
              <p className="text-xs text-muted-foreground">
                You previously cancelled — you can register again{full ? ' on the waitlist' : ' if there\'s a free spot'}.
              </p>
            )}
            <label className="flex cursor-pointer items-start gap-2.5">
              <Checkbox
                checked={policyAccepted}
                onCheckedChange={(v) => setPolicyAccepted(v === true)}
                className="mt-0.5"
              />
              <span className={`leading-snug text-muted-foreground ${compact ? 'text-[11px]' : 'text-xs'}`}>
                {POLICY_TEXT}
              </span>
            </label>
            {isFixedTeam ? (
              <Button
                size={compact ? 'default' : 'lg'}
                className={`${compact ? 'h-10' : 'h-12'} w-full ${compact ? '' : 'text-base'}`}
                disabled={!policyAccepted}
                onClick={() => { setPairsMode('register'); setPairsOpen(true); }}
              >
                <Users className="size-4" /> {full ? 'Join waitlist' : 'Register with a partner'}
              </Button>
            ) : (
              <Button
                size={compact ? 'default' : 'lg'}
                className={`${compact ? 'h-10' : 'h-12'} w-full ${compact ? '' : 'text-base'}`}
                disabled={!policyAccepted}
                onClick={() => {
                  if (full) {
                    setWaitlistConfirmOpen(true);
                  } else {
                    registerForGame(game.id, currentUser.id);
                    setPolicyAccepted(false);
                  }
                }}
              >
                <UserPlus className="size-4" /> {full ? 'Join waitlist' : previouslyCancelled ? 'Register again' : 'Register for this game'}
              </Button>
            )}
          </div>
        )
      )}

      {isFixedTeam && (
        <FixedPairsRegisterDialog
          game={game}
          open={pairsOpen}
          onOpenChange={(o) => {
            setPairsOpen(o);
            if (!o) setPolicyAccepted(false);
          }}
          mode={pairsMode}
        />
      )}

      <Dialog open={waitlistConfirmOpen} onOpenChange={setWaitlistConfirmOpen}>
        <DialogContent className="sm:max-w-md" onClick={stop}>
          <DialogHeader>
            <DialogTitle>Confirm waitlist spot</DialogTitle>
            <DialogDescription>
              This game is full. We&apos;ll add you to the waiting list. When a spot opens, players
              move to the main list by karma priority (higher first). We&apos;ll notify you if
              you&apos;re promoted — then please confirm your spot.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setWaitlistConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                registerForGame(game.id, currentUser.id);
                setWaitlistConfirmOpen(false);
                setPolicyAccepted(false);
              }}
            >
              Confirm waitlist spot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lateOpen} onOpenChange={setLateOpen}>
        <DialogContent className="sm:max-w-md" onClick={stop}>
          <DialogHeader>
            <DialogTitle>Late cancellation</DialogTitle>
            <DialogDescription>
              Kickoff is less than {LATE_CANCEL_HOURS} hours away. To leave this game you must
              either pay {feeLabel}, or fill the spot from the waitlist (highest karma first).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              className="h-11 w-full"
              onClick={() => {
                cancelWithPayment(game.id, currentUser.id);
                setLateOpen(false);
              }}
            >
              Cancel &amp; pay {feeLabel}
            </Button>

            {waitlist.length > 0 ? (
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => {
                  offerReplacement(game.id, currentUser.id);
                  setLateOpen(false);
                }}
              >
                <Users className="size-4" /> Fill from waitlist ({waitlist.length} players, karma priority)
              </Button>
            ) : (
              <div className="space-y-2 rounded-xl border p-3">
                <p className="text-sm text-muted-foreground">
                  There&apos;s no waitlist for this game. Message the organizer to arrange a replacement.
                </p>
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => {
                    window.open(
                      adminWhatsAppUrl(
                        `Hi! I need to cancel ${game.title} on ${game.date} at ${game.startTime} (less than ${LATE_CANCEL_HOURS}h). Can you help find a replacement?`,
                      ),
                      '_blank',
                      'noopener,noreferrer',
                    );
                  }}
                >
                  <MessageCircle className="size-4" /> Chat with admin on WhatsApp
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setLateOpen(false)}>Keep my spot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
