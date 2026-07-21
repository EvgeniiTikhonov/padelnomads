import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  GAME_STATUS_META, KARMA_TIER_META, PARTICIPANT_STATUS_META, USER_STATUS_LABELS,
} from '@/lib/format';
import type { GameStatus, KarmaTier, ParticipantStatus, UserStatus } from '@/types';

export function GameStatusBadge({ status }: { status: GameStatus }) {
  const meta = GAME_STATUS_META[status];
  return (
    <Badge className={cn('border-none', meta.className)}>
      {status === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-green-500" />}
      {meta.label}
    </Badge>
  );
}

export function KarmaTierBadge({ tier }: { tier: KarmaTier }) {
  const meta = KARMA_TIER_META[tier];
  return (
    <Badge className={cn('border-none', meta.className)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  );
}

export function ParticipantStatusBadge({ status }: { status: ParticipantStatus }) {
  const meta = PARTICIPANT_STATUS_META[status];
  return <Badge className={cn('border-none', meta.className)}>{meta.label}</Badge>;
}

const USER_STATUS_CLASSES: Record<UserStatus, string> = {
  imported: 'bg-violet-500/15 text-violet-300',
  invited: 'bg-blue-500/15 text-blue-300',
  pending: 'bg-amber-500/15 text-amber-300',
  approved: 'bg-primary/15 text-primary',
  rejected: 'bg-white/10 text-white/60',
  banned: 'bg-red-500/15 text-red-300',
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge className={cn('border-none', USER_STATUS_CLASSES[status])}>{USER_STATUS_LABELS[status]}</Badge>;
}

/** White tick on a blue badge — the player's level was verified by Padel Nomads. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span title="Level verified by Padel Nomads" className="inline-flex shrink-0 align-middle">
      <BadgeCheck
        aria-label="Level verified by Padel Nomads"
        className={cn('size-4 fill-blue-500 stroke-white', className)}
      />
    </span>
  );
}
