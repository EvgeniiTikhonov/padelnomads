'use client';

import * as React from 'react';
import { toast } from 'sonner';
import type {
  User, PlayerPhoneNumber, Application, Game, GameParticipant, GameTeam, GameMatch, Offer,
  AppNotification, KarmaEvent, MessageTemplate, OutboundMessage, InboundMessage,
  ImportBatch, ImportRecord, PlayerMergeLog, BanRecord, RatingAdjustment, ActivityLog,
  ExternalPartnerInvite, MockSession, ViewRole, KarmaEventType, GameStatus, ParticipantStatus, Level,
} from '@/types';
import { computeStandings, generateNextRoundMatches } from '@/lib/scoring';
import {
  seedUsers, seedPhones, seedApplications, seedGames, seedParticipants, seedGameTeams, seedGameMatches,
  seedOffers, seedNotifications, seedKarmaEvents, seedTemplates, seedOutbound,
  seedInbound, seedImportBatches, seedImportRecords, seedDuplicates,
  seedBanRecords, seedRatingAdjustments, seedActivityLogs, seedMergeLogs,
  type DuplicateCandidate,
} from './mock';
import { karmaTierFor, KARMA_EVENT_LABELS, isFixedTeamFormat, EXTERNAL_PARTNER_HOLD_HOURS } from '@/lib/format';
import { spotsTaken, fixedTeamsTaken, maxFixedTeams, isGameFull } from '@/lib/derive';
import { gameJoinEligibility, partnerPairEligibility, requiresMixedGenderPair, isBinaryGender } from '@/lib/eligibility';
import { buildOrderedTeams, courtForIndex, teamLabel, type OrderedTeams, type StrengthContext } from '@/lib/allocation';
import { playerMatchRecords, winLossStats } from '@/lib/playerStats';

// Prototype flag (see NOTES.md / PRD §20 open questions)
export const ALLOW_SELF_REGISTER = true;

interface StoreState {
  users: User[];
  phones: PlayerPhoneNumber[];
  applications: Application[];
  games: Game[];
  participants: GameParticipant[];
  teams: GameTeam[];
  matches: GameMatch[];
  offers: Offer[];
  notifications: AppNotification[];
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
  /** Learned per-player strength bias from past manual court adjustments. */
  allocationBiases: Record<string, number>;
  session: MockSession;
}

export interface ApplicationFormInput {
  name: string;
  level: Application['level'];
  preferredSide: Application['preferredSide'];
  gender?: Application['gender'];
  referralSource?: Application['referralSource'];
  referrerPhoneNumber?: string;
  proofOfSkillFileUrl?: string;
  phoneNumber: string;
  email?: string;
  whatsappOptIn: boolean;
  whatsappMarketingOptIn: boolean;
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
  registerForGame: (gameId: string, userId: string, opts?: { lookingForPartner?: boolean }) => void;
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
  // notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
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

  const [state, setState] = React.useState<StoreState>(() => ({
    users: seedUsers,
    phones: seedPhones,
    applications: seedApplications,
    games: seedGames,
    participants: seedParticipants,
    teams: seedGameTeams,
    matches: seedGameMatches,
    offers: seedOffers,
    notifications: seedNotifications,
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
    allocationBiases: {},
    session: loadSession(),
  }));

  React.useEffect(() => {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }, [state.session]);

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
      related?: { gameId?: string; offerId?: string; applicationId?: string; audience?: 'player' | 'admin' },
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
      related?: { gameId?: string; applicationId?: string },
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
        const app: Application = {
          id: nextId('a'),
          name: input.name || undefined,
          level: input.level, preferredSide: input.preferredSide, gender: input.gender,
          referralSource: input.referralSource,
          referrerPhoneNumber: input.referrerPhoneNumber,
          proofOfSkillFileUrl: input.proofOfSkillFileUrl,
          phoneNumber: input.phoneNumber, email: input.email,
          whatsappOptIn: input.whatsappOptIn, whatsappMarketingOptIn: input.whatsappMarketingOptIn,
          matchedExistingUserId: matched?.id, blacklistFlag: blacklisted,
          status: 'pending', createdAt: now(), updatedAt: now(),
        };
        setState((s) => {
          let next: StoreState = {
            ...s,
            applications: [app, ...s.applications],
            session: { ...s.session, applicationStatus: 'pending' },
          };
          const name = app.name?.trim() || app.phoneNumber;
          next = pushAdminAttention(
            next,
            'New application',
            `${name} applied (${app.level})${app.blacklistFlag ? ' · blacklist flag' : ''}${app.matchedExistingUserId ? ' · identity match' : ''}.`,
            'admin_new_application',
            { applicationId: app.id },
          );
          return next;
        });
        toast.success('Application submitted', { description: 'Identity match and blacklist checks completed (simulated).' });
        return app;
      },

      approveApplication: (id, overrideReason) => {
        setState((s) => {
          const app = s.applications.find((a) => a.id === id);
          if (!app) return s;
          let next: StoreState = {
            ...s,
            applications: s.applications.map((a) =>
              a.id === id ? { ...a, status: 'approved' as const, reviewedBy: 'admin1', reviewedAt: now(), updatedAt: now() } : a),
          };
          if (app.matchedExistingUserId) {
            next = patchUser(next, app.matchedExistingUserId, { status: 'approved', claimedAt: now() });
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
          return next;
        });
        toast.success('Application approved', { description: 'WhatsApp welcome message sent (simulated).' });
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
        setState((s) => ({
          ...s,
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, status, reviewedBy: 'admin1', reviewedAt: now(), updatedAt: now() } : a),
        }));
        toast('Application status updated');
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
              { id: nextId('gp'), gameId, userId, status: 'confirmed' as const, confirmedAt: now(), createdAt: now(), updatedAt: now() },
              ...s.participants,
            ],
          };
          next = pushNotification(next, userId, 'Added to game', `You were added to ${game.title} at ${game.venue}.`, 'added_to_game', 'whatsapp', { gameId });
          return next;
        });
        toast.success(`${user.name} added to ${game.title}`, { description: 'Player confirmed. Reminders 24h & 2h before (simulated).' });
        return true;
      },

      removePlayerFromGame: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.filter((p) => !(p.gameId === gameId && p.userId === userId)),
          };
          if (game) next = pushNotification(next, userId, 'Removed from game', `You were removed from ${game.title}.`, 'removed_from_game', 'whatsapp', { gameId });
          return next;
        });
        toast('Player removed', { description: 'WhatsApp notification sent (simulated).' });
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
        const taken = spotsTaken(state.participants, gameId, state.externalPartnerInvites, game.format);
        const waitlisted = taken >= game.capacity;
        const lookingForPartner = Boolean(opts?.lookingForPartner && isFixedTeamFormat(game.format) && !waitlisted);
        const status = waitlisted ? 'waitlisted' as const : 'confirmed' as const;
        setState((s) => {
          const cancelled = s.participants.find(
            (p) => p.gameId === gameId && p.userId === userId && p.status === 'cancelled',
          );
          if (cancelled) {
            return {
              ...s,
              participants: s.participants.map((p) =>
                p.id === cancelled.id
                  ? {
                      ...p,
                      status,
                      confirmationRequestedAt: undefined,
                      confirmedAt: waitlisted ? undefined : now(),
                      declinedAt: undefined,
                      cancelledAt: undefined,
                      replacementOfferedAt: undefined,
                      letsGoAt: undefined,
                      lookingForPartner: lookingForPartner || undefined,
                      partnerUserId: undefined,
                      partnerInviteFrom: undefined,
                      updatedAt: now(),
                    }
                  : p),
            };
          }
          return {
            ...s,
            participants: [
              {
                id: nextId('gp'), gameId, userId,
                status,
                confirmedAt: waitlisted ? undefined : now(),
                lookingForPartner: lookingForPartner || undefined,
                createdAt: now(), updatedAt: now(),
              },
              ...s.participants,
            ],
          };
        });
        toast.success(waitlisted ? 'Added to waitlist' : lookingForPartner ? 'You\'re in — find a partner' : 'You\'re in!', {
          description: waitlisted
            ? 'The game is full — you are on the waitlist.'
            : lookingForPartner
              ? 'Spot confirmed. Invite a Nomad or a friend, or wait for a join request.'
              : 'We\'ll remind you 24h and 2h before kickoff (simulated WhatsApp).',
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
          return next;
        });
        toast('Spot cancelled', { description: 'Your spot was freed. Admin notified (simulated).' });
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
            'Late cancellation — payment owed',
            `You cancelled ${game?.title ?? 'a game'} within 12 hours. Game fee${game?.price != null ? ` (AED ${game.price})` : ''} is owed.`,
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
          return next;
        });
        toast('Cancelled — payment owed', {
          description: game?.price != null
            ? `Please pay AED ${game.price}. Late cancellation karma applied.`
            : 'Please settle the game fee with the organizer. Late cancellation karma applied.',
        });
      },

      offerReplacement: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        const user = state.users.find((u) => u.id === userId);
        const waitlist = state.participants.filter((p) => p.gameId === gameId && p.status === 'waitlisted');
        if (waitlist.length === 0) {
          setState((s) => pushAdminAttention(
            s,
            'Replacement needed',
            `${user?.name ?? 'A player'} needs a late-cancel replacement for ${game?.title ?? 'a game'} — no waitlist available.`,
            'admin_replacement_needed',
            { gameId },
          ));
          toast.error('No waitlist', { description: 'Admin was notified. Message the organizer on WhatsApp to arrange a replacement.' });
          return;
        }
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.map((p) =>
              p.gameId === gameId && p.userId === userId
                ? {
                    ...p,
                    status: 'pending_replacement' as const,
                    replacementOfferedAt: now(),
                    updatedAt: now(),
                  }
                : p),
          };
          for (const w of waitlist) {
            next = pushNotification(
              next, w.userId,
              'Spot available',
              `A spot opened on ${game?.title ?? 'a game'} — claim it before someone else does.`,
              'waitlist_offer', 'whatsapp',
              { gameId },
            );
          }
          next = pushAdminAttention(
            next,
            'Replacement in progress',
            `${user?.name ?? 'A player'} offered their spot on ${game?.title ?? 'a game'} to the waitlist (${waitlist.length}).`,
            'admin_replacement_offered',
            { gameId },
          );
          return next;
        });
        toast.success('Spot offered to waitlist', {
          description: `${waitlist.length} player${waitlist.length === 1 ? '' : 's'} notified. Your place cancels when someone takes it.`,
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
          toast.error('Spot no longer available');
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
            `You claimed a spot on ${game?.title ?? 'the game'}. See you on court.`,
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

        let fromPart = state.participants.find(
          (p) => p.gameId === gameId && p.userId === fromUserId && !['cancelled', 'waitlisted'].includes(p.status),
        );
        // Auto-register sender as solo if they are not on the game yet
        if (!fromPart) {
          if (from.karmaTier === 'restricted' || from.karmaTier === 'suspended') {
            toast.error('Registration blocked', { description: 'Your karma tier blocks self-registration.' });
            return;
          }
          // Joining an existing open solo fills their reserved team slot — no new team needed
          const joiningExistingOpen = Boolean(
            state.participants.find(
              (p) => p.gameId === gameId && p.userId === toUserId
                && !['cancelled', 'waitlisted'].includes(p.status)
                && !p.partnerUserId,
            ),
          );
          if (!joiningExistingOpen) {
            const teams = fixedTeamsTaken(state.participants, gameId, state.externalPartnerInvites);
            if (teams >= maxFixedTeams(game.capacity)) {
              toast.error('Game is full');
              return;
            }
          }
        }
        if (fromPart?.partnerUserId) {
          toast.error('You already have a partner');
          return;
        }
        const toPart = state.participants.find(
          (p) => p.gameId === gameId && p.userId === toUserId && !['cancelled'].includes(p.status),
        );
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
          if (!fromPart) {
            const teams = fixedTeamsTaken(state.participants, gameId, state.externalPartnerInvites);
            if (teams >= maxFixedTeams(game.capacity)) {
              toast.error('Game is full', { description: 'No free team slot to invite a new player.' });
              return;
            }
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
                  updatedAt: now(),
                };
              }
              if (p.userId === fromId) {
                return {
                  ...p,
                  partnerUserId: userId,
                  lookingForPartner: false,
                  partnerInviteFrom: undefined,
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
