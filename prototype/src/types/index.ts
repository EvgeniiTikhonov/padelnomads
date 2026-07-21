// Domain types mirroring PRD v1.4 §15 — field names are the future API contract.

// PRD §15.1
export type Role = 'player' | 'admin';
export type UserStatus = 'imported' | 'invited' | 'pending' | 'approved' | 'rejected' | 'banned';
/** Viya / Dubai Golf letter ladder (E → A+). */
export const LEVELS = ['E', 'D', 'D+', 'C', 'C Strong', 'C+', 'B', 'B+', 'A', 'A+'] as const;
export type Level = (typeof LEVELS)[number];
export type PreferredSide = 'left' | 'right' | 'both';
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type KarmaTier = 'good' | 'warning' | 'restricted' | 'suspended';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  status: UserStatus;
  level: Level;
  levelVerified?: boolean;       // level verified by Padel Nomads (admin-granted)
  levelVerifiedAt?: string;
  levelVerifiedBy?: string;
  preferredSide: PreferredSide;
  gender?: Gender;
  whatsappOptIn: boolean; whatsappOptInAt?: string;
  whatsappMarketingOptIn: boolean; whatsappMarketingOptInAt?: string;
  whatsappOptOutAt?: string;
  source: 'signup' | 'import';
  importBatchId?: string;
  claimedAt?: string;
  karmaBalance: number;      // cached; authoritative = sum of KarmaEvents
  karmaTier: KarmaTier;
  points: number;            // leaderboard/sport rating (separate from karma)
  memberSince?: string;
  createdAt: string; updatedAt: string;
}

// PRD §15.2
export interface PlayerPhoneNumber {
  id: string; userId: string;
  phoneNumber: string;       // E.164, unique system-wide
  label: 'mobile' | 'work' | 'old' | string;
  isPrimary: boolean;
  verifiedAt?: string;
  source: 'signup' | 'import' | 'admin';
  createdAt: string; updatedAt: string;
}

// PRD §15.3
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export interface Application {
  id: string; userId?: string;
  name?: string;
  level: Level; preferredSide: PreferredSide; gender?: Gender;
  referralSource?: 'friend' | 'instagram' | 'facebook' | 'event' | 'search' | 'other';
  proofOfSkillFileUrl?: string;
  phoneNumber: string; email?: string;
  whatsappOptIn: boolean; whatsappMarketingOptIn: boolean;
  matchedExistingUserId?: string;
  blacklistFlag: boolean;
  status: ApplicationStatus;
  reviewedBy?: string; reviewedAt?: string;
  createdAt: string; updatedAt: string;
}

// PRD §15.4
export type GameFormat =
  | 'king_of_the_court' | 'fixed_pairs' | 'king_queen_of_the_court'
  | 'team_mexicano' | 'social_shuffle' | 'mini_tournament';
export type GameStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export interface Game {
  id: string; title: string; format: GameFormat; venue: string;
  date: string; startTime: string; endTime: string;
  courts: number; capacity: number; level: Level | 'mixed';
  genderRestriction?: 'male' | 'female' | 'mixed';
  price?: number; description?: string;
  status: GameStatus;
  deleted?: boolean;                // soft delete (prototype default)
  reminderSchedule?: string[];      // e.g. ['24h','2h']
  confirmationSchedule?: string;
  createdBy: string; createdAt: string; updatedAt: string;
}

// PRD §15.5
export type ParticipantStatus = 'registered' | 'confirmed' | 'cancelled' | 'no_show' | 'waitlisted';
export interface GameParticipant {
  id: string; gameId: string; userId: string; teamId?: string;
  status: ParticipantStatus;
  confirmationRequestedAt?: string; confirmedAt?: string; declinedAt?: string;
  cancelledAt?: string;             // drives late-cancellation karma
  attendance?: 'on_time' | 'late' | 'no_show';
  paymentStatus?: 'pending' | 'paid' | 'unpaid' | 'waived';
  position?: number; pointsAwarded?: number;
  createdAt: string; updatedAt: string;
}

// Team allocated to a court when a game goes live. Points are derived from the
// per-round matches (GameMatch), never stored directly on the team.
export interface GameTeam {
  id: string;
  gameId: string;
  name: string;                 // "Team 1"
  court: number;                // starting court number (1 = central / king court)
  playerIds: string[];          // usually 2
}

// One team-vs-team match on a court in a given round. Court movement means a
// team's court can change round to round, so the court is stored per match and
// drives the boosted-points calculation.
export interface GameMatch {
  id: string;
  gameId: string;
  round: number;                // 0-based round index
  court: number;                // court this match is played on
  teamAId: string;
  teamBId: string;
  scoreA: number | null;        // games won by team A (golden points)
  scoreB: number | null;
}

// PRD §15.6
export interface GameResult {
  id: string; gameId: string; userId: string; teamId?: string;
  finalPosition: number; points: number; scoreData?: string;
  createdAt: string; updatedAt: string;
}

// PRD §15.7
export interface Offer {
  id: string; title: string; partnerName: string; description: string;
  promoCode?: string; link?: string; imageUrl?: string;
  startDate: string; endDate: string; status: 'active' | 'inactive';
  createdAt: string; updatedAt: string;
}

// PRD §15.8
export interface AppNotification {
  id: string; userId: string; title: string; message: string;
  type: string; channel: 'in_app' | 'whatsapp';
  isRead: boolean; relatedOutboundMessageId?: string; createdAt: string;
}

// PRD §15.17
export type KarmaEventType =
  | 'on_time_game' | 'streak_bonus' | 'conduct_award'
  | 'late_cancellation' | 'very_late_cancellation' | 'no_show' | 'late_arrival'
  | 'non_payment' | 'non_payment_reversal'
  | 'misconduct_minor' | 'misconduct_major' | 'manual_correction' | 'decay_expiry';
export interface KarmaEvent {
  id: string; userId: string; eventType: KarmaEventType; points: number;
  gameId?: string; reasonCode?: string; note?: string;
  source: 'system' | 'admin'; performedBy?: string; compensatesEventId?: string;
  balanceAfter: number; tierAfter: KarmaTier; createdAt: string;
}

// PRD §15.9
export interface MessageTemplate {
  id: string; metaTemplateName: string;
  category: 'utility' | 'marketing' | 'authentication';
  language: string; bodyText: string;
  variables: string[]; buttons?: string[];
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string; updatedAt: string;
}

// PRD §15.10
export interface OutboundMessage {
  id: string; waMessageId?: string; userId: string; phoneNumberUsed: string;
  templateId?: string; campaignId?: string;
  type: 'template' | 'text' | 'media';
  payload: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'dropped';
  errorCode?: string; errorDetail?: string;
  scheduledFor?: string; sentAt?: string;
  createdAt: string; updatedAt: string;
}

// PRD §15.11
export interface InboundMessage {
  id: string; waMessageId: string; fromPhone: string; userId?: string;
  type: 'text' | 'button_reply' | 'media' | 'system';
  body: string; buttonPayload?: string;
  handled: boolean; handledBy?: string; handledAt?: string;
  receivedAt: string; createdAt: string;
}

// PRD §15.12
export interface ImportBatch {
  id: string; sourceType: 'whatsapp_export' | 'google_sheet' | 'csv';
  fileName: string; mappingConfig?: string;
  status: 'preview' | 'committed' | 'rolled_back';
  createdBy: string; createdAt: string; committedAt?: string;
}
export interface ImportRecord {
  id: string; importBatchId: string; rowNumber: number;
  rawData: string; resolvedUserId?: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  errorDetail?: string; createdAt: string;
}

// PRD §15.13
export interface PlayerMergeLog {
  id: string; survivorUserId: string; absorbedUserId: string;
  movedData: string; fieldResolutions?: string;
  performedBy: string; performedAt: string; undoneAt?: string;
}

// PRD §15.14
export interface BanRecord {
  id: string; userId?: string;
  phoneNumbers: string[]; email?: string;
  action: 'ban' | 'unban' | 'blacklist_number' | 'override_approve';
  reasonCode: string; note?: string; expiresAt?: string;
  performedBy: string; createdAt: string;
}

// PRD §15.15
export interface RatingAdjustment {
  id: string; userId: string;
  adjustmentType: 'delta' | 'absolute';
  pointsBefore: number; pointsAfter: number;
  reasonCode: string; note?: string;
  performedBy: string; createdAt: string;
}

// PRD §15.16
export interface ActivityLog {
  id: string; userId: string;
  eventType: 'application' | 'registration' | 'confirmation' | 'attendance' | 'result' | 'offer' | 'consent' | 'admin_action' | 'merge' | 'ban';
  relatedEntityType: string; relatedEntityId: string;
  summary: string; createdAt: string;
}

// Mock session (prototype-only, replaces real auth)
export type ViewRole = 'visitor' | 'player' | 'admin';
export interface MockSession {
  viewRole: ViewRole;
  currentUserId: string;          // which player the "player" view impersonates
  applicationStatus: 'pending' | 'approved' | 'rejected' | 'banned';
}
