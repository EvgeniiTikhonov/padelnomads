import { LEVELS, type GameFormat, type GameLeague, type GameStatus, type KarmaTier, type LeaderboardKind, type Level, type ParticipantStatus, type PreferredSide, type BestHand, type MatchTypePref, type PlayTimePref, type Gender, type UserStatus, type KarmaEventType, type Game, type ClubAmenity, type SupportRequestCategory } from '@/types';
import { formatEntryMode } from './gameFormats';

export { LEVELS };

export const FORMAT_LABELS: Record<GameFormat, string> = {
  king_of_the_court: 'King of the Court',
  fixed_pairs: 'Fixed Pairs',
  king_queen_of_the_court: 'King & Queen of the Court',
  team_mexicano: 'Team Mexicano',
  social_shuffle: 'Social Shuffle',
  mini_tournament: 'Mini-Tournament',
};

/** Accent classes so each format reads differently in lists and badges. */
export const FORMAT_ACCENT: Record<GameFormat, string> = {
  king_of_the_court: 'bg-amber-500/15 text-amber-300',
  fixed_pairs: 'bg-sky-500/15 text-sky-300',
  king_queen_of_the_court: 'bg-rose-500/15 text-rose-300',
  team_mexicano: 'bg-primary/15 text-primary',
  social_shuffle: 'bg-violet-500/15 text-violet-300',
  mini_tournament: 'bg-orange-500/15 text-orange-300',
};

/** Letter labels aligned to the Viya padel level structure (Dubai Golf). */
export const LEVEL_LABELS: Record<Level | 'mixed', string> = {
  E: 'E — Entry',
  D: 'D',
  'D+': 'D+',
  C: 'C — Intermediate',
  'C Strong': 'C Strong',
  'C+': 'C+',
  B: 'B — Advanced',
  'B+': 'B+',
  A: 'A — Pro',
  'A+': 'A+ — Elite',
  mixed: 'Mixed',
};

export const LEADERBOARD_KIND_LABELS: Record<LeaderboardKind, string> = {
  community: 'Community',
  mens_c_plus: "Men's C+ League",
  womens_c: "Women's C League",
};

export const GAME_LEAGUE_LABELS: Record<GameLeague, string> = {
  mens_c_plus: "Men's C+ League",
  womens_c: "Women's C League",
};

export const SIDE_LABELS: Record<PreferredSide, string> = {
  left: 'Left', right: 'Right', both: 'Both',
};

export const BEST_HAND_LABELS: Record<BestHand, string> = {
  right: 'Right-handed', left: 'Left-handed', ambidextrous: 'Ambidextrous',
};

export const MATCH_TYPE_LABELS: Record<MatchTypePref, string> = {
  competitive: 'Competitive', social: 'Social', both: 'Both',
};

export const PLAY_TIME_LABELS: Record<PlayTimePref, string> = {
  morning: 'Mornings', afternoon: 'Afternoons', evening: 'Evenings',
};

/** Partner clubs players can pick as their preferred venues. */
export const PREFERRED_CLUBS = [
  'Padel Edition', 'Central Padel Al Quoz', 'ZY Padel',
] as const;

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male', female: 'Female', non_binary: 'Non-binary', prefer_not_to_say: 'Prefer not to say',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  imported: 'Imported', invited: 'Invited', pending: 'Pending',
  approved: 'Approved', rejected: 'Rejected', banned: 'Banned',
};

export const GAME_STATUS_META: Record<GameStatus, { label: string; className: string }> = {
  upcoming: { label: 'Upcoming', className: 'bg-blue-500/15 text-blue-300' },
  live: { label: 'Live', className: 'bg-primary/15 text-primary' },
  completed: { label: 'Completed', className: 'bg-white/10 text-white/60' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-300' },
};

export const KARMA_TIER_META: Record<KarmaTier, { label: string; className: string; dot: string }> = {
  good: { label: 'Good standing', className: 'bg-primary/15 text-primary', dot: 'bg-primary' },
  warning: { label: 'Warning', className: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-400' },
  restricted: { label: 'Restricted', className: 'bg-orange-500/15 text-orange-300', dot: 'bg-orange-400' },
  suspended: { label: 'Suspended', className: 'bg-red-500/15 text-red-300', dot: 'bg-red-400' },
};

export const PARTICIPANT_STATUS_META: Record<ParticipantStatus, { label: string; className: string }> = {
  registered: { label: 'Registered', className: 'bg-primary/15 text-primary' },
  confirmed: { label: 'Confirmed', className: 'bg-primary/15 text-primary' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-300' },
  no_show: { label: 'No-show', className: 'bg-red-500/15 text-red-300' },
  waitlisted: { label: 'Waitlisted', className: 'bg-white/10 text-white/60' },
  pending_replacement: { label: 'Finding replacement', className: 'bg-orange-500/15 text-orange-300' },
};

/** Formats where players register as a fixed pair / team of two. */
export function isFixedTeamFormat(format: GameFormat): boolean {
  return formatEntryMode(format) === 'team';
}

export const GENDER_RESTRICTION_LABELS: Record<NonNullable<Game['genderRestriction']>, string> = {
  male: 'Men only',
  female: 'Ladies only',
  mixed: 'Mixed (open)',
  mixed_pairs: 'Mixed only (man + woman)',
};

export const CLUB_AMENITY_LABELS: Record<ClubAmenity, string> = {
  cold_plunge: 'Cold plunge',
  sauna: 'Sauna',
  yoga_room: 'Yoga room',
  gym: 'Gym',
  recovery_center: 'Recovery center',
  cafeteria: 'Cafeteria',
  padel_equipment_shop: 'Padel equipment shop',
};

/** How long an off-app partner invite holds a roster spot. */
export const EXTERNAL_PARTNER_HOLD_HOURS = 24;

/** Hours before kickoff after which a cancel is "late" (pay or replacement). */
export const LATE_CANCEL_HOURS = 12;

/** Simulated organizer WhatsApp for late-cancel help when there is no waitlist. */
export const ADMIN_WHATSAPP_E164 = '971501234567';

export function hoursUntilGame(game: { date: string; startTime: string }): number {
  const start = new Date(`${game.date}T${game.startTime}:00`);
  return (start.getTime() - Date.now()) / 3600000;
}

export function isLateCancel(game: { date: string; startTime: string }): boolean {
  return hoursUntilGame(game) < LATE_CANCEL_HOURS;
}

export function adminWhatsAppUrl(message: string): string {
  return `https://wa.me/${ADMIN_WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

/** Open WhatsApp chat to a player’s contact number (E.164 with or without +). */
export function playerWhatsAppUrl(phoneE164: string, message?: string): string {
  const digits = phoneE164.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function communityInviteClaimUrl(token: string, origin?: string): string {
  const base = origin
    ?? (typeof window !== 'undefined' ? window.location.origin : 'https://padelnomads.com');
  return `${base.replace(/\/$/, '')}/claim/${token}`;
}

export function communityInviteWhatsAppMessage(opts: {
  inviteeName: string;
  referrerName: string;
  levelLabel: string;
  claimUrl: string;
  verified?: boolean;
}): string {
  const first = opts.inviteeName.trim().split(/\s+/)[0] || 'there';
  const verifiedBit = opts.verified ? ' (verified by Padel Nomads)' : '';
  return (
    `Hey ${first}! ${opts.referrerName} invited you to Padel Nomads. `
    + `Your profile is ready at level ${opts.levelLabel}${verifiedBit} — no application needed. `
    + `Join here: ${opts.claimUrl}`
  );
}

export function playerReferralApplyUrl(token: string, origin?: string): string {
  const base = origin
    ?? (typeof window !== 'undefined' ? window.location.origin : 'https://padelnomads.com');
  return `${base.replace(/\/$/, '')}/apply?ref=${encodeURIComponent(token)}`;
}

export function playerReferralWhatsAppMessage(opts: {
  friendName: string;
  referrerName: string;
  levelLabel: string;
  applyUrl: string;
}): string {
  const first = opts.friendName.trim().split(/\s+/)[0] || 'there';
  return (
    `Hey ${first}! ${opts.referrerName} invited you to join Padel Nomads. `
    + `They suggested level ${opts.levelLabel}. `
    + `Friend referrals get higher priority for community approval. `
    + `Finish your short application here: ${opts.applyUrl}`
  );
}

export const SUPPORT_CATEGORY_LABELS: Record<SupportRequestCategory, string> = {
  payment: 'Payment',
  booking: 'Booking',
  account: 'Account',
  other: 'Other',
};

export const KARMA_EVENT_LABELS: Record<KarmaEventType, string> = {
  on_time_game: 'Played on time',
  streak_bonus: 'Punctuality streak bonus',
  conduct_award: 'Good conduct award',
  successful_referral: 'Successful friend referral',
  late_cancellation: 'Late cancellation (<12h)',
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
