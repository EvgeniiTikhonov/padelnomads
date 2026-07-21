'use client';

import * as React from 'react';
import { toast } from 'sonner';
import type {
  User, PlayerPhoneNumber, Application, Game, GameParticipant, Offer,
  AppNotification, KarmaEvent, MessageTemplate, OutboundMessage, InboundMessage,
  ImportBatch, ImportRecord, PlayerMergeLog, BanRecord, RatingAdjustment, ActivityLog,
  MockSession, ViewRole, KarmaEventType, GameStatus, ParticipantStatus,
} from '@/types';
import {
  seedUsers, seedPhones, seedApplications, seedGames, seedParticipants,
  seedOffers, seedNotifications, seedKarmaEvents, seedTemplates, seedOutbound,
  seedInbound, seedImportBatches, seedImportRecords, seedDuplicates,
  seedBanRecords, seedRatingAdjustments, seedActivityLogs, seedMergeLogs,
  type DuplicateCandidate,
} from './mock';
import { karmaTierFor, KARMA_EVENT_LABELS } from '@/lib/format';

// Prototype flag (see NOTES.md / PRD §20 open questions)
export const ALLOW_SELF_REGISTER = true;

interface StoreState {
  users: User[];
  phones: PlayerPhoneNumber[];
  applications: Application[];
  games: Game[];
  participants: GameParticipant[];
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
  session: MockSession;
}

export interface ApplicationFormInput {
  name: string;
  level: Application['level'];
  preferredSide: Application['preferredSide'];
  gender?: Application['gender'];
  referralSource?: Application['referralSource'];
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
  // player participation
  registerForGame: (gameId: string, userId: string) => void;
  confirmParticipation: (gameId: string, userId: string) => void;
  declineParticipation: (gameId: string, userId: string) => void;
  // in-game
  setParticipantStatus: (participantId: string, status: ParticipantStatus) => void;
  markAttendance: (participantId: string, value: NonNullable<GameParticipant['attendance']>) => void;
  markPayment: (participantId: string, value: NonNullable<GameParticipant['paymentStatus']>) => void;
  setResult: (participantId: string, position: number, points: number) => void;
  publishResults: (gameId: string) => void;
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
  // player management
  banPlayer: (userId: string, reasonCode: string, note: string) => void;
  unbanPlayer: (userId: string, note: string) => void;
  addKarmaEvent: (userId: string, eventType: KarmaEventType, points: number, reasonCode?: string, note?: string) => void;
  adjustRating: (userId: string, type: 'delta' | 'absolute', value: number, reasonCode: string, note?: string) => void;
  mergeDuplicate: (dupId: string, survivorId: string) => void;
  dismissDuplicate: (dupId: string) => void;
  editPlayer: (userId: string, patch: Partial<User>) => void;
}

const MockDataContext = React.createContext<MockDataContextValue | null>(null);

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}${++idCounter}`;
const now = () => new Date().toISOString();

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

    const pushNotification = (s: StoreState, userId: string, title: string, message: string, type: string, channel: 'in_app' | 'whatsapp' = 'in_app'): StoreState => ({
      ...s,
      notifications: [
        { id: nextId('n'), userId, title, message, type, channel, isRead: false, createdAt: now() },
        ...s.notifications,
      ],
    });

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
          proofOfSkillFileUrl: input.proofOfSkillFileUrl,
          phoneNumber: input.phoneNumber, email: input.email,
          whatsappOptIn: input.whatsappOptIn, whatsappMarketingOptIn: input.whatsappMarketingOptIn,
          matchedExistingUserId: matched?.id, blacklistFlag: blacklisted,
          status: 'pending', createdAt: now(), updatedAt: now(),
        };
        setState((s) => ({
          ...s,
          applications: [app, ...s.applications],
          session: { ...s.session, applicationStatus: 'pending' },
        }));
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
              next = pushNotification(next, p.userId, 'Game cancelled', `${game?.title ?? 'A game'} has been cancelled.`, 'game_cancelled', 'whatsapp');
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
        const roster = state.participants.filter((p) => p.gameId === gameId && !['cancelled', 'waitlisted'].includes(p.status));
        if (user.status === 'banned') {
          toast.error('Cannot add banned player', { description: `${user.name} is banned and blacklisted.` });
          return false;
        }
        if ((user.karmaTier === 'restricted' || user.karmaTier === 'suspended') && !opts?.overrideReason) {
          toast.error(`Player is karma-${user.karmaTier}`, { description: 'Adding requires an explicit override with a logged reason.' });
          return false;
        }
        if (roster.length >= game.capacity && !opts?.overrideReason) {
          toast.error('Game is full', { description: 'Adding beyond capacity requires an admin override.' });
          return false;
        }
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: [
              { id: nextId('gp'), gameId, userId, status: 'registered' as const, confirmationRequestedAt: now(), createdAt: now(), updatedAt: now() },
              ...s.participants,
            ],
          };
          next = pushNotification(next, userId, 'Added to game', `You were added to ${game.title} at ${game.venue}.`, 'added_to_game', 'whatsapp');
          return next;
        });
        toast.success(`${user.name} added to ${game.title}`, { description: 'WhatsApp confirmation request sent (simulated).' });
        return true;
      },

      removePlayerFromGame: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.filter((p) => !(p.gameId === gameId && p.userId === userId)),
          };
          if (game) next = pushNotification(next, userId, 'Removed from game', `You were removed from ${game.title}.`, 'removed_from_game', 'whatsapp');
          return next;
        });
        toast('Player removed', { description: 'WhatsApp notification sent (simulated).' });
      },

      registerForGame: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        const user = state.users.find((u) => u.id === userId);
        if (!game || !user) return;
        if (user.karmaTier === 'restricted' || user.karmaTier === 'suspended') {
          toast.error('Registration blocked', { description: `Your karma tier (${user.karmaTier}) currently blocks self-registration. Play reliably to recover.` });
          return;
        }
        const roster = state.participants.filter((p) => p.gameId === gameId && !['cancelled', 'waitlisted'].includes(p.status));
        const waitlisted = roster.length >= game.capacity;
        setState((s) => ({
          ...s,
          participants: [
            { id: nextId('gp'), gameId, userId, status: waitlisted ? 'waitlisted' as const : 'registered' as const, confirmationRequestedAt: waitlisted ? undefined : now(), createdAt: now(), updatedAt: now() },
            ...s.participants,
          ],
        }));
        toast.success(waitlisted ? 'Added to waitlist' : 'Registered!', {
          description: waitlisted ? 'The game is full — you are on the waitlist.' : 'WhatsApp confirmation request sent (simulated).',
        });
      },

      confirmParticipation: (gameId, userId) => {
        setState((s) => ({
          ...s,
          participants: s.participants.map((p) =>
            p.gameId === gameId && p.userId === userId
              ? { ...p, status: 'confirmed' as const, confirmedAt: now(), updatedAt: now() } : p),
        }));
        toast.success('Participation confirmed', { description: 'Confirmed via WhatsApp (simulated).' });
      },

      declineParticipation: (gameId, userId) => {
        const game = state.games.find((g) => g.id === gameId);
        let lateNote: string | null = null;
        if (game) {
          const start = new Date(`${game.date}T${game.startTime}:00`);
          const hours = (start.getTime() - Date.now()) / 3600000;
          if (hours < 4) lateNote = 'very_late';
          else if (hours < 24) lateNote = 'late';
        }
        setState((s) => {
          let next: StoreState = {
            ...s,
            participants: s.participants.map((p) =>
              p.gameId === gameId && p.userId === userId
                ? { ...p, status: 'cancelled' as const, declinedAt: now(), cancelledAt: now(), updatedAt: now() } : p),
          };
          if (lateNote === 'very_late') next = applyKarma(next, userId, 'very_late_cancellation', -25, { gameId });
          else if (lateNote === 'late') next = applyKarma(next, userId, 'late_cancellation', -15, { gameId });
          return next;
        });
        toast('Marked as cannot play', {
          description: lateNote
            ? `Late cancellation penalty applied (${lateNote === 'very_late' ? '-25' : '-15'} karma). Admin notified (simulated).`
            : 'Spot freed. Admin notified via WhatsApp reply (simulated).',
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

      setResult: (participantId, position, points) => {
        setState((s) => ({
          ...s,
          participants: s.participants.map((p) => (p.id === participantId ? { ...p, position, pointsAwarded: points, updatedAt: now() } : p)),
        }));
      },

      publishResults: (gameId) => {
        setState((s) => {
          const game = s.games.find((g) => g.id === gameId);
          let next: StoreState = {
            ...s,
            games: s.games.map((g) => (g.id === gameId ? { ...g, status: 'completed' as const, updatedAt: now() } : g)),
          };
          for (const p of s.participants.filter((x) => x.gameId === gameId)) {
            if (p.pointsAwarded && p.status !== 'cancelled') {
              const u = next.users.find((x) => x.id === p.userId);
              if (u) next = patchUser(next, p.userId, { points: u.points + p.pointsAwarded });
            }
            if (p.attendance === 'on_time') {
              next = applyKarma(next, p.userId, 'on_time_game', 2, { gameId });
            }
            next = pushNotification(next, p.userId, 'Result published',
              `Results for ${game?.title ?? 'your game'} are out${p.position ? ` — you finished ${ordinal(p.position)}` : ''}${p.pointsAwarded ? ` and earned ${p.pointsAwarded} points` : ''}.`,
              'result_published', 'in_app');
          }
          return next;
        });
        toast.success('Results published', { description: 'Leaderboard updated. Results summary sent to participants via WhatsApp (simulated).' });
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
        toast.success(`WhatsApp offer sent (simulated)`, {
          description: `"${offer?.title}" queued to ${count} marketing-opted-in players in segment: ${segment}.`,
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
