'use client';

import * as React from 'react';
import { toast } from 'sonner';
import type {
  User, PlayerPhoneNumber, Application, Game, GameParticipant, GameTeam, GameMatch, Offer, Club,
  AppNotification, KarmaEvent, MessageTemplate, OutboundMessage, InboundMessage,
  ImportBatch, ImportRecord, PlayerMergeLog, BanRecord, RatingAdjustment, ActivityLog,
  ExternalPartnerInvite, CommunityInvite, PlayerReferral, ConsentRecord, GameChatMessage, DirectMessage, MockSession, ViewRole, KarmaEventType, GameStatus, ParticipantStatus, Level,
  GameFormat, SupportRequest, SupportRequestCategory, PreferredSide, Gender,
} from '@/types';
import { computeStandings, generateNextRoundMatches } from '@/lib/scoring';
import {
  seedUsers, seedPhones, seedApplications, seedGames, seedParticipants, seedGameTeams, seedGameMatches,
  seedOffers, seedClubs, seedNotifications, seedSupportRequests, seedCommunityInvites, seedPlayerReferrals, seedConsents, seedChatMessages, seedDirectMessages, seedChatReads, seedKarmaEvents, seedTemplates, seedOutbound,
  seedInbound, seedImportBatches, seedImportRecords, seedDuplicates,
  seedBanRecords, seedRatingAdjustments, seedActivityLogs, seedMergeLogs,
  type DuplicateCandidate,
} from './mock';
import {
  karmaTierFor, KARMA_EVENT_LABELS, SUPPORT_CATEGORY_LABELS, LEVEL_LABELS,
  isFixedTeamFormat, EXTERNAL_PARTNER_HOLD_HOURS,
  playerWhatsAppUrl, communityInviteClaimUrl, communityInviteWhatsAppMessage,
  playerReferralApplyUrl, playerReferralWhatsAppMessage,
} from '@/lib/format';
import {
  TERMS_AND_PRIVACY_VERSION,
  TERMS_AND_PRIVACY_CONSENT_TEXT,
  WHATSAPP_SERVICE_CONSENT_TEXT,
} from '@/lib/legal';
import { canChatInGame, gameChatReadKey, dmChatReadKey, dmThreadId, CHAT_MESSAGE_MAX_LENGTH } from '@/lib/chat';
import { spotsTaken, fixedTeamsTaken, maxFixedTeams, isGameFull, clampFixedTeamRosters } from '@/lib/derive';
import {
  nextWaitlistPromotions, promoteWaitlistParticipants, waitlistOrdered, waitlistPosition,
} from '@/lib/waitlist';
import {
  enforcePartnerNameDeadlines,
  partnerNameDueAtFrom,
  type TeamEntryKind,
} from '@/lib/teamPriority';
import { gameJoinEligibility, partnerPairEligibility, requiresMixedGenderPair, isBinaryGender } from '@/lib/eligibility';
import { buildOrderedTeams, courtForIndex, teamLabel, type OrderedTeams, type StrengthContext } from '@/lib/allocation';
import { playerMatchRecords, winLossStats } from '@/lib/playerStats';
import {
  SEED_FORMAT_DEFINITIONS,
  syncRuntimeFormatConfig,
  type FormatDefinition,
} from '@/lib/gameFormats';

// Prototype flag (see NOTES.md / PRD §20 open questions)
export const ALLOW_SELF_REGISTER = true;

interface StoreState {
  users: User[];
  phones: PlayerPhoneNumber[];
  applications: Application[];
  consents: ConsentRecord[];
  games: Game[];
  participants: GameParticipant[];
  teams: GameTeam[];
  matches: GameMatch[];
  offers: Offer[];
  clubs: Club[];
  notifications: AppNotification[];
  supportRequests: SupportRequest[];
  karmaEvents: KarmaEvent[];
  templates: MessageTemplate[];
  outbound: OutboundMessage[];
  inbound: InboundMessage[];
  importBatches: ImportBatch[];
  importRecords: ImportRecord[];
  duplicates: DuplicateCandidate[];
  banRecords: BanRecord[];
  ratingAdjustments: RatingAdjustment[];
  activityLogs: ActivityLog[];
  mergeLogs: PlayerMergeLog[];
  externalPartnerInvites: ExternalPartnerInvite[];
  communityInvites: CommunityInvite[];
  playerReferrals: PlayerReferral[];
  chatMessages: GameChatMessage[];
  directMessages: DirectMessage[];
  /** Last-read markers keyed `game:{gameId}:{userId}` or `dm:{threadId}:{userId}` → ISO. */
  chatReads: Record<string, string>;
  /** Learned per-player strength bias from past manual court adjustments. */
  allocationBiases: Record<string, number>;
  /** Admin-editable game format catalogue. */
  formatDefinitions: FormatDefinition[];
  session: MockSession;
}

export interface ApplicationFormInput {
  name: string;
  level: Application['level'];
  preferredSide: Application['preferredSide'];
  gender?: Application['gender'];
  referralSource?: Application['referralSource'];
  referrerPhoneNumber?: string;
  referredByUserId?: string;
  playerReferralId?: string;
  proofOfSkillFileUrl?: string;
  phoneNumber: string;
  email?: string;
  whatsappOptIn: boolean;
  whatsappMarketingOptIn: boolean;
  /** Required: Terms + Privacy + personal-data processing consent. */
  termsAndPrivacyAccepted: boolean;
  termsAndPrivacyVersion: string;
  termsAndPrivacyConsentText: string;
  whatsappServiceConsentText: string;
}

export interface GameFormInput {
  title: string; format: Game['format']; venue: string;
  date: string; startTime: string; endTime: string;
  courts: number; capacity: number; level: Game['level'];
  genderRestriction?: Game['genderRestriction'];
  price?: number; description?: string;
  reminderSchedule: string[]; confirmationSchedule?: string;
}

interface MockDataContextValue extends StoreState {
  // session
  setViewRole: (role: ViewRole) => void;
  setApplicationStatus: (s: MockSession['applicationStatus']) => void;
  /** Prototype only: impersonate another approved player. */
  setCurrentUserId: (userId: string) => void;
  currentUser: User;
  // public
  submitApplication: (input: ApplicationFormInput) => Application;
  // admin: applications
  approveApplication: (id: string, overrideReason?: string) => void;
  rejectApplication: (id: string) => void;
  setApplicationStatusAdmin: (id: string, status: Application['status']) => void;
  /** Admin: invite a friend with a preset profile (skips application approval). */
  createCommunityInvite: (input: {
    name: string;
    phoneNumber: string;
    email?: string;
    level: Level;
    levelVerified: boolean;
    preferredSide: PreferredSide;
    gender?: Gender;
    referredByUserId: string;
    openWhatsApp?: boolean;
  }) => CommunityInvite | null;
  resendCommunityInviteWhatsApp: (inviteId: string) => void;
  revokeCommunityInvite: (inviteId: string) => void;
  /** Public: claim invite token → approved member, no admin approval. */
  claimCommunityInvite: (token: string, opts?: { whatsappOptIn?: boolean }) => boolean;
  /** Player: invite a friend to apply (WhatsApp share + apply?ref= link). */
  createPlayerReferral: (input: {
    friendName: string;
    friendPhone: string;
    level: Level;
    openWhatsApp?: boolean;
  }) => PlayerReferral | null;
  resendPlayerReferralWhatsApp: (referralId: string) => void;
  revokePlayerReferral: (referralId: string) => void;
  // games
  createGame: (input: GameFormInput) => Game;
  updateGame: (id: string, patch: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  setGameStatus: (id: string, status: GameStatus) => void;
  addPlayerToGame: (gameId: string, userId: string, opts?: { overrideReason?: string }) => boolean;
  removePlayerFromGame: (gameId: string, userId: string) => void;
  // game day: start (allocate teams + prefill), record match scores, advance
  // rounds (court movement), then collect & complete.
  startGame: (gameId: string) => void;
  // court distribution (pre-game): auto-seed strongest pairs on top courts,
  // let admins hand-adjust, then finalize + generate the WhatsApp announcement.
  prepareDistribution: (gameId: string) => void;
  saveDistribution: (gameId: string, orderedTeams: string[][]) => void;
  finalizeDistribution: (gameId: string) => void;
  reopenDistribution: (gameId: string) => void;
  /** Ordered team list (strongest first) currently seeded for a game, or null. */
  distributionFor: (gameId: string) => OrderedTeams | null;
  updateMatchScore: (matchId: string, side: 'A' | 'B', value: number | null) => void;
  generateNextRound: (gameId: string, fromRound: number) => void;
  collectScores: (gameId: string) => void;
  // player participation
  registerForGame: (
    gameId: string,
    userId: string,
    opts?: {
      lookingForPartner?: boolean;
      /** Join as a linked team with this partner (main list or waitlist). */
      withPartnerUserId?: string;
      /** Full pair: partner's name provided at registration (off-app). */
      partnerName?: string;
      /** Player + Partner: will send partner name by 8:00 PM same day. */
      partnerPending?: boolean;
    },
  ) => void;
  /** Fulfill partner_pending by providing the partner's name before the deadline. */
  submitPartnerName: (gameId: string, userId: string, partnerName: string) => void;
  confirmParticipation: (gameId: string, userId: string) => void;
  /** Player taps “Let’s go” on a confirmed game. */
  markLetsGo: (gameId: string, userId: string) => void;
  /** Free cancel (≥12h before start). For late cancels use cancelWithPayment / offerReplacement. */
  declineParticipation: (gameId: string, userId: string) => void;
  /** Late cancel: leave the game and pay the fee. */
  cancelWithPayment: (gameId: string, userId: string) => void;
  /** Late cancel: hold the spot until a waitlisted player claims it. */
  offerReplacement: (gameId: string, userId: string) => void;
  /** Waitlisted player takes a spot offered via late-cancel replacement. */
  claimWaitlistSpot: (gameId: string, userId: string) => void;
  /** Fixed-team formats: invite a community member (on the game or not) as your partner. */
  invitePartner: (gameId: string, fromUserId: string, toUserId: string) => void;
  /**
   * Fixed-team formats: propose joining a solo player who needs a partner.
   * That player gets a notification and can accept / decline.
   */
  proposePartnerJoin: (gameId: string, proposerId: string, soloUserId: string) => void;
  acceptPartnerInvite: (gameId: string, userId: string) => void;
  declinePartnerInvite: (gameId: string, userId: string) => void;
  /** Fixed-team formats: invite a friend who is not on the app (WhatsApp + 24h spot hold). */
  inviteExternalPartner: (gameId: string, fromUserId: string, friendName: string, friendPhone: string) => void;
  // in-game
  setParticipantStatus: (participantId: string, status: ParticipantStatus) => void;
  markAttendance: (participantId: string, value: NonNullable<GameParticipant['attendance']>) => void;
  markPayment: (participantId: string, value: NonNullable<GameParticipant['paymentStatus']>) => void;
  // offers
  createOffer: (input: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOffer: (id: string, patch: Partial<Offer>) => void;
  toggleOffer: (id: string) => void;
  deleteOffer: (id: string) => void;
  sendOfferToSegment: (offerId: string, segment: string, count: number) => void;
  // clubs
  createClub: (input: Omit<Club, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateClub: (id: string, patch: Partial<Club>) => void;
  toggleClub: (id: string) => void;
  deleteClub: (id: string) => void;
  // notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  /** Player support ticket → admin notification (manual follow-up until payment/chat gate exists). */
  submitSupportRequest: (input: {
    issue: string;
    contactPhone: string;
    category: SupportRequestCategory;
  }) => void;
  // game chat + DMs
  sendGameChatMessage: (gameId: string, body: string) => void;
  markGameChatRead: (gameId: string) => void;
  sendDirectMessage: (toUserId: string, body: string) => void;
  markDirectChatRead: (otherUserId: string) => void;
  // profile
  addPhoneNumber: (userId: string, phoneNumber: string, label: string) => void;
  setWhatsappPref: (userId: string, key: 'whatsappOptIn' | 'whatsappMarketingOptIn', value: boolean) => void;
  setPlayerPreferences: (userId: string, patch: Partial<Pick<User, 'preferredSide' | 'bestHand' | 'preferredMatchType' | 'preferredPlayTime' | 'preferredClubs'>>) => void;
  // player management
  banPlayer: (userId: string, reasonCode: string, note: string) => void;
  unbanPlayer: (userId: string, note: string) => void;
  addKarmaEvent: (userId: string, eventType: KarmaEventType, points: number, reasonCode?: string, note?: string) => void;
  adjustRating: (userId: string, type: 'delta' | 'absolute', value: number, reasonCode: string, note?: string) => void;
  mergeDuplicate: (dupId: string, survivorId: string) => void;
  dismissDuplicate: (dupId: string) => void;
  editPlayer: (userId: string, patch: Partial<User>) => void;
  /** Admin manually sets a player's level (clears verification; re-verify separately). */
  setPlayerLevel: (userId: string, level: Level) => void;
  setLevelVerified: (userId: string, verified: boolean) => void;
  /** Admin: update a game format definition (solo/team, gender, points, structure…). */
  updateFormatDefinition: (id: GameFormat, patch: Partial<FormatDefinition>) => void;
  formatDefinition: (id: GameFormat) => FormatDefinition | undefined;
}

const MockDataContext = React.createContext<MockDataContextValue | null>(null);

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}${++idCounter}`;
const now = () => new Date().toISOString();

/** Strength inputs (win rate + learned bias) derived from a store snapshot. */
function makeStrengthContext(s: StoreState): StrengthContext {
  return {
    winRateFor: (uid) => winLossStats(playerMatchRecords(uid, s.games, s.teams, s.matches)).winRate,
    biasFor: (uid) => s.allocationBiases[uid] ?? 0,
  };
}

/** Turn an ordered team list into GameTeam rows with derived court numbers. */
function orderedToTeams(gameId: string, ordered: OrderedTeams, users: User[]): GameTeam[] {
  return ordered.map((playerIds, i) => ({
    id: nextId('t'),
    gameId,
    name: teamLabel(playerIds, users),
    court: courtForIndex(i),
    playerIds,
  }));
}

const SESSION_KEY = 'pn-proto-session';
const DEFAULT_SESSION: MockSession = { viewRole: 'visitor', currentUserId: 'u1', applicationStatus: 'approved' };

// Session survives page reloads (data itself intentionally resets to seed state).
function loadSession(): MockSession {
  if (typeof window === 'undefined') return DEFAULT_SESSION;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? { ...DEFAULT_SESSION, ...(JSON.parse(raw) as Partial<MockSession>) } : DEFAULT_SESSION;
  } catch {
    return DEFAULT_SESSION;
  }
}

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  // Render client-side only: seed data is generated relative to "now", which would
  // otherwise mismatch between server render and client hydration.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [state, setState] = React.useState<StoreState>(() => {
    const deadline = enforcePartnerNameDeadlines(seedParticipants, seedGames);
    return {
    users: seedUsers,
    phones: seedPhones,
    applications: seedApplications,
    consents: seedConsents,
    games: seedGames,
    participants: clampFixedTeamRosters(deadline.participants, seedGames),
    teams: seedGameTeams,
    matches: seedGameMatches,
    offers: seedOffers,
    clubs: seedClubs,
    notifications: seedNotifications,
    supportRequests: seedSupportRequests,
    karmaEvents: seedKarmaEvents,
    templates: seedTemplates,
    outbound: seedOutbound,
    inbound: seedInbound,
    importBatches: seedImportBatches,
    importRecords: seedImportRecords,
    duplicates: seedDuplicates,
    banRecords: seedBanRecords,
    ratingAdjustments: seedRatingAdjustments,
    activityLogs: seedActivityLogs,
    mergeLogs: seedMergeLogs,
    externalPartnerInvites: [],
    communityInvites: seedCommunityInvites,
    playerReferrals: seedPlayerReferrals,
    chatMessages: seedChatMessages,
    directMessages: seedDirectMessages,
    chatReads: seedChatReads,
    allocationBiases: {},
    formatDefinitions: SEED_FORMAT_DEFINITIONS.map((d) => ({ ...d, allowedGenderModes: [...d.allowedGenderModes], boostedRounds: [...d.boostedRounds], notes: [...d.notes] })),
    session: loadSession(),
  };
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }, [state.session]);

  // Enforce partner-name deadlines (8:00 PM) periodically in the prototype
  React.useEffect(() => {
    const tick = () => {
      setState((s) => {
        const { participants, demotedUserIds } = enforcePartnerNameDeadlines(s.participants, s.games);
        if (demotedUserIds.length === 0) return s;
        const demotedParts = s.participants.filter(
          (p) => demotedUserIds.includes(p.userId) && p.teamEntryKind === 'partner_pending'
            && !['cancelled', 'waitlisted'].includes(p.status),
        );
        let next: StoreState = { ...s, participants };
        const at = now();
        for (const part of demotedParts) {
          const game = s.games.find((g) => g.id === part.gameId);
          next = {
            ...next,
            notifications: [
              {
                id: nextId('n'),
                userId: part.userId,
                title: 'Moved to waitlist',
                message: `Partner name was not provided by 8:00 PM${game ? ` for ${game.title}` : ''}. Your spot was moved to the waiting list.`,
                type: 'partner_deadline_missed',
                channel: 'whatsapp' as const,
                isRead: false,
                relatedGameId: part.gameId,
                createdAt: at,
              },
              ...next.notifications,
            ],
          };
        }
        const gameIds = [...new Set(demotedParts.map((p) => p.gameId))];
        for (const gameId of gameIds) {
          const game = next.games.find((g) => g.id === gameId);
          if (!game) continue;
          const candidates = nextWaitlistPromotions(
            next.participants, next.users, game, next.externalPartnerInvites,
          );
          if (candidates.length === 0) continue;
          next = {
            ...next,
            participants: promoteWaitlistParticipants(
              next.participants,
              candidates.map((c) => c.id),
              at,
              { fixedTeam: isFixedTeamFormat(game.format) },
            ),
          };
          for (const c of candidates) {
            next = {
              ...next,
              notifications: [
                {
                  id: nextId('n'),
                  userId: c.userId,
                  title: 'You\'re in!',
                  message: `A spot opened on ${game.title} — you were promoted from the waitlist. Please confirm your spot.`,
                  type: 'waitlist_promoted',
                  channel: 'whatsapp' as const,
                  isRead: false,
                  relatedGameId: gameId,
                  createdAt: at,
                },
                ...next.notifications,
              ],
            };
          }
        }
        return next;
      });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const value = React.useMemo<MockDataContextValue>(() => {
    const patchUser = (s: StoreState, userId: string, patch: Partial<User>): StoreState => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, ...patch, updatedAt: now() } : u)),
    });

    const pushNotification = (
      s: StoreState,
      userId: string,
      title: string,
      message: string,
      type: string,
      channel: 'in_app' | 'whatsapp' = 'in_app',
      related?: {
        gameId?: string;
        offerId?: string;
        applicationId?: string;
        supportRequestId?: string;
        audience?: 'player' | 'admin';
      },
    ): StoreState => ({
      ...s,
      notifications: [
        {
          id: nextId('n'),
          userId,
          title,
          message,
          type,
          channel,
          isRead: false,
          relatedGameId: related?.gameId,
          relatedOfferId: related?.offerId,
          relatedApplicationId: related?.applicationId,
          relatedSupportRequestId: related?.supportRequestId,
          audience: related?.audience,
          createdAt: now(),
        },
        ...s.notifications,
      ],
    });

    /** Important events that need organizer attention. */
    const pushAdminAttention = (
      s: StoreState,
      title: string,
      message: string,
      type: string,
      related?: { gameId?: string; applicationId?: string; supportRequestId?: string },
    ): StoreState => {
      const admins = s.users.filter((u) => u.role === 'admin');
      let next = s;
      for (const admin of admins) {
        next = pushNotification(
          next,
          admin.id,
          title,
          message,
          type,
          'in_app',
          { ...related, audience: 'admin' },
        );
      }
      return next;
    };

    /**
     * Fill open main-list seats from the waitlist (highest karma first).
     * Fixed-team games promote one solo/pair unit per free team slot.
     * Skips restricted / suspended / banned players.
     */
    const fillFromWaitlist = (s: StoreState, gameId: string): { next: StoreState; promoted: GameParticipant[] } => {
      const game = s.games.find((g) => g.id === gameId);
      if (!game) return { next: s, promoted: [] };
      const candidates = nextWaitlistPromotions(
        s.participants, s.users, game, s.externalPartnerInvites,
      );
      if (candidates.length === 0) return { next: s, promoted: [] };
      const at = now();
      const fixedTeam = isFixedTeamFormat(game.format);
      let next: StoreState = {
        ...s,
        participants: promoteWaitlistParticipants(
          s.participants,
          candidates.map((c) => c.id),
          at,
          { fixedTeam },
        ),
      };
      for (const c of candidates) {
        const u = s.users.find((x) => x.id === c.userId);
        next = pushNotification(
          next,
          c.userId,
          'You\'re in!',
          `A spot opened on ${game.title} — you were promoted from the waitlist (karma priority${u ? `, balance ${u.karmaBalance}` : ''}). Please confirm your spot.`,
          'waitlist_promoted',
          'whatsapp',
          { gameId },
        );
      }
      return { next, promoted: candidates };
    };

    const applyKarma = (s: StoreState, userId: string, eventType: KarmaEventType, points: number, opts: { gameId?: string; reasonCode?: string; note?: string; performedBy?: string } = {}): StoreState => {
      const user = s.users.find((u) => u.id === userId);
      if (!user) return s;
      const balanceAfter = Math.min(100, Math.max(-50, user.karmaBalance + points));
      const event: KarmaEvent = {
        id: nextId('k'), userId, eventType, points,
        gameId: opts.gameId, reasonCode: opts.reasonCode, note: opts.note,
        source: opts.performedBy ? 'admin' : 'system', performedBy: opts.performedBy,
        balanceAfter, tierAfter: karmaTierFor(balanceAfter), createdAt: now(),
      };
      return patchUser(
        { ...s, karmaEvents: [event, ...s.karmaEvents] },
        userId,
        { karmaBalance: balanceAfter, karmaTier: karmaTierFor(balanceAfter) },
      );
    };

    return {
      ...state,
      currentUser: state.users.find((u) => u.id === state.session.currentUserId) ?? state.users[0],

      setViewRole: (viewRole) =>
        setState((s) => ({ ...s, session: { ...s.session, viewRole } })),
      setApplicationStatus: (applicationStatus) =>
        setState((s) => ({ ...s, session: { ...s.session, applicationStatus } })),
      setCurrentUserId: (currentUserId) =>
        setState((s) => ({ ...s, session: { ...s.session, currentUserId } })),

      submitApplication: (input) => {
        const matched = state.users.find((u) =>
          state.phones.some((p) => p.userId === u.id && p.phoneNumber === input.phoneNumber));
        const blacklisted = state.banRecords.some((b) =>
          b.phoneNumbers.includes(input.phoneNumber) || (input.email && b.email === input.email));
        const referral = input.playerReferralId
          ? state.playerReferrals.find((r) => r.id === input.playerReferralId)
          : undefined;
        const referredByUserId = input.referredByUserId
          ?? referral?.fromUserId;
        const referrer = referredByUserId
          ? state.users.find((u) => u.id === referredByUserId)
          : undefined;
        const capturedAt = now();
        const app: Application = {
          id: nextId('a'),
          name: input.name || undefined,
          level: input.level, preferredSide: input.preferredSide, gender: input.gender,
          referralSource: input.referralSource,
          referrerPhoneNumber: input.referrerPhoneNumber,
          referredByUserId,
          playerReferralId: input.playerReferralId ?? referral?.id,
          proofOfSkillFileUrl: input.proofOfSkillFileUrl,
          phoneNumber: input.phoneNumber, email: input.email,
          whatsappOptIn: input.whatsappOptIn, whatsappMarketingOptIn: input.whatsappMarketingOptIn,
          termsAndPrivacyAcceptedAt: input.termsAndPrivacyAccepted ? capturedAt : undefined,
          termsAndPrivacyVersion: input.termsAndPrivacyAccepted
            ? (input.termsAndPrivacyVersion || TERMS_AND_PRIVACY_VERSION)
            : undefined,
          matchedExistingUserId: matched?.id, blacklistFlag: blacklisted,
          status: 'pending', createdAt: capturedAt, updatedAt: capturedAt,
        };
        const consentRows: ConsentRecord[] = [];
        if (input.termsAndPrivacyAccepted) {
          consentRows.push({
            id: nextId('c'),
            applicationId: app.id,
            type: 'terms_and_privacy',
            granted: true,
            documentVersion: input.termsAndPrivacyVersion || TERMS_AND_PRIVACY_VERSION,
            consentTextSnapshot: input.termsAndPrivacyConsentText || TERMS_AND_PRIVACY_CONSENT_TEXT,
            method: 'apply_form',
            capturedAt,
          });
        }
        if (input.whatsappOptIn) {
          consentRows.push({
            id: nextId('c'),
            applicationId: app.id,
            type: 'whatsapp_service',
            granted: true,
            documentVersion: TERMS_AND_PRIVACY_VERSION,
            consentTextSnapshot: input.whatsappServiceConsentText || WHATSAPP_SERVICE_CONSENT_TEXT,
            method: 'apply_form',
            capturedAt,
          });
        }
        setState((s) => {
          let next: StoreState = {
            ...s,
            applications: [app, ...s.applications],
            consents: [...consentRows, ...s.consents],
            session: { ...s.session, applicationStatus: 'pending' },
          };
          if (app.playerReferralId) {
            next = {
              ...next,
              playerReferrals: next.playerReferrals.map((r) =>
                r.id === app.playerReferralId
                  ? { ...r, status: 'applied' as const, applicationId: app.id }
                  : r),
            };
          }
          const name = app.name?.trim() || app.phoneNumber;
          const referralBit = referrer
            ? ` · referral from ${referrer.name}`
            : '';
          next = pushAdminAttention(
            next,
            referrer ? 'New referral application' : 'New application',
            `${name} applied (${app.level})${referralBit}${app.blacklistFlag ? ' · blacklist flag' : ''}${app.matchedExistingUserId ? ' · identity match' : ''}.`,
            'admin_new_application',
            { applicationId: app.id },
          );
          return next;
        });
        toast.success('Application submitted', {
          description: referrer
            ? `Tagged as referral from ${referrer.name}. Awaiting admin review.`
            : 'Identity match and blacklist checks completed (simulated).',
        });
        return app;
      },

      approveApplication: (id, overrideReason) => {
        const appBefore = state.applications.find((a) => a.id === id);
        setState((s) => {
          const app = s.applications.find((a) => a.id === id);
          if (!app || app.status === 'approved') return s;
          let next: StoreState = {
            ...s,
            applications: s.applications.map((a) =>
              a.id === id ? { ...a, status: 'approved' as const, reviewedBy: 'admin1', reviewedAt: now(), updatedAt: now() } : a),
          };
          if (app.matchedExistingUserId) {
            next = patchUser(next, app.matchedExistingUserId, {
              status: 'approved',
              claimedAt: now(),
              ...(app.referredByUserId ? { referredByUserId: app.referredByUserId } : {}),
            });
          }
          if (app.blacklistFlag && overrideReason) {
            next = {
              ...next,
              banRecords: [
                { id: nextId('br'), userId: app.matchedExistingUserId, phoneNumbers: [app.phoneNumber], email: app.email, action: 'override_approve', reasonCode: 'admin_override', note: overrideReason, performedBy: 'admin1', createdAt: now() },
                ...next.banRecords,
              ],
            };
          }
          if (app.referredByUserId) {
            const friendName = app.name?.trim() || app.phoneNumber;
            next = applyKarma(next, app.referredByUserId, 'successful_referral', 20, {
              reasonCode: 'player_referral',
              note: `${friendName} approved via your referral`,
            });
            next = pushNotification(
              next,
              app.referredByUserId,
              'Referral approved · +20 karma',
              `${friendName} was approved to Padel Nomads thanks to your invite. You earned +20 karma.`,
              'referral_approved',
              'in_app',
            );
          }
          return next;
        });
        toast.success('Application approved', {
          description: appBefore?.referredByUserId
            ? 'Welcome sent (simulated). Referrer earned +20 karma.'
            : 'WhatsApp welcome message sent (simulated).',
        });
      },

      rejectApplication: (id) => {
        setState((s) => ({
          ...s,
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, status: 'rejected' as const, reviewedBy: 'admin1', reviewedAt: now(), updatedAt: now() } : a),
        }));
        toast('Application rejected');
      },

      setApplicationStatusAdmin: (id, status) => {
        setState((s) => {
          const app = s.applications.find((a) => a.id === id);
          if (!app) return s;
          let next: StoreState = {
            ...s,
            applications: s.applications.map((a) =>
              a.id === id ? { ...a, status, reviewedBy: 'admin1', reviewedAt: now(), updatedAt: now() } : a),
          };
          if (status === 'approved' && app.status !== 'approved' && app.referredByUserId) {
            const friendName = app.name?.trim() || app.phoneNumber;
            next = applyKarma(next, app.referredByUserId, 'successful_referral', 20, {
              reasonCode: 'player_referral',
              note: `${friendName} approved via your referral`,
            });
            next = pushNotification(
              next,
              app.referredByUserId,
              'Referral approved · +20 karma',
              `${friendName} was approved to Padel Nomads thanks to your invite. You earned +20 karma.`,
              'referral_approved',
              'in_app',
            );
          }
          return next;
        });
        toast('Application status updated');
      },

      createCommunityInvite: (input) => {
        const name = input.name.trim();
        const phone = input.phoneNumber.trim();
        if (!name) {
          toast.error('Name required');
          return null;
        }
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
          toast.error('Invalid phone', { description: 'Use E.164, e.g. +971501234567.' });
          return null;
        }
        const referrer = state.users.find(
          (u) => u.id === input.referredByUserId && u.role === 'player' && u.status === 'approved',
        );
        if (!referrer) {
          toast.error('Pick a referring Nomad', { description: 'Choose an approved community member.' });
          return null;
        }
        const phoneTaken = state.phones.some((p) => p.phoneNumber === phone);
        if (phoneTaken) {
          toast.error('Phone already registered', {
            description: 'This number belongs to an existing player or pending invite.',
          });
          return null;
        }

        const created = now();
        const userId = nextId('u');
        const inviteId = nextId('ci');
        const token = `inv${inviteId.replace(/\D/g, '').slice(-6) || Date.now().toString(36)}`;
        const adminId = state.session.currentUserId;

        const user: User = {
          id: userId,
          name,
          email: input.email?.trim() || undefined,
          role: 'player',
          status: 'invited',
          level: input.level,
          levelVerified: input.levelVerified,
          levelVerifiedAt: input.levelVerified ? created : undefined,
          levelVerifiedBy: input.levelVerified ? adminId : undefined,
          preferredSide: input.preferredSide,
          gender: input.gender,
          whatsappOptIn: true,
          whatsappOptInAt: created,
          whatsappMarketingOptIn: false,
          source: 'invite',
          referredByUserId: referrer.id,
          karmaBalance: 100,
          karmaTier: 'good',
          points: 0,
          createdAt: created,
          updatedAt: created,
        };
        const phoneRow: PlayerPhoneNumber = {
          id: nextId('ph'),
          userId,
          phoneNumber: phone,
          label: 'mobile',
          isPrimary: true,
          source: 'admin',
          createdAt: created,
          updatedAt: created,
        };
        const invite: CommunityInvite = {
          id: inviteId,
          token,
          name,
          phoneNumber: phone,
          email: input.email?.trim() || undefined,
          level: input.level,
          levelVerified: input.levelVerified,
          preferredSide: input.preferredSide,
          gender: input.gender,
          referredByUserId: referrer.id,
          createdByAdminId: adminId,
          userId,
          status: 'pending',
          createdAt: created,
          whatsappOpenedAt: input.openWhatsApp !== false ? created : undefined,
        };

        setState((s) => ({
          ...s,
          users: [...s.users, user],
          phones: [...s.phones, phoneRow],
          communityInvites: [invite, ...s.communityInvites],
          activityLogs: [
            {
              id: nextId('al'),
              userId: adminId,
              eventType: 'admin_action',
              relatedEntityType: 'community_invite',
              relatedEntityId: inviteId,
              summary: `Invited ${name} (${LEVEL_LABELS[input.level]}${input.levelVerified ? ', verified' : ''}) referred by ${referrer.name}`,
              createdAt: created,
            },
            ...s.activityLogs,
          ],
        }));

        if (input.openWhatsApp !== false && typeof window !== 'undefined') {
          const claimUrl = communityInviteClaimUrl(token);
          const msg = communityInviteWhatsAppMessage({
            inviteeName: name,
            referrerName: referrer.name,
            levelLabel: LEVEL_LABELS[input.level],
            claimUrl,
            verified: input.levelVerified,
          });
          window.open(playerWhatsAppUrl(phone, msg), '_blank', 'noopener,noreferrer');
        }

        toast.success('Invite ready', {
          description: input.openWhatsApp !== false
            ? `WhatsApp opened for ${name}. They join via the claim link — no approval needed.`
            : `Invite created for ${name}. Resend via WhatsApp when ready.`,
        });
        return invite;
      },

      resendCommunityInviteWhatsApp: (inviteId) => {
        const invite = state.communityInvites.find((i) => i.id === inviteId);
        if (!invite || invite.status !== 'pending') {
          toast.error('Invite not available');
          return;
        }
        const referrer = state.users.find((u) => u.id === invite.referredByUserId);
        if (typeof window !== 'undefined') {
          const claimUrl = communityInviteClaimUrl(invite.token);
          const msg = communityInviteWhatsAppMessage({
            inviteeName: invite.name,
            referrerName: referrer?.name ?? 'a Nomad',
            levelLabel: LEVEL_LABELS[invite.level],
            claimUrl,
            verified: invite.levelVerified,
          });
          window.open(playerWhatsAppUrl(invite.phoneNumber, msg), '_blank', 'noopener,noreferrer');
        }
        setState((s) => ({
          ...s,
          communityInvites: s.communityInvites.map((i) =>
            i.id === inviteId ? { ...i, whatsappOpenedAt: now() } : i),
        }));
        toast.success('WhatsApp opened', { description: `Invite message ready for ${invite.name}.` });
      },

      revokeCommunityInvite: (inviteId) => {
        setState((s) => {
          const invite = s.communityInvites.find((i) => i.id === inviteId);
          if (!invite || invite.status !== 'pending') return s;
          return {
            ...s,
            communityInvites: s.communityInvites.map((i) =>
              i.id === inviteId ? { ...i, status: 'revoked' as const } : i),
            users: s.users.map((u) =>
              u.id === invite.userId && u.status === 'invited'
                ? { ...u, status: 'rejected' as const, updatedAt: now() }
                : u),
          };
        });
        toast('Invite revoked');
      },

      claimCommunityInvite: (token, opts) => {
        const invite = state.communityInvites.find((i) => i.token === token);
        if (!invite) {
          toast.error('Invite not found');
          return false;
        }
        if (invite.status === 'claimed') {
          toast.error('Already joined', { description: 'This invite was already claimed.' });
          return false;
        }
        if (invite.status === 'revoked') {
          toast.error('Invite revoked', { description: 'Ask an admin for a new invite.' });
          return false;
        }
        const at = now();
        const optIn = opts?.whatsappOptIn !== false;
        setState((s) => {
          let next: StoreState = {
            ...s,
            communityInvites: s.communityInvites.map((i) =>
              i.id === invite.id
                ? { ...i, status: 'claimed' as const, claimedAt: at }
                : i),
            users: s.users.map((u) =>
              u.id === invite.userId
                ? {
                    ...u,
                    status: 'approved' as const,
                    claimedAt: at,
                    memberSince: at.slice(0, 10),
                    whatsappOptIn: optIn,
                    whatsappOptInAt: optIn ? at : u.whatsappOptInAt,
                    updatedAt: at,
                  }
                : u),
            phones: s.phones.map((p) =>
              p.userId === invite.userId && p.isPrimary
                ? { ...p, verifiedAt: at, updatedAt: at }
                : p),
            session: {
              viewRole: 'player',
              currentUserId: invite.userId,
              applicationStatus: 'approved',
            },
          };
          next = pushNotification(
            next,
            invite.userId,
            'Welcome to Padel Nomads',
            'Your invite is confirmed — you’re in. No application review needed.',
            'invite_claimed',
            'in_app',
          );
          const admins = next.users.filter((u) => u.role === 'admin');
          for (const admin of admins) {
            next = pushNotification(
              next,
              admin.id,
              'Invite claimed',
              `${invite.name} joined via invite (referred by community).`,
              'admin_invite_claimed',
              'in_app',
              { audience: 'admin' },
            );
          }
          return next;
        });
        toast.success('You’re in!', { description: 'Welcome to Padel Nomads — profile ready, no approval wait.' });
        return true;
      },

      createPlayerReferral: (input) => {
        const friendName = input.friendName.trim();
        const friendPhone = input.friendPhone.trim();
        if (!friendName) {
          toast.error('Friend’s name required');
          return null;
        }
        if (!/^\+[1-9]\d{7,14}$/.test(friendPhone)) {
          toast.error('Invalid phone', { description: 'Use E.164, e.g. +971501234567.' });
          return null;
        }
        const fromUserId = state.session.currentUserId;
        const from = state.users.find((u) => u.id === fromUserId);
        if (!from || from.role !== 'player' || from.status !== 'approved') {
          toast.error('Only approved members can refer friends');
          return null;
        }
        const dup = state.playerReferrals.find(
          (r) => r.fromUserId === fromUserId
            && r.friendPhone === friendPhone
            && r.status === 'pending',
        );
        if (dup) {
          toast.error('Pending invite exists', {
            description: 'You already have an open referral for this number — resend it instead.',
          });
          return null;
        }

        const created = now();
        const id = nextId('pr');
        const token = `ref${id.replace(/\D/g, '').slice(-6) || Date.now().toString(36)}`;
        const referral: PlayerReferral = {
          id,
          token,
          fromUserId,
          friendName,
          friendPhone,
          level: input.level,
          status: 'pending',
          createdAt: created,
          whatsappOpenedAt: input.openWhatsApp !== false ? created : undefined,
        };

        setState((s) => ({
          ...s,
          playerReferrals: [referral, ...s.playerReferrals],
        }));

        if (input.openWhatsApp !== false && typeof window !== 'undefined') {
          const applyUrl = playerReferralApplyUrl(token);
          const msg = playerReferralWhatsAppMessage({
            friendName,
            referrerName: from.name,
            levelLabel: LEVEL_LABELS[input.level],
            applyUrl,
          });
          window.open(playerWhatsAppUrl(friendPhone, msg), '_blank', 'noopener,noreferrer');
        }

        toast.success('Referral ready', {
          description: input.openWhatsApp !== false
            ? `WhatsApp opened for ${friendName}. They get higher approval priority; you earn +20 karma when they’re approved.`
            : `Invite created for ${friendName}. Share via WhatsApp when ready — +20 karma when they’re approved.`,
        });
        return referral;
      },

      resendPlayerReferralWhatsApp: (referralId) => {
        const referral = state.playerReferrals.find((r) => r.id === referralId);
        if (!referral || referral.status !== 'pending') {
          toast.error('Referral not available');
          return;
        }
        const from = state.users.find((u) => u.id === referral.fromUserId);
        if (typeof window !== 'undefined') {
          const applyUrl = playerReferralApplyUrl(referral.token);
          const msg = playerReferralWhatsAppMessage({
            friendName: referral.friendName,
            referrerName: from?.name ?? 'a Nomad',
            levelLabel: LEVEL_LABELS[referral.level],
            applyUrl,
          });
          window.open(playerWhatsAppUrl(referral.friendPhone, msg), '_blank', 'noopener,noreferrer');
        }
        setState((s) => ({
          ...s,
          playerReferrals: s.playerReferrals.map((r) =>
            r.id === referralId ? { ...r, whatsappOpenedAt: now() } : r),
        }));
        toast.success('WhatsApp opened', { description: `Invite message ready for ${referral.friendName}.` });
      },

      revokePlayerReferral: (referralId) => {
        setState((s) => ({
          ...s,
          playerReferrals: s.playerReferrals.map((r) =>
            r.id === referralId && r.status === 'pending'
              ? { ...r, status: 'revoked' as const }
              : r),
        }));
        toast('Referral revoked');
      },

      createGame: (input) => {
        const game: Game = {
          id: nextId('g'), ...input, status: 'upcoming',
          createdBy: 'admin1', createdAt: now(), updatedAt: now(),
        };
        setState((s) => ({ ...s, games: [game, ...s.games] }));
        toast.success('Game created', { description: `${input.title} is now visible to players.` });
        return game;
      },

      updateGame: (id, patch) => {
        setState((s) => ({
          ...s,
          games: s.games.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: now() } : g)),
        }));
        toast.success('Game updated');
      },

      deleteGame: (id) => {
        setState((s) => ({
          ...s,
          games: s.games.map((g) => (g.id === id ? { ...g, deleted: true, updatedAt: now() } : g)),
        }));
        toast('Game deleted', { description: 'Soft delete — hidden from all lists.' });
      },

      setGameStatus: (id, status) => {
        setState((s) => {
          let next: StoreState = {
            ...s,
            games: s.games.map((g) => (g.id === id ? { ...g, status, updatedAt: now() } : g)),
          };
          if (status === 'cancelled') {
            const game = s.games.find((g) => g.id === id);
            for (const p of s.participants.filter((x) => x.gameId === id && x.status !== 'cancelled')) {
              next = pushNotification(next, p.userId, 'Game cancelled', `${game?.title ?? 'A game'} has been cancelled.`, 'game_cancelled', 'whatsapp', { gameId: id });
            }
          }
          return next;
        });
        const label = status === 'live' ? 'Game is now LIVE' : status === 'completed' ? 'Game moved to Past' : status === 'cancelled' ? 'Game cancelled — players notified (simulated WhatsApp)' : 'Game status updated';
        toast(label);
      },

      addPlayerToGame: (gameId, userId, opts) => {
        const game = state.games.find((g) => g.id === gameId);
        const user = state.users.find((u) => u.id === userId);
        if (!game || !user) return false;
        if (user.status === 'banned') {
          toast.error('Cannot add banned player', { description: `${user.name} is banned and blacklisted.` });
          return false;
        }
        if ((user.karmaTier === 'restricted' || user.karmaTier === 'suspended') && !opts?.overrideReason) {
          toast.error(`Player is karma-${user.karmaTier}`, { description: 'Adding requires an explicit override with a logged reason.' });
          return false;
        }
        const eligibility = gameJoinEligibility(user, game);
        if (!eligibility.ok && !opts?.overrideReason) {
          toast.error('Player not eligible', { description: eligibility.reason });
          return false;
        }
        if (isGameFull(state.participants, gameId, state.externalPartnerInvites, game) && !opts?.overrideReason) {
          toast.error('Game is full', { description: 'Adding beyond capacity requires an admin override.' });
          return false;
        }
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: [
              {
                id: nextId('gp'),
                gameId,
                userId,
                status: 'confirmed' as const,
                confirmedAt: now(),
                lookingForPartner: isFixedTeamFormat(game.format) || undefined,
                createdAt: now(),
                updatedAt: now(),
              },
              ...s.participants,
            ],
          };
          // Without override, never leave a team game over capacity
          if (!opts?.overrideReason) {
            next = {
              ...next,
              participants: clampFixedTeamRosters(next.participants, next.games),
            };
          }
          next = pushNotification(next, userId, 'Added to game', `You were added to ${game.title} at ${game.venue}.`, 'added_to_game', 'whatsapp', { gameId });
          return next;
        });
        toast.success(`${user.name} added to ${game.title}`, { description: 'Player confirmed. Reminders 24h & 2h before (simulated).' });
        return true;
      },

      removePlayerFromGame: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        let promotedNames: string[] = [];
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.filter((p) => !(p.gameId === gameId && p.userId === userId)),
          };
          if (game) {
            next = pushNotification(next, userId, 'Removed from game', `You were removed from ${game.title}.`, 'removed_from_game', 'whatsapp', { gameId });
          }
          const filled = fillFromWaitlist(next, gameId);
          next = filled.next;
          promotedNames = filled.promoted.map((p) => s.users.find((u) => u.id === p.userId)?.name ?? 'Player');
          return next;
        });
        toast('Player removed', {
          description: promotedNames.length > 0
            ? `Waitlist promoted (karma priority): ${promotedNames.join(', ')}.`
            : 'WhatsApp notification sent (simulated).',
        });
      },

      startGame: (gameId) => {
        const game = state.games.find((g) => g.id === gameId);
        if (!game) return;
        const teamsPerCourt = 2; // 2 teams (4 players) per court

        setState((s) => {
          const active = s.participants.filter(
            (p) => p.gameId === gameId && !['cancelled', 'waitlisted'].includes(p.status),
          );

          // Reuse a pre-game court distribution when the admin prepared one;
          // otherwise fall back to a simple in-roster-order allocation.
          const prepared = s.teams
            .filter((t) => t.gameId === gameId)
            .sort((a, b) => a.court - b.court);
          const usePrepared = prepared.length > 0;

          const teams: GameTeam[] = [];
          const teamIdByUser = new Map<string, string>();
          if (usePrepared) {
            prepared.forEach((t) => {
              teams.push(t);
              t.playerIds.forEach((uid) => teamIdByUser.set(uid, t.id));
            });
          } else {
            // Allocate teams (pairs) across courts in roster order.
            for (let i = 0; i < active.length; i += 2) {
              const members = active.slice(i, i + 2);
              const idx = teams.length;
              const teamId = nextId('t');
              teams.push({
                id: teamId,
                gameId,
                name: `Team ${idx + 1}`,
                court: Math.min(game.courts, Math.floor(idx / teamsPerCourt) + 1),
                playerIds: members.map((m) => m.userId),
              });
              members.forEach((m) => teamIdByUser.set(m.userId, teamId));
            }
          }

          // Round 1 matches: pair the two teams sharing each court.
          const matches: GameMatch[] = [];
          for (let i = 0; i < teams.length; i += 2) {
            const a = teams[i];
            const b = teams[i + 1];
            if (!b) break; // odd team out sits the first round
            matches.push({
              id: nextId('m'), gameId, round: 0, court: a.court,
              teamAId: a.id, teamBId: b.id, scoreA: null, scoreB: null,
            });
          }

          // Prefill every active player: on time, paid, position cleared.
          const participants = s.participants.map((p) =>
            p.gameId === gameId && !['cancelled', 'waitlisted'].includes(p.status)
              ? {
                  ...p,
                  status: 'confirmed' as const,
                  attendance: 'on_time' as const,
                  paymentStatus: 'paid' as const,
                  teamId: teamIdByUser.get(p.userId),
                  position: undefined,
                  pointsAwarded: undefined,
                  updatedAt: now(),
                }
              : p,
          );

          return {
            ...s,
            games: s.games.map((g) => (g.id === gameId ? { ...g, status: 'live' as const, updatedAt: now() } : g)),
            participants,
            teams: [...s.teams.filter((t) => t.gameId !== gameId), ...teams],
            matches: [...s.matches.filter((m) => m.gameId !== gameId), ...matches],
          };
        });
        toast('Game is now LIVE', { description: `${game.title}: players marked on-time & paid, ${game.courts} court(s) allocated.` });
      },

      prepareDistribution: (gameId) => {
        const game = state.games.find((g) => g.id === gameId);
        if (!game) return;
        setState((s) => {
          const ctx = makeStrengthContext(s);
          const ordered = buildOrderedTeams(game, s.participants, s.users, ctx);
          const teams = orderedToTeams(gameId, ordered, s.users);
          return {
            ...s,
            teams: [...s.teams.filter((t) => t.gameId !== gameId), ...teams],
            games: s.games.map((g) =>
              g.id === gameId
                ? { ...g, distributionPreparedAt: now(), distributionFinalizedAt: undefined, updatedAt: now() }
                : g,
            ),
          };
        });
        toast.success('Initial distribution ready', {
          description: 'Strongest pairs seeded on the top courts. Adjust by hand, then finalize.',
        });
      },

      saveDistribution: (gameId, orderedTeams) => {
        const game = state.games.find((g) => g.id === gameId);
        if (!game) return;
        setState((s) => {
          const ctx = makeStrengthContext(s);
          // Compare against a fresh auto order to learn how far the admin moved
          // each player, nudging their strength bias for future distributions.
          const auto = buildOrderedTeams(game, s.participants, s.users, ctx);
          const autoCourt = new Map<string, number>();
          auto.forEach((team, i) => team.forEach((uid) => autoCourt.set(uid, courtForIndex(i))));
          const biases = { ...s.allocationBiases };
          orderedTeams.forEach((team, i) => {
            const savedCourt = courtForIndex(i);
            team.forEach((uid) => {
              const a = autoCourt.get(uid);
              if (a == null) return;
              const delta = a - savedCourt; // moved to a stronger (lower) court → positive
              if (delta !== 0) {
                const next = (biases[uid] ?? 0) + delta * 0.5;
                biases[uid] = Math.max(-8, Math.min(8, next));
              }
            });
          });
          const teams = orderedToTeams(gameId, orderedTeams, s.users);
          return {
            ...s,
            allocationBiases: biases,
            teams: [...s.teams.filter((t) => t.gameId !== gameId), ...teams],
            games: s.games.map((g) =>
              g.id === gameId
                ? { ...g, distributionPreparedAt: g.distributionPreparedAt ?? now(), distributionFinalizedAt: undefined, updatedAt: now() }
                : g,
            ),
          };
        });
        toast.success('Distribution updated', {
          description: 'Court order saved — your tweaks will inform future auto-distributions.',
        });
      },

      finalizeDistribution: (gameId) => {
        setState((s) => ({
          ...s,
          games: s.games.map((g) =>
            g.id === gameId ? { ...g, distributionFinalizedAt: now(), updatedAt: now() } : g,
          ),
        }));
        toast.success('Distribution finalized', {
          description: 'Live in the app and ready to send on WhatsApp.',
        });
      },

      reopenDistribution: (gameId) => {
        setState((s) => ({
          ...s,
          games: s.games.map((g) =>
            g.id === gameId ? { ...g, distributionFinalizedAt: undefined, updatedAt: now() } : g,
          ),
        }));
      },

      distributionFor: (gameId) => {
        const game = state.games.find((g) => g.id === gameId);
        if (!game || !game.distributionPreparedAt) return null;
        const teams = state.teams
          .filter((t) => t.gameId === gameId)
          .sort((a, b) => a.court - b.court);
        return teams.length > 0 ? teams.map((t) => t.playerIds) : null;
      },

      updateMatchScore: (matchId, side, value) => {
        setState((s) => ({
          ...s,
          matches: s.matches.map((m) =>
            m.id === matchId ? { ...m, [side === 'A' ? 'scoreA' : 'scoreB']: value } : m,
          ),
        }));
      },

      generateNextRound: (gameId, fromRound) => {
        const game = state.games.find((g) => g.id === gameId);
        if (!game) return;
        if (state.matches.some((m) => m.gameId === gameId && m.round === fromRound + 1)) {
          return; // already generated
        }
        const nextMatches = generateNextRoundMatches(game, state.matches, fromRound, () => nextId('m'));
        if (!nextMatches) {
          toast.error('Finish the round first', { description: 'Every court needs a decisive score before advancing.' });
          return;
        }
        setState((s) => ({ ...s, matches: [...s.matches, ...nextMatches] }));
        toast(`Round ${fromRound + 2} set`, { description: 'Courts updated — winners moved up, losers moved down.' });
      },

      collectScores: (gameId) => {
        setState((s) => {
          const game = s.games.find((g) => g.id === gameId);
          if (!game) return s;
          const teams = s.teams.filter((t) => t.gameId === gameId);
          const gameMatches = s.matches.filter((m) => m.gameId === gameId);
          const standings = computeStandings(game, teams, gameMatches);
          const byTeam = new Map(standings.map((st) => [st.team.id, st]));

          let next: StoreState = {
            ...s,
            games: s.games.map((g) => (g.id === gameId ? { ...g, status: 'completed' as const, updatedAt: now() } : g)),
            participants: s.participants.map((p) => {
              const st = p.teamId ? byTeam.get(p.teamId) : undefined;
              if (p.gameId !== gameId || !st) return p;
              return { ...p, position: st.rank, pointsAwarded: st.total, updatedAt: now() };
            }),
          };

          for (const p of next.participants.filter((x) => x.gameId === gameId)) {
            if (p.status === 'cancelled' || !p.teamId) continue;
            if (p.pointsAwarded) {
              const u = next.users.find((x) => x.id === p.userId);
              if (u) next = patchUser(next, p.userId, { points: u.points + p.pointsAwarded });
            }
            if (p.attendance === 'on_time') next = applyKarma(next, p.userId, 'on_time_game', 2, { gameId });
            next = pushNotification(next, p.userId, 'Result published',
              `Results for ${game.title} are out${p.position ? ` — your team finished ${ordinal(p.position)}` : ''}${p.pointsAwarded ? ` with ${p.pointsAwarded} points` : ''}.`,
              'result_published', 'in_app', { gameId });
          }
          return next;
        });
        toast.success('Scores collected', { description: 'Team totals ranked, leaderboard & karma updated, results sent (simulated).' });
      },

      registerForGame: (gameId, userId, opts) => {
        const game = state.games.find((g) => g.id === gameId);
        const user = state.users.find((u) => u.id === userId);
        if (!game || !user) return;
        if (user.karmaTier === 'restricted' || user.karmaTier === 'suspended') {
          toast.error('Registration blocked', { description: `Your karma tier (${user.karmaTier}) currently blocks self-registration. Play reliably to recover.` });
          return;
        }
        const eligibility = gameJoinEligibility(user, game);
        if (!eligibility.ok) {
          toast.error('Cannot join this game', { description: eligibility.reason });
          return;
        }
        const alreadyActive = state.participants.find(
          (p) => p.gameId === gameId && p.userId === userId && !['cancelled'].includes(p.status),
        );
        if (alreadyActive) {
          toast.error('Already registered', { description: 'You already have a spot on this game.' });
          return;
        }

        const fixedTeam = isFixedTeamFormat(game.format);
        const partnerId = opts?.withPartnerUserId;
        const partner = partnerId ? state.users.find((u) => u.id === partnerId) : undefined;
        const namedPartner = opts?.partnerName?.trim();
        const partnerPending = Boolean(fixedTeam && opts?.partnerPending && !partnerId && !namedPartner);
        const lookingForPartner = Boolean(
          fixedTeam && opts?.lookingForPartner && !partnerId && !namedPartner && !partnerPending,
        );

        let entryKind: TeamEntryKind = 'solo';
        if (fixedTeam) {
          if (partnerId || namedPartner) entryKind = 'full_pair';
          else if (partnerPending) entryKind = 'partner_pending';
          else entryKind = 'solo';
        }

        if (partnerId) {
          if (!fixedTeam) {
            toast.error('Partners only apply to fixed-team formats');
            return;
          }
          if (!partner) {
            toast.error('Partner not found');
            return;
          }
          if (partnerId === userId) return;
          const pairOk = partnerPairEligibility(user, partner, game);
          if (!pairOk.ok) {
            toast.error('Cannot register as a team', { description: pairOk.reason });
            return;
          }
          if (partner.karmaTier === 'restricted' || partner.karmaTier === 'suspended') {
            toast.error('Partner cannot join', { description: 'Their karma tier blocks registration.' });
            return;
          }
          const partnerElig = gameJoinEligibility(partner, game);
          if (!partnerElig.ok) {
            toast.error('Partner cannot join', { description: partnerElig.reason });
            return;
          }
          const partnerActive = state.participants.find(
            (p) => p.gameId === gameId && p.userId === partnerId && !['cancelled'].includes(p.status),
          );
          if (partnerActive) {
            toast.error('Partner already registered', { description: 'They already have a spot on this game.' });
            return;
          }
        }

        const at = now();
        const dueAt = partnerPending ? partnerNameDueAtFrom(new Date(at)) : undefined;

        // Full games always go to the waitlist (priority decides promotion order later).
        let waitlisted = false;
        if (fixedTeam) {
          const teamsTaken = fixedTeamsTaken(state.participants, gameId, state.externalPartnerInvites);
          waitlisted = teamsTaken >= maxFixedTeams(game.capacity);
        } else {
          const taken = spotsTaken(state.participants, gameId, state.externalPartnerInvites, game.format);
          waitlisted = taken >= game.capacity;
        }

        const status = waitlisted ? 'waitlisted' as const : 'confirmed' as const;

        let waitPos = 0;
        if (waitlisted) {
          const tmpSelf: GameParticipant = {
            id: 'tmp-self', gameId, userId, status: 'waitlisted',
            lookingForPartner: lookingForPartner || undefined,
            partnerUserId: partnerId,
            partnerName: namedPartner,
            teamEntryKind: fixedTeam ? entryKind : undefined,
            partnerNameDueAt: dueAt,
            createdAt: at, updatedAt: at,
          };
          const tmpPartner: GameParticipant | null = partnerId
            ? {
                id: 'tmp-partner', gameId, userId: partnerId, status: 'waitlisted',
                partnerUserId: userId,
                teamEntryKind: 'full_pair',
                createdAt: at, updatedAt: at,
              }
            : null;
          const projected = [
            ...state.participants.filter((p) => p.gameId === gameId && p.status === 'waitlisted'),
            tmpSelf,
            ...(tmpPartner ? [tmpPartner] : []),
          ];
          waitPos = waitlistPosition(projected, state.users, gameId, userId, game.format) ?? 0;
        }

        setState((s) => {
          const upsert = (
            list: GameParticipant[],
            uid: string,
            patch: Partial<GameParticipant>,
          ): GameParticipant[] => {
            const cancelled = list.find(
              (p) => p.gameId === gameId && p.userId === uid && p.status === 'cancelled',
            );
            if (cancelled) {
              return list.map((p) =>
                p.id === cancelled.id
                  ? {
                      ...p,
                      ...patch,
                      confirmationRequestedAt: undefined,
                      declinedAt: undefined,
                      cancelledAt: undefined,
                      replacementOfferedAt: undefined,
                      letsGoAt: undefined,
                      partnerInviteFrom: undefined,
                      updatedAt: at,
                    }
                  : p);
            }
            return [
              {
                id: nextId('gp'),
                gameId,
                userId: uid,
                createdAt: at,
                updatedAt: at,
                ...patch,
              } as GameParticipant,
              ...list,
            ];
          };

          let participants = s.participants;

          if (partnerId) {
            participants = upsert(participants, userId, {
              status,
              confirmedAt: waitlisted ? undefined : at,
              lookingForPartner: undefined,
              partnerUserId: partnerId,
              teamEntryKind: 'full_pair',
              partnerName: partner?.name,
              partnerNameDueAt: undefined,
            });
            participants = upsert(participants, partnerId, {
              status,
              confirmedAt: waitlisted ? undefined : at,
              lookingForPartner: undefined,
              partnerUserId: userId,
              teamEntryKind: 'full_pair',
              partnerNameDueAt: undefined,
            });
          } else {
            participants = upsert(participants, userId, {
              status,
              confirmedAt: waitlisted ? undefined : at,
              lookingForPartner: lookingForPartner || undefined,
              partnerUserId: undefined,
              teamEntryKind: fixedTeam ? entryKind : undefined,
              partnerName: namedPartner || undefined,
              partnerNameDueAt: dueAt,
            });
          }
          return { ...s, participants };
        });

        if (waitlisted) {
          const tierNote = !fixedTeam
            ? 'Higher karma is promoted first'
            : entryKind === 'full_pair'
              ? 'Full pairs are promoted first'
              : entryKind === 'partner_pending'
                ? 'After full pairs, Player + Partner teams are next'
                : 'Solos are promoted after full pairs and Player + Partner teams';
          toast.success('Added to waitlist', {
            description: `You're #${waitPos || '?'} on the waiting list. ${tierNote}. We'll notify you if a spot opens — then please confirm.`,
          });
        } else if (partnerId) {
          toast.success('Full pair registered!', {
            description: `You and ${partner?.name.split(' ')[0] ?? 'your partner'} have priority on the main list.`,
          });
        } else if (namedPartner) {
          toast.success('Full pair registered!', {
            description: `You and ${namedPartner} are confirmed (highest priority).`,
          });
        } else if (partnerPending) {
          const dueLabel = new Date(dueAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          toast.success('Registered — partner name due', {
            description: `Send your partner's name by ${dueLabel} today or your spot moves to the waitlist.`,
          });
        } else if (lookingForPartner) {
          toast.success('You\'re in — needs a partner', {
            description: 'Solo priority is below full pairs and partner-pending. Invite someone when you can.',
          });
        } else {
          toast.success('You\'re in!', {
            description: 'We\'ll remind you 24h and 2h before kickoff (simulated WhatsApp).',
          });
        }
      },

      submitPartnerName: (gameId, userId, partnerName) => {
        const name = partnerName.trim();
        if (!name) {
          toast.error('Enter your partner\'s name');
          return;
        }
        const game = state.games.find((g) => g.id === gameId);
        const part = state.participants.find(
          (p) => p.gameId === gameId && p.userId === userId && !['cancelled'].includes(p.status),
        );
        if (!part || part.teamEntryKind !== 'partner_pending') {
          toast.error('Not available', { description: 'Only partner-pending registrations can submit a name here.' });
          return;
        }
        if (part.partnerNameDueAt && new Date(part.partnerNameDueAt).getTime() < Date.now()) {
          toast.error('Deadline passed', { description: 'Partner name was due by 8:00 PM. You were moved to the waitlist.' });
          return;
        }
        setState((s) => ({
          ...s,
          participants: s.participants.map((p) =>
            p.id === part.id
              ? {
                  ...p,
                  partnerName: name,
                  teamEntryKind: 'full_pair' as const,
                  partnerNameDueAt: undefined,
                  lookingForPartner: undefined,
                  updatedAt: now(),
                }
              : p),
        }));
        toast.success('Partner confirmed', {
          description: `${name} is locked in — your team is now a full pair (highest priority)${game ? ` on ${game.title}` : ''}.`,
        });
      },

      confirmParticipation: (gameId, userId) => {
        setState((s) => ({
          ...s,
          participants: s.participants.map((p) =>
            p.gameId === gameId && p.userId === userId
              ? { ...p, status: 'confirmed' as const, confirmedAt: now(), updatedAt: now() } : p),
        }));
        toast.success('You\'re in!', { description: 'See you on court.' });
      },

      markLetsGo: (gameId, userId) => {
        setState((s) => ({
          ...s,
          participants: s.participants.map((p) =>
            p.gameId === gameId && p.userId === userId && ['confirmed', 'registered'].includes(p.status)
              ? {
                  ...p,
                  status: 'confirmed' as const,
                  confirmedAt: p.confirmedAt ?? now(),
                  letsGoAt: now(),
                  updatedAt: now(),
                }
              : p),
        }));
        toast.success('See you on the court!', { description: 'We\'ll send reminders 24h and 2h before.' });
      },

      declineParticipation: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        const user = state.users.find((u) => u.id === userId);
        if (game) {
          const start = new Date(`${game.date}T${game.startTime}:00`);
          const hours = (start.getTime() - Date.now()) / 3600000;
          if (hours < 12) {
            toast.error('Late cancellation', {
              description: 'Within 12 hours of kickoff you must pay the fee or find a replacement.',
            });
            return;
          }
        }
        setState((s) => {
          const target = s.participants.find(
            (p) => p.gameId === gameId && p.userId === userId && !['cancelled', 'waitlisted'].includes(p.status),
          );
          const partnerId = target?.partnerUserId;
          let next: StoreState = {
            ...s,
            participants: s.participants.map((p) => {
              if (p.gameId !== gameId) return p;
              if (p.userId === userId && p.id === target?.id) {
                return {
                  ...p,
                  status: 'cancelled' as const,
                  declinedAt: now(),
                  cancelledAt: now(),
                  partnerUserId: undefined,
                  partnerInviteFrom: undefined,
                  lookingForPartner: undefined,
                  updatedAt: now(),
                };
              }
              // Free the partner if they were linked
              if (partnerId && p.userId === partnerId && p.partnerUserId === userId) {
                return {
                  ...p,
                  partnerUserId: undefined,
                  lookingForPartner: true,
                  updatedAt: now(),
                };
              }
              if (p.partnerInviteFrom === userId) {
                return { ...p, partnerInviteFrom: undefined, updatedAt: now() };
              }
              return p;
            }),
            externalPartnerInvites: s.externalPartnerInvites.filter(
              (i) => !(i.gameId === gameId && i.fromUserId === userId),
            ),
          };
          next = pushAdminAttention(
            next,
            'Player cancelled',
            `${user?.name ?? 'A player'} cancelled ${game?.title ?? 'a game'}${game ? ` (${game.date} ${game.startTime})` : ''}. Spot is free.`,
            'admin_player_cancelled',
            { gameId },
          );
          const filled = fillFromWaitlist(next, gameId);
          next = filled.next;
          if (filled.promoted.length > 0) {
            const names = filled.promoted
              .map((p) => s.users.find((u) => u.id === p.userId)?.name ?? 'Player')
              .join(', ');
            next = pushAdminAttention(
              next,
              'Waitlist promoted',
              `${names} moved onto ${game?.title ?? 'the game'} from the waitlist (karma priority).`,
              'admin_waitlist_promoted',
              { gameId },
            );
          }
          return next;
        });
        toast('Spot cancelled', { description: 'Your spot was freed. Waitlist filled by karma priority when available.' });
      },

      cancelWithPayment: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        const user = state.users.find((u) => u.id === userId);
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.map((p) =>
              p.gameId === gameId && p.userId === userId
                ? {
                    ...p,
                    status: 'cancelled' as const,
                    declinedAt: now(),
                    cancelledAt: now(),
                    paymentStatus: 'unpaid' as const,
                    updatedAt: now(),
                  }
                : p),
            externalPartnerInvites: s.externalPartnerInvites.filter(
              (i) => !(i.gameId === gameId && i.fromUserId === userId),
            ),
          };
          const hours = game
            ? (new Date(`${game.date}T${game.startTime}:00`).getTime() - Date.now()) / 3600000
            : 99;
          if (hours < 4) next = applyKarma(next, userId, 'very_late_cancellation', -25, { gameId });
          else next = applyKarma(next, userId, 'late_cancellation', -15, { gameId });
          next = pushNotification(
            next, userId,
            'Late cancellation — payment link coming',
            `You cancelled ${game?.title ?? 'a game'} within 12 hours. Online payments aren't live yet — an admin will contact you soon with a payment link${game?.price != null ? ` for AED ${game.price}` : ''}.`,
            'late_cancellation', 'whatsapp',
            { gameId },
          );
          next = pushAdminAttention(
            next,
            'Late cancellation — action needed',
            `${user?.name ?? 'A player'} cancelled ${game?.title ?? 'a game'} late. Collect fee${game?.price != null ? ` (AED ${game.price})` : ''} and fill the spot.`,
            'admin_late_cancellation',
            { gameId },
          );
          const filled = fillFromWaitlist(next, gameId);
          next = filled.next;
          if (filled.promoted.length > 0) {
            const names = filled.promoted
              .map((p) => s.users.find((u) => u.id === p.userId)?.name ?? 'Player')
              .join(', ');
            next = pushAdminAttention(
              next,
              'Waitlist promoted',
              `${names} moved onto ${game?.title ?? 'the game'} from the waitlist (karma priority).`,
              'admin_waitlist_promoted',
              { gameId },
            );
          }
          return next;
        });
        toast('Cancelled — payment link coming', {
          description: game?.price != null
            ? `Online payments aren't live yet. An admin will contact you soon with a payment link for AED ${game.price}. Late cancellation karma applied.`
            : `Online payments aren't live yet. An admin will contact you soon with a payment link for the game fee. Late cancellation karma applied.`,
        });
      },

      offerReplacement: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        const user = state.users.find((u) => u.id === userId);
        if (!game) return;

        // Project the cancel so team/person capacity opens before picking promotions
        const afterCancel = state.participants.map((p) =>
          p.gameId === gameId && p.userId === userId
            ? {
                ...p,
                status: 'cancelled' as const,
                partnerUserId: undefined,
                lookingForPartner: undefined,
              }
            : p.gameId === gameId && p.partnerUserId === userId
              ? { ...p, partnerUserId: undefined, lookingForPartner: true }
              : p,
        );
        const toPromote = nextWaitlistPromotions(
          afterCancel, state.users, game, state.externalPartnerInvites, 1,
        );
        if (toPromote.length === 0) {
          setState((s) => pushAdminAttention(
            s,
            'Replacement needed',
            `${user?.name ?? 'A player'} needs a late-cancel replacement for ${game.title} — no waitlist available.`,
            'admin_replacement_needed',
            { gameId },
          ));
          toast.error('No waitlist', { description: 'Admin was notified. Message the organizer on WhatsApp to arrange a replacement.' });
          return;
        }
        const promoteIds = new Set(toPromote.map((p) => p.id));
        const names = toPromote
          .map((p) => state.users.find((u) => u.id === p.userId)?.name ?? 'Player')
          .join(' + ');
        const fixedTeam = isFixedTeamFormat(game.format);
        setState((s) => {
          const at = now();
          let next: StoreState = {
            ...s,
            participants: promoteWaitlistParticipants(
              s.participants.map((p) => {
                if (p.gameId === gameId && p.userId === userId) {
                  return {
                    ...p,
                    status: 'cancelled' as const,
                    declinedAt: at,
                    cancelledAt: at,
                    replacementOfferedAt: at,
                    partnerUserId: undefined,
                    partnerInviteFrom: undefined,
                    lookingForPartner: undefined,
                    updatedAt: at,
                  };
                }
                if (p.gameId === gameId && p.partnerUserId === userId) {
                  return {
                    ...p,
                    partnerUserId: undefined,
                    lookingForPartner: true,
                    updatedAt: at,
                  };
                }
                return p;
              }),
              promoteIds,
              at,
              { fixedTeam },
            ),
          };
          next = pushNotification(
            next, userId,
            'Replacement found',
            `${names} from the waitlist took your spot on ${game.title} (highest karma). You are cancelled — no late fee.`,
            'replacement_taken', 'whatsapp',
            { gameId },
          );
          for (const p of toPromote) {
            next = pushNotification(
              next, p.userId,
              'You\'re in!',
              `You were promoted from the waitlist onto ${game.title} (karma priority). Please confirm your spot.`,
              'waitlist_promoted', 'whatsapp',
              { gameId },
            );
          }
          next = pushAdminAttention(
            next,
            'Replacement completed',
            `${user?.name ?? 'A player'} offered their spot on ${game.title}; ${names} was promoted (karma priority).`,
            'admin_replacement_offered',
            { gameId },
          );
          return next;
        });
        toast.success('Spot filled from waitlist', {
          description: `${names} was promoted. No late fee for you.`,
        });
      },

      claimWaitlistSpot: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        const offering = state.participants.find(
          (p) => p.gameId === gameId && p.status === 'pending_replacement',
        );
        const waiter = state.participants.find(
          (p) => p.gameId === gameId && p.userId === userId && p.status === 'waitlisted',
        );
        if (!offering || !waiter) {
          // Fallback: if a seat is open, promote by karma (may include this user)
          const openGame = state.games.find((g) => g.id === gameId);
          if (!openGame) {
            toast.error('Spot no longer available');
            return;
          }
          const open = openGame.capacity - spotsTaken(
            state.participants, gameId, state.externalPartnerInvites, openGame.format,
          );
          if (open <= 0 || !waiter) {
            toast.error('Spot no longer available');
            return;
          }
          const ordered = waitlistOrdered(state.participants, state.users, gameId)
            .filter((p) => {
              const u = state.users.find((x) => x.id === p.userId);
              return u && u.status !== 'banned' && u.karmaTier !== 'restricted' && u.karmaTier !== 'suspended';
            });
          if (ordered[0]?.userId !== userId) {
            toast.error('Not your turn yet', {
              description: 'Spots go to the highest-karma player on the waitlist first.',
            });
            return;
          }
          setState((s) => fillFromWaitlist(s, gameId).next);
          toast.success('Spot claimed', { description: `You're confirmed for ${game?.title ?? 'the game'}.` });
          return;
        }
        // Legacy pending_replacement race: only the top karma waitlisted player may claim
        const ordered = waitlistOrdered(state.participants, state.users, gameId)
          .filter((p) => {
            const u = state.users.find((x) => x.id === p.userId);
            return u && u.status !== 'banned' && u.karmaTier !== 'restricted' && u.karmaTier !== 'suspended';
          });
        if (ordered[0]?.userId !== userId) {
          toast.error('Not your turn yet', {
            description: 'This spot is reserved for the highest-karma player on the waitlist.',
          });
          return;
        }
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.map((p) => {
              if (p.id === offering.id) {
                return {
                  ...p,
                  status: 'cancelled' as const,
                  declinedAt: now(),
                  cancelledAt: now(),
                  updatedAt: now(),
                };
              }
              if (p.id === waiter.id) {
                return {
                  ...p,
                  status: 'confirmed' as const,
                  confirmedAt: now(),
                  confirmationRequestedAt: now(),
                  updatedAt: now(),
                };
              }
              return p;
            }),
          };
          next = pushNotification(
            next, offering.userId,
            'Replacement found',
            `Someone from the waitlist took your spot on ${game?.title ?? 'the game'}. You are cancelled — no late fee.`,
            'replacement_taken', 'whatsapp',
            { gameId },
          );
          next = pushNotification(
            next, userId,
            'You\'re in!',
            `You claimed a spot on ${game?.title ?? 'the game'} (karma priority). See you on court.`,
            'waitlist_promoted', 'whatsapp',
            { gameId },
          );
          return next;
        });
        toast.success('Spot claimed', { description: `You're confirmed for ${game?.title ?? 'the game'}.` });
      },

      invitePartner: (gameId, fromUserId, toUserId) => {
        const game = state.games.find((g) => g.id === gameId);
        const from = state.users.find((u) => u.id === fromUserId);
        const to = state.users.find((u) => u.id === toUserId);
        if (!game || !from || !to || !isFixedTeamFormat(game.format)) return;
        if (fromUserId === toUserId) return;

        const pairOk = partnerPairEligibility(from, to, game);
        if (!pairOk.ok) {
          toast.error('Cannot invite', { description: pairOk.reason });
          return;
        }

        const fromMain = state.participants.find(
          (p) => p.gameId === gameId && p.userId === fromUserId && !['cancelled', 'waitlisted'].includes(p.status),
        );
        const fromWaitlisted = state.participants.find(
          (p) => p.gameId === gameId && p.userId === fromUserId && p.status === 'waitlisted',
        );
        const toPart = state.participants.find(
          (p) => p.gameId === gameId && p.userId === toUserId && !['cancelled'].includes(p.status),
        );
        const teams = fixedTeamsTaken(state.participants, gameId, state.externalPartnerInvites);
        const gameFull = teams >= maxFixedTeams(game.capacity);
        const joiningExistingOpen = Boolean(
          toPart
          && toPart.status !== 'waitlisted'
          && !toPart.partnerUserId,
        );

        // Game full + neither on main list → join waitlist as a team together
        if (gameFull && !fromMain && !joiningExistingOpen) {
          if (fromWaitlisted?.partnerUserId || toPart?.partnerUserId) {
            toast.error('Already paired', { description: 'One of you already has a waitlist partner.' });
            return;
          }
          if (toPart?.status === 'waitlisted') {
            // Link two waitlisted solos into one team unit
            setState((s) => ({
              ...s,
              participants: s.participants.map((p) => {
                if (p.gameId !== gameId) return p;
                if (p.userId === fromUserId && p.status === 'waitlisted') {
                  return {
                    ...p,
                    partnerUserId: toUserId,
                    lookingForPartner: undefined,
                    updatedAt: now(),
                  };
                }
                if (p.userId === toUserId && p.status === 'waitlisted') {
                  return {
                    ...p,
                    partnerUserId: fromUserId,
                    lookingForPartner: undefined,
                    updatedAt: now(),
                  };
                }
                return p;
              }),
            }));
            toast.success('Waitlist team linked', {
              description: `You and ${to.name.split(' ')[0]} share one waitlist spot.`,
            });
            return;
          }
          // Register both onto waitlist as a linked team
          const at = now();
          setState((s) => {
            const upsert = (participants: GameParticipant[], uid: string, partner: string): GameParticipant[] => {
              const cancelled = participants.find(
                (p) => p.gameId === gameId && p.userId === uid && p.status === 'cancelled',
              );
              if (cancelled) {
                return participants.map((p) =>
                  p.id === cancelled.id
                    ? {
                        ...p,
                        status: 'waitlisted' as const,
                        confirmedAt: undefined,
                        declinedAt: undefined,
                        cancelledAt: undefined,
                        lookingForPartner: undefined,
                        partnerUserId: partner,
                        partnerInviteFrom: undefined,
                        updatedAt: at,
                      }
                    : p);
              }
              if (participants.some((p) => p.gameId === gameId && p.userId === uid && p.status === 'waitlisted')) {
                return participants.map((p) =>
                  p.gameId === gameId && p.userId === uid && p.status === 'waitlisted'
                    ? {
                        ...p,
                        lookingForPartner: undefined,
                        partnerUserId: partner,
                        updatedAt: at,
                      }
                    : p);
              }
              return [
                {
                  id: nextId('gp'),
                  gameId,
                  userId: uid,
                  status: 'waitlisted' as const,
                  partnerUserId: partner,
                  createdAt: at,
                  updatedAt: at,
                },
                ...participants,
              ];
            };
            let participants = s.participants;
            participants = upsert(participants, fromUserId, toUserId);
            participants = upsert(participants, toUserId, fromUserId);
            return { ...s, participants };
          });
          toast.success('Waitlist spot confirmed', {
            description: `Your team is on the waitlist. We'll notify you if you're moved to the main list (karma priority).`,
          });
          return;
        }

        let fromPart = fromMain;
        // Auto-register sender as solo if they are not on the game yet
        if (!fromPart) {
          if (from.karmaTier === 'restricted' || from.karmaTier === 'suspended') {
            toast.error('Registration blocked', { description: 'Your karma tier blocks self-registration.' });
            return;
          }
          if (!joiningExistingOpen && gameFull) {
            toast.error('Game is full');
            return;
          }
        }
        if (fromPart?.partnerUserId) {
          toast.error('You already have a partner');
          return;
        }
        if (toPart?.partnerUserId) {
          toast.error(`${to.name.split(' ')[0]} already has a partner`);
          return;
        }
        if (toPart?.status === 'waitlisted') {
          toast.error('That player is on the waitlist');
          return;
        }

        if (!toPart) {
          // New invitee: only needs a free team slot when the sender is also new
          // (one new team). If sender already has a team slot, invitee fills it.
          if (!fromPart && gameFull) {
            toast.error('Game is full', { description: 'No free team slot to invite a new player.' });
            return;
          }
        }

        setState((s) => {
          let participants = [...s.participants];
          const activeFrom = participants.find(
            (p) => p.gameId === gameId && p.userId === fromUserId && !['cancelled', 'waitlisted'].includes(p.status),
          );
          const cancelledFrom = participants.find(
            (p) => p.gameId === gameId && p.userId === fromUserId && p.status === 'cancelled',
          );
          if (!activeFrom && cancelledFrom) {
            participants = participants.map((p) =>
              p.id === cancelledFrom.id
                ? {
                    ...p,
                    status: 'confirmed' as const,
                    confirmationRequestedAt: undefined,
                    confirmedAt: now(),
                    declinedAt: undefined,
                    cancelledAt: undefined,
                    letsGoAt: undefined,
                    lookingForPartner: true,
                    partnerUserId: undefined,
                    partnerInviteFrom: undefined,
                    updatedAt: now(),
                  }
                : p);
          } else if (!activeFrom) {
            participants = [
              {
                id: nextId('gp'),
                gameId,
                userId: fromUserId,
                status: 'confirmed' as const,
                confirmedAt: now(),
                lookingForPartner: true,
                createdAt: now(),
                updatedAt: now(),
              },
              ...participants,
            ];
          }
          // Drop any previous outgoing invite from this sender on this game
          participants = participants.map((p) =>
            p.gameId === gameId && p.partnerInviteFrom === fromUserId && p.userId !== toUserId
              ? { ...p, partnerInviteFrom: undefined, updatedAt: now() }
              : p);

          const hasTo = participants.some(
            (p) => p.gameId === gameId && p.userId === toUserId && !['cancelled', 'waitlisted'].includes(p.status),
          );
          if (!hasTo) {
            participants = [
              {
                id: nextId('gp'),
                gameId,
                userId: toUserId,
                status: 'confirmed' as const,
                confirmedAt: now(),
                partnerInviteFrom: fromUserId,
                createdAt: now(),
                updatedAt: now(),
              },
              ...participants,
            ];
          } else {
            participants = participants.map((p) =>
              p.gameId === gameId && p.userId === toUserId && !['cancelled', 'waitlisted'].includes(p.status)
                ? { ...p, partnerInviteFrom: fromUserId, updatedAt: now() }
                : p);
          }
          let next: StoreState = {
            ...s,
            participants,
            // Nomad invite replaces any off-app partner hold from this sender
            externalPartnerInvites: s.externalPartnerInvites.filter(
              (i) => !(i.gameId === gameId && i.fromUserId === fromUserId),
            ),
          };
          next = pushNotification(
            next, toUserId,
            'Partner invite',
            `${from.name} invited you to play as a fixed team on ${game.title}.`,
            'partner_invite', 'whatsapp',
            { gameId },
          );
          return next;
        });
        toast.success('Partner invite sent', { description: `${to.name.split(' ')[0]} was notified (simulated WhatsApp).` });
      },

      proposePartnerJoin: (gameId, proposerId, soloUserId) => {
        const game = state.games.find((g) => g.id === gameId);
        const proposer = state.users.find((u) => u.id === proposerId);
        const solo = state.users.find((u) => u.id === soloUserId);
        if (!game || !proposer || !solo || !isFixedTeamFormat(game.format)) return;
        if (proposerId === soloUserId) return;

        const pairOk = partnerPairEligibility(proposer, solo, game);
        if (!pairOk.ok) {
          toast.error('Cannot join', { description: pairOk.reason });
          return;
        }

        const soloPart = state.participants.find(
          (p) => p.gameId === gameId && p.userId === soloUserId && !['cancelled', 'waitlisted'].includes(p.status),
        );
        if (!soloPart || soloPart.partnerUserId || !soloPart.lookingForPartner) {
          toast.error('Not available', { description: 'That player is not looking for a partner right now.' });
          return;
        }
        if (soloPart.partnerInviteFrom && soloPart.partnerInviteFrom !== proposerId) {
          toast.error('Request pending', { description: 'Someone else already asked to join them.' });
          return;
        }

        let fromPart = state.participants.find(
          (p) => p.gameId === gameId && p.userId === proposerId && !['cancelled', 'waitlisted'].includes(p.status),
        );
        if (fromPart?.partnerUserId) {
          toast.error('You already have a partner');
          return;
        }
        if (!fromPart) {
          if (proposer.karmaTier === 'restricted' || proposer.karmaTier === 'suspended') {
            toast.error('Registration blocked', { description: 'Your karma tier blocks self-registration.' });
            return;
          }
          // Fills the solo's reserved partner slot — does not consume a new team
        }

        setState((s) => {
          let participants = [...s.participants];
          const activeFrom = participants.find(
            (p) => p.gameId === gameId && p.userId === proposerId && !['cancelled', 'waitlisted'].includes(p.status),
          );
          const cancelledFrom = participants.find(
            (p) => p.gameId === gameId && p.userId === proposerId && p.status === 'cancelled',
          );
          if (!activeFrom && cancelledFrom) {
            participants = participants.map((p) =>
              p.id === cancelledFrom.id
                ? {
                    ...p,
                    status: 'confirmed' as const,
                    confirmationRequestedAt: undefined,
                    confirmedAt: now(),
                    declinedAt: undefined,
                    cancelledAt: undefined,
                    letsGoAt: undefined,
                    lookingForPartner: true,
                    partnerUserId: undefined,
                    partnerInviteFrom: undefined,
                    updatedAt: now(),
                  }
                : p);
          } else if (!activeFrom) {
            participants = [
              {
                id: nextId('gp'),
                gameId,
                userId: proposerId,
                status: 'confirmed' as const,
                confirmedAt: now(),
                lookingForPartner: true,
                createdAt: now(),
                updatedAt: now(),
              },
              ...participants,
            ];
          }
          // Clear other outgoing requests from this proposer
          participants = participants.map((p) =>
            p.gameId === gameId && p.partnerInviteFrom === proposerId && p.userId !== soloUserId
              ? { ...p, partnerInviteFrom: undefined, updatedAt: now() }
              : p);
          participants = participants.map((p) =>
            p.gameId === gameId && p.userId === soloUserId && !['cancelled', 'waitlisted'].includes(p.status)
              ? { ...p, partnerInviteFrom: proposerId, updatedAt: now() }
              : p);

          let next: StoreState = {
            ...s,
            participants,
            externalPartnerInvites: s.externalPartnerInvites.filter(
              (i) => !(i.gameId === gameId && i.fromUserId === proposerId),
            ),
          };
          next = pushNotification(
            next, soloUserId,
            'Join request',
            `${proposer.name} wants to join you as a partner on ${game.title}.`,
            'partner_join_request', 'whatsapp',
            { gameId },
          );
          return next;
        });
        toast.success('Join request sent', {
          description: `${solo.name.split(' ')[0]} was notified and can approve you.`,
        });
      },

      acceptPartnerInvite: (gameId, userId) => {
        const mine = state.participants.find(
          (p) => p.gameId === gameId && p.userId === userId && p.partnerInviteFrom,
        );
        if (!mine?.partnerInviteFrom) {
          toast.error('No pending invite');
          return;
        }
        const fromId = mine.partnerInviteFrom;
        const from = state.users.find((u) => u.id === fromId);
        const me = state.users.find((u) => u.id === userId);
        const game = state.games.find((g) => g.id === gameId);
        if (game && from && me) {
          const pairOk = partnerPairEligibility(me, from, game);
          if (!pairOk.ok) {
            toast.error('Cannot pair', { description: pairOk.reason });
            return;
          }
        }
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.map((p) => {
              if (p.gameId !== gameId) return p;
              if (p.userId === userId) {
                return {
                  ...p,
                  partnerUserId: fromId,
                  partnerInviteFrom: undefined,
                  lookingForPartner: false,
                  teamEntryKind: 'full_pair' as const,
                  partnerNameDueAt: undefined,
                  updatedAt: now(),
                };
              }
              if (p.userId === fromId) {
                return {
                  ...p,
                  partnerUserId: userId,
                  lookingForPartner: false,
                  partnerInviteFrom: undefined,
                  teamEntryKind: 'full_pair' as const,
                  partnerNameDueAt: undefined,
                  updatedAt: now(),
                };
              }
              return p;
            }),
          };
          next = pushNotification(
            next, fromId,
            'Partner confirmed',
            `${state.users.find((u) => u.id === userId)?.name ?? 'Your partner'} accepted your fixed-pairs invite.`,
            'partner_accepted', 'whatsapp',
            { gameId },
          );
          return next;
        });
        toast.success('You\'re paired!', { description: from ? `Partnered with ${from.name}.` : 'Partner linked.' });
      },

      declinePartnerInvite: (gameId, userId) => {
        const mine = state.participants.find(
          (p) => p.gameId === gameId && p.userId === userId && p.partnerInviteFrom,
        );
        const fromId = mine?.partnerInviteFrom;
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.map((p) =>
              p.gameId === gameId && p.userId === userId
                ? { ...p, partnerInviteFrom: undefined, updatedAt: now() }
                : p),
          };
          if (fromId) {
            next = pushNotification(
              next, fromId,
              'Partner invite declined',
              `${state.users.find((u) => u.id === userId)?.name ?? 'Someone'} declined your fixed-pairs invite.`,
              'partner_declined', 'in_app',
              { gameId },
            );
          }
          return next;
        });
        toast('Invite declined');
      },

      inviteExternalPartner: (gameId, fromUserId, friendName, friendPhone) => {
        const game = state.games.find((g) => g.id === gameId);
        const from = state.users.find((u) => u.id === fromUserId);
        if (!game || !from || !isFixedTeamFormat(game.format)) return;
        const phone = friendPhone.trim();
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
          toast.error('Invalid phone', { description: 'Use E.164 format, e.g. +971501234567.' });
          return;
        }
        const name = friendName.trim();
        if (!name) {
          toast.error('Enter your friend\'s name');
          return;
        }
        if (from.karmaTier === 'restricted' || from.karmaTier === 'suspended') {
          toast.error('Registration blocked');
          return;
        }
        const eligibility = gameJoinEligibility(from, game);
        if (!eligibility.ok) {
          toast.error('Cannot join this game', { description: eligibility.reason });
          return;
        }
        if (requiresMixedGenderPair(game) && !isBinaryGender(from.gender)) {
          toast.error('Profile incomplete', {
            description: 'Set male or female on your profile for King & Queen mixed teams.',
          });
          return;
        }
        const existingHold = state.externalPartnerInvites.find(
          (i) => i.gameId === gameId && i.fromUserId === fromUserId
            && new Date(i.expiresAt).getTime() > Date.now(),
        );
        const fromPart = state.participants.find(
          (p) => p.gameId === gameId && p.userId === fromUserId && !['cancelled', 'waitlisted'].includes(p.status),
        );
        // New team (player + Partner TBC) needs a free team slot.
        // Existing solo already occupies that slot — hold fills the reserved partner.
        if (!fromPart) {
          const teams = fixedTeamsTaken(state.participants, gameId, state.externalPartnerInvites);
          if (teams >= maxFixedTeams(game.capacity)) {
            toast.error('Game is full', { description: 'Need a free team slot for you and your partner (held 24h).' });
            return;
          }
        }

        const created = now();
        const expiresAt = new Date(Date.now() + EXTERNAL_PARTNER_HOLD_HOURS * 3600000).toISOString();

        setState((s) => {
          let participants = [...s.participants];
          const part = participants.find(
            (p) => p.gameId === gameId && p.userId === fromUserId && !['cancelled', 'waitlisted'].includes(p.status),
          );
          const cancelled = participants.find(
            (p) => p.gameId === gameId && p.userId === fromUserId && p.status === 'cancelled',
          );
          if (!part && cancelled) {
            participants = participants.map((p) =>
              p.id === cancelled.id
                ? {
                    ...p,
                    status: 'confirmed' as const,
                    confirmationRequestedAt: undefined,
                    confirmedAt: now(),
                    declinedAt: undefined,
                    cancelledAt: undefined,
                    letsGoAt: undefined,
                    lookingForPartner: false,
                    partnerUserId: undefined,
                    partnerInviteFrom: undefined,
                    updatedAt: now(),
                  }
                : p);
          } else if (!part) {
            participants = [
              {
                id: nextId('gp'),
                gameId,
                userId: fromUserId,
                status: 'confirmed' as const,
                confirmedAt: now(),
                lookingForPartner: false,
                createdAt: now(),
                updatedAt: now(),
              },
              ...participants,
            ];
          } else {
            participants = participants.map((p) =>
              p.id === part.id
                ? {
                    ...p,
                    lookingForPartner: false,
                    partnerInviteFrom: undefined,
                    updatedAt: now(),
                  }
                : p);
          }
          // Clear any pending Nomad partner invites this user sent
          participants = participants.map((p) =>
            p.gameId === gameId && p.partnerInviteFrom === fromUserId
              ? { ...p, partnerInviteFrom: undefined, updatedAt: now() }
              : p);

          return {
            ...s,
            participants,
            externalPartnerInvites: [
              {
                id: nextId('epi'),
                gameId,
                fromUserId,
                friendName: name,
                friendPhone: phone,
                createdAt: created,
                expiresAt,
              },
              ...s.externalPartnerInvites.filter(
                (i) => !(i.gameId === gameId && i.fromUserId === fromUserId),
              ),
            ],
          };
        });
        const applyUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/apply/`
          : 'https://padelnomads.com/apply/';
        const waPhone = phone.replace(/\D/g, '');
        const msg = `Hey ${name.split(' ')[0]}! Join me for ${game.title} on ${game.date} at ${game.startTime} (${game.venue}). I reserved a partner spot for you for 24 hours — apply to Padel Nomads here: ${applyUrl}`;
        if (typeof window !== 'undefined') {
          window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
        }
        toast.success('Partner spot held 24h', {
          description: `WhatsApp opened for ${name}. Their spot shows as Partner (TBC) until they join.`,
        });
      },

      setParticipantStatus: (participantId, status) => {
        setState((s) => ({
          ...s,
          participants: s.participants.map((p) => (p.id === participantId ? { ...p, status, updatedAt: now() } : p)),
        }));
      },

      markAttendance: (participantId, value) => {
        setState((s) => {
          const p = s.participants.find((x) => x.id === participantId);
          let next: StoreState = {
            ...s,
            participants: s.participants.map((x) => (x.id === participantId ? { ...x, attendance: value, status: value === 'no_show' ? 'no_show' as const : x.status, updatedAt: now() } : x)),
          };
          if (p) {
            if (value === 'no_show') next = applyKarma(next, p.userId, 'no_show', -30, { gameId: p.gameId });
            if (value === 'late') next = applyKarma(next, p.userId, 'late_arrival', -5, { gameId: p.gameId });
          }
          return next;
        });
        if (value !== 'on_time') toast(`Marked ${value === 'no_show' ? 'no-show (-30 karma)' : 'late (-5 karma)'}`);
      },

      markPayment: (participantId, value) => {
        setState((s) => {
          const p = s.participants.find((x) => x.id === participantId);
          let next: StoreState = {
            ...s,
            participants: s.participants.map((x) => (x.id === participantId ? { ...x, paymentStatus: value, updatedAt: now() } : x)),
          };
          if (p && value === 'unpaid') next = applyKarma(next, p.userId, 'non_payment', -20, { gameId: p.gameId });
          if (p && value === 'paid' && p.paymentStatus === 'unpaid') next = applyKarma(next, p.userId, 'non_payment_reversal', 20, { gameId: p.gameId });
          return next;
        });
        if (value === 'unpaid') toast('Marked unpaid (-20 karma)');
      },

      createOffer: (input) => {
        setState((s) => ({
          ...s,
          offers: [{ ...input, id: nextId('o'), createdAt: now(), updatedAt: now() }, ...s.offers],
        }));
        toast.success('Offer created');
      },

      updateOffer: (id, patch) => {
        setState((s) => ({
          ...s,
          offers: s.offers.map((o) => (o.id === id ? { ...o, ...patch, updatedAt: now() } : o)),
        }));
        toast.success('Offer updated');
      },

      toggleOffer: (id) => {
        setState((s) => ({
          ...s,
          offers: s.offers.map((o) => (o.id === id ? { ...o, status: o.status === 'active' ? 'inactive' as const : 'active' as const, updatedAt: now() } : o)),
        }));
        const offer = state.offers.find((o) => o.id === id);
        toast(offer?.status === 'active' ? 'Offer deactivated' : 'Offer activated');
      },

      deleteOffer: (id) => {
        setState((s) => ({ ...s, offers: s.offers.filter((o) => o.id !== id) }));
        toast('Offer removed');
      },

      createClub: (input) => {
        setState((s) => ({
          ...s,
          clubs: [{ ...input, id: nextId('club'), createdAt: now(), updatedAt: now() }, ...s.clubs],
        }));
        toast.success('Club created');
      },

      updateClub: (id, patch) => {
        setState((s) => ({
          ...s,
          clubs: s.clubs.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)),
        }));
        toast.success('Club updated');
      },

      toggleClub: (id) => {
        setState((s) => ({
          ...s,
          clubs: s.clubs.map((c) =>
            c.id === id
              ? { ...c, status: c.status === 'active' ? 'inactive' as const : 'active' as const, updatedAt: now() }
              : c,
          ),
        }));
        const club = state.clubs.find((c) => c.id === id);
        toast(club?.status === 'active' ? 'Club deactivated' : 'Club activated');
      },

      deleteClub: (id) => {
        setState((s) => ({ ...s, clubs: s.clubs.filter((c) => c.id !== id) }));
        toast('Club removed');
      },

      sendOfferToSegment: (offerId, segment, count) => {
        const offer = state.offers.find((o) => o.id === offerId);
        if (!offer) return;
        const recipients = state.users
          .filter((u) => u.role === 'player' && u.status === 'approved' && u.whatsappMarketingOptIn)
          .slice(0, count);
        setState((s) => {
          let next = s;
          for (const u of recipients) {
            next = pushNotification(
              next,
              u.id,
              'New offer added',
              `${offer.title} at ${offer.partnerName}${offer.promoCode ? ` · code ${offer.promoCode}` : ''}.`,
              'offer_added',
              'whatsapp',
              { offerId: offer.id },
            );
          }
          return next;
        });
        toast.success(`WhatsApp offer sent (simulated)`, {
          description: `"${offer.title}" queued to ${recipients.length} marketing-opted-in players in segment: ${segment}.`,
        });
      },

      markNotificationRead: (id) => {
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        }));
      },

      markAllNotificationsRead: (userId) => {
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, isRead: true } : n)),
        }));
        toast('All notifications marked as read');
      },

      submitSupportRequest: ({ issue, contactPhone, category }) => {
        const trimmedIssue = issue.trim();
        const phone = contactPhone.trim();
        if (!trimmedIssue || !/^\+[1-9]\d{7,14}$/.test(phone)) {
          toast.error('Check your details', {
            description: 'Describe the issue and enter a valid phone number (E.164, e.g. +9715…).',
          });
          return;
        }
        const categoryLabel = SUPPORT_CATEGORY_LABELS[category];
        setState((s) => {
          const user = s.users.find((u) => u.id === s.session.currentUserId);
          if (!user) return s;
          const request: SupportRequest = {
            id: nextId('sr'),
            userId: user.id,
            category,
            issue: trimmedIssue,
            contactPhone: phone,
            status: 'open',
            createdAt: now(),
          };
          let next: StoreState = {
            ...s,
            supportRequests: [request, ...s.supportRequests],
          };
          next = pushAdminAttention(
            next,
            `Support request — ${categoryLabel}`,
            `${user.name} needs help (${categoryLabel}). Contact: ${phone}. Issue: ${trimmedIssue}`,
            'admin_support_request',
            { supportRequestId: request.id },
          );
          next = pushNotification(
            next,
            user.id,
            'Support request sent',
            'Thanks — an admin will contact you soon about your issue.',
            'support_request_sent',
            'in_app',
          );
          return next;
        });
        toast.success('Support request sent', {
          description: 'An admin will contact you soon using the number you provided.',
        });
      },

      sendGameChatMessage: (gameId, body) => {
        const trimmed = body.trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
        if (!trimmed) return;
        setState((s) => {
          const userId = s.session.currentUserId;
          const user = s.users.find((u) => u.id === userId);
          const game = s.games.find((g) => g.id === gameId && !g.deleted);
          if (!user || !game) return s;
          if (user.role !== 'admin' && !canChatInGame(s.participants, gameId, userId)) {
            return s;
          }
          const at = now();
          const message: GameChatMessage = {
            id: nextId('gm'),
            gameId,
            userId,
            body: trimmed,
            createdAt: at,
          };
          return {
            ...s,
            chatMessages: [...s.chatMessages, message],
            chatReads: { ...s.chatReads, [gameChatReadKey(gameId, userId)]: at },
          };
        });
      },

      markGameChatRead: (gameId) => {
        setState((s) => ({
          ...s,
          chatReads: { ...s.chatReads, [gameChatReadKey(gameId, s.session.currentUserId)]: now() },
        }));
      },

      sendDirectMessage: (toUserId, body) => {
        const trimmed = body.trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
        if (!trimmed) return;
        setState((s) => {
          const fromUserId = s.session.currentUserId;
          if (fromUserId === toUserId) return s;
          const from = s.users.find((u) => u.id === fromUserId);
          const to = s.users.find((u) => u.id === toUserId && u.role === 'player' && u.status !== 'banned');
          if (!from || !to) return s;
          const at = now();
          const message: DirectMessage = {
            id: nextId('dm'),
            fromUserId,
            toUserId,
            body: trimmed,
            createdAt: at,
          };
          const threadId = dmThreadId(fromUserId, toUserId);
          return {
            ...s,
            directMessages: [...s.directMessages, message],
            chatReads: { ...s.chatReads, [dmChatReadKey(threadId, fromUserId)]: at },
          };
        });
      },

      markDirectChatRead: (otherUserId) => {
        setState((s) => {
          const userId = s.session.currentUserId;
          const threadId = dmThreadId(userId, otherUserId);
          return {
            ...s,
            chatReads: { ...s.chatReads, [dmChatReadKey(threadId, userId)]: now() },
          };
        });
      },

      addPhoneNumber: (userId, phoneNumber, label) => {
        setState((s) => ({
          ...s,
          phones: [
            ...s.phones,
            { id: nextId('ph'), userId, phoneNumber, label, isPrimary: false, verifiedAt: now(), source: 'signup', createdAt: now(), updatedAt: now() },
          ],
        }));
        toast.success('Phone number added', { description: 'Verified via WhatsApp OTP (simulated).' });
      },

      setPlayerPreferences: (userId, patch) => {
        setState((s) => patchUser(s, userId, patch));
        toast.success('Preferences updated');
      },

      setWhatsappPref: (userId, key, valueBool) => {
        setState((s) => patchUser(s, userId, {
          [key]: valueBool,
          ...(key === 'whatsappOptIn' && !valueBool ? { whatsappOptOutAt: now() } : {}),
          ...(key === 'whatsappOptIn' && valueBool ? { whatsappOptInAt: now() } : {}),
          ...(key === 'whatsappMarketingOptIn' && valueBool ? { whatsappMarketingOptInAt: now() } : {}),
        } as Partial<User>));
        toast(valueBool ? 'Opted in' : 'Opted out', { description: 'Consent change recorded with timestamp.' });
      },

      banPlayer: (userId, reasonCode, note) => {
        setState((s) => {
          const numbers = s.phones.filter((p) => p.userId === userId).map((p) => p.phoneNumber);
          const user = s.users.find((u) => u.id === userId);
          let next = patchUser(s, userId, { status: 'banned' });
          next = {
            ...next,
            banRecords: [
              { id: nextId('br'), userId, phoneNumbers: numbers, email: user?.email, action: 'ban', reasonCode, note, performedBy: 'admin1', createdAt: now() },
              ...next.banRecords,
            ],
          };
          return next;
        });
        toast('Player banned', { description: 'All linked numbers blacklisted; hidden from leaderboard; WhatsApp sends suppressed.' });
      },

      unbanPlayer: (userId, note) => {
        setState((s) => {
          let next = patchUser(s, userId, { status: 'approved' });
          next = {
            ...next,
            banRecords: [
              { id: nextId('br'), userId, phoneNumbers: [], action: 'unban', reasonCode: 'admin_decision', note, performedBy: 'admin1', createdAt: now() },
              ...next.banRecords,
            ],
          };
          return next;
        });
        toast('Player unbanned');
      },

      addKarmaEvent: (userId, eventType, points, reasonCode, note) => {
        setState((s) => applyKarma(s, userId, eventType, points, { reasonCode, note, performedBy: 'admin1' }));
        toast.success(`Karma ${points > 0 ? '+' : ''}${points}: ${KARMA_EVENT_LABELS[eventType]}`);
      },

      adjustRating: (userId, type, valueNum, reasonCode, note) => {
        setState((s) => {
          const user = s.users.find((u) => u.id === userId);
          if (!user) return s;
          const pointsAfter = type === 'delta' ? user.points + valueNum : valueNum;
          let next = patchUser(s, userId, { points: pointsAfter });
          next = {
            ...next,
            ratingAdjustments: [
              { id: nextId('ra'), userId, adjustmentType: type, pointsBefore: user.points, pointsAfter, reasonCode, note, performedBy: 'admin1', createdAt: now() },
              ...next.ratingAdjustments,
            ],
          };
          return next;
        });
        toast.success('Rating adjusted', { description: 'Leaderboard recalculated; adjustment logged in audit trail.' });
      },

      mergeDuplicate: (dupId, survivorId) => {
        setState((s) => {
          const dup = s.duplicates.find((d) => d.id === dupId);
          if (!dup) return s;
          const absorbedId = dup.userIdA === survivorId ? dup.userIdB : dup.userIdA;
          const absorbed = s.users.find((u) => u.id === absorbedId);
          const survivor = s.users.find((u) => u.id === survivorId);
          if (!absorbed || !survivor) return s;
          let next: StoreState = {
            ...s,
            duplicates: s.duplicates.map((d) => (d.id === dupId ? { ...d, merged: true } : d)),
            phones: s.phones.map((p) => (p.userId === absorbedId ? { ...p, userId: survivorId, isPrimary: false } : p)),
            participants: s.participants.map((p) => (p.userId === absorbedId ? { ...p, userId: survivorId } : p)),
            users: s.users.filter((u) => u.id !== absorbedId),
            mergeLogs: [
              { id: nextId('ml'), survivorUserId: survivorId, absorbedUserId: absorbedId, movedData: `${s.phones.filter((p) => p.userId === absorbedId).length} phone number(s), ${s.participants.filter((p) => p.userId === absorbedId).length} game participation(s), ${absorbed.points} points`, performedBy: 'admin1', performedAt: now() },
              ...s.mergeLogs,
            ],
          };
          next = patchUser(next, survivorId, { points: survivor.points + absorbed.points });
          return next;
        });
        toast.success('Profiles merged', { description: 'History moved to survivor; leaderboard recalculated. Undo available for 30 days (simulated).' });
      },

      dismissDuplicate: (dupId) => {
        setState((s) => ({
          ...s,
          duplicates: s.duplicates.map((d) => (d.id === dupId ? { ...d, dismissed: true } : d)),
        }));
        toast('Marked as not a duplicate', { description: 'Dismissal remembered.' });
      },

      editPlayer: (userId, patch) => {
        setState((s) => patchUser(s, userId, patch));
        toast.success('Player updated', { description: 'Field-level change recorded in audit log.' });
      },

      setPlayerLevel: (userId, level) => {
        setState((s) => {
          const user = s.users.find((u) => u.id === userId);
          if (!user || user.level === level) return s;
          const previous = user.level;
          let next = patchUser(s, userId, {
            level,
            // Verification applied to the previous level — clear until admin re-verifies.
            levelVerified: false,
            levelVerifiedAt: undefined,
            levelVerifiedBy: undefined,
          });
          next = {
            ...next,
            activityLogs: [
              {
                id: nextId('al'), userId, eventType: 'admin_action',
                relatedEntityType: 'user', relatedEntityId: userId,
                summary: `Level adjusted ${previous} → ${level}${user.levelVerified ? ' (verification cleared)' : ''}`,
                createdAt: now(),
              },
              ...next.activityLogs,
            ],
          };
          next = pushNotification(
            next, userId, 'Level updated',
            `An admin updated your level from ${previous} to ${level}.`,
            'level_updated', 'in_app',
          );
          return next;
        });
        toast.success('Level updated', {
          description: 'Verification cleared — re-verify if this level has been assessed.',
        });
      },

      setLevelVerified: (userId, verified) => {
        setState((s) => {
          const user = s.users.find((u) => u.id === userId);
          if (!user) return s;
          let next = patchUser(s, userId, {
            levelVerified: verified,
            levelVerifiedAt: verified ? now() : undefined,
            levelVerifiedBy: verified ? 'admin1' : undefined,
          });
          next = {
            ...next,
            activityLogs: [
              {
                id: nextId('al'), userId, eventType: 'admin_action',
                relatedEntityType: 'user', relatedEntityId: userId,
                summary: verified
                  ? `Level ${user.level} verified by Padel Nomads`
                  : 'Level verification removed',
                createdAt: now(),
              },
              ...next.activityLogs,
            ],
          };
          if (verified) {
            next = pushNotification(next, userId, 'Level verified',
              `Your level (${user.level}) has been verified by Padel Nomads. The verified badge now shows on your profile.`,
              'level_verified', 'in_app');
          }
          return next;
        });
        toast.success(verified ? 'Level verified' : 'Verification removed', {
          description: verified
            ? 'The player now shows the blue verified badge next to their level.'
            : 'The verified badge was removed from this player.',
        });
      },

      updateFormatDefinition: (id, patch) => {
        setState((s) => {
          const current = s.formatDefinitions.find((d) => d.id === id);
          if (!current) return s;
          const nextDef: FormatDefinition = {
            ...current,
            ...patch,
            id: current.id,
            allowedGenderModes: patch.allowedGenderModes
              ? [...patch.allowedGenderModes]
              : [...current.allowedGenderModes],
            boostedRounds: patch.boostedRounds ? [...patch.boostedRounds] : [...current.boostedRounds],
            notes: patch.notes ? [...patch.notes] : [...current.notes],
            updatedAt: now(),
          };
          // Keep scoring / round UI in sync with admin edits.
          syncRuntimeFormatConfig(nextDef);
          return {
            ...s,
            formatDefinitions: s.formatDefinitions.map((d) => (d.id === id ? nextDef : d)),
          };
        });
        toast.success('Format updated', { description: 'Changes apply to new games and live scoring guidance.' });
      },

      formatDefinition: (id) => state.formatDefinitions.find((d) => d.id === id),
    };
  }, [state]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockData(): MockDataContextValue {
  const ctx = React.useContext(MockDataContext);
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider');
  return ctx;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
