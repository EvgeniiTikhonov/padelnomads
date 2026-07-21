import type { GameFormat, GameStatus, KarmaTier, Level, ParticipantStatus, PreferredSide, Gender, UserStatus, KarmaEventType } from '@/types';

export const FORMAT_LABELS: Record<GameFormat, string> = {
  social_shuffle: 'Social Shuffle',
  king_of_the_court: 'King of the Court',
  court_of_queens: 'Court of Queens',
  king_queen_of_the_court: 'King & Queen of the Court',
  fixed_pairs: 'Fixed Pairs',
  mini_tournament: 'Mini-Tournament',
  americano: 'Americano',
};

export const LEVEL_LABELS: Record<Level | 'mixed', string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  professional: 'Professional',
  mixed: 'Mixed',
};

export const SIDE_LABELS: Record<PreferredSide, string> = {
  left: 'Left', right: 'Right', both: 'Both',
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male', female: 'Female', non_binary: 'Non-binary', prefer_not_to_say: 'Prefer not to say',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  imported: 'Imported', invited: 'Invited', pending: 'Pending',
  approved: 'Approved', rejected: 'Rejected', banned: 'Banned',
};

export const GAME_STATUS_META: Record<GameStatus, { label: string; className: string }> = {
  upcoming: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' },
  live: { label: 'Live', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

export const KARMA_TIER_META: Record<KarmaTier, { label: string; className: string; dot: string }> = {
  good: { label: 'Good standing', className: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  warning: { label: 'Warning', className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  restricted: { label: 'Restricted', className: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export const PARTICIPANT_STATUS_META: Record<ParticipantStatus, { label: string; className: string }> = {
  registered: { label: 'Awaiting confirmation', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  no_show: { label: 'No-show', className: 'bg-red-100 text-red-700' },
  waitlisted: { label: 'Waitlisted', className: 'bg-slate-100 text-slate-600' },
};

export const KARMA_EVENT_LABELS: Record<KarmaEventType, string> = {
  on_time_game: 'Played on time',
  streak_bonus: 'Punctuality streak bonus',
  conduct_award: 'Good conduct award',
  late_cancellation: 'Late cancellation (<24h)',
  very_late_cancellation: 'Very late cancellation (<4h)',
  no_show: 'No-show',
  late_arrival: 'Late arrival',
  non_payment: 'Non-payment',
  non_payment_reversal: 'Non-payment reversed',
  misconduct_minor: 'Minor misconduct',
  misconduct_major: 'Major misconduct',
  manual_correction: 'Manual correction',
  decay_expiry: 'Penalty expired (decay)',
};

export function karmaTierFor(balance: number): KarmaTier {
  if (balance >= 50) return 'good';
  if (balance >= 20) return 'warning';
  if (balance >= 1) return 'restricted';
  return 'suspended';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}
