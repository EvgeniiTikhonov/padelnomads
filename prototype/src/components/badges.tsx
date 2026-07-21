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
  imported: 'bg-violet-100 text-violet-700',
  invited: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-slate-100 text-slate-600',
  banned: 'bg-red-100 text-red-700',
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge className={cn('border-none', USER_STATUS_CLASSES[status])}>{USER_STATUS_LABELS[status]}</Badge>;
}
