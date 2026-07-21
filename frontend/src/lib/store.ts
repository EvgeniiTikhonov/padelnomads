import { useSyncExternalStore } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Role = 'player' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type GameStatus = 'upcoming' | 'live' | 'past' | 'cancelled';
export type OfferStatus = 'active' | 'inactive';

export const GAME_FORMATS = [
  'Social Shuffle',
  'King of the Court',
  'Court of Queens',
  'King & Queen of the Court',
  'Fixed Pairs',
  'Mini-Tournament',
  'Americano',
] as const;
export type GameFormat = (typeof GAME_FORMATS)[number];

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'] as const;

export type User = {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: Role;
  status: UserStatus;
  level?: string;
  preferredSide?: string;
  gender?: string;
  memberSince: string;
  createdAt: string;
};

export type Application = {
  id: string;
  userId?: string;
  name: string;
  phoneNumber: string;
  email?: string;
  level: string;
  preferredSide: string;
  gender?: string;
  referralSource?: string;
  referrerPhoneNumber?: string;
  proofOfSkillFileUrl?: string;
  status: ApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type GameResultEntry = {
  userId: string;
  position: number;
  points: number;
};

export type Game = {
  id: string;
  title: string;
  format: GameFormat;
  venue: string;
  date: string; // ISO date (yyyy-mm-dd)
  startTime: string;
  endTime: string;
  courts: number;
  capacity: number;
  level: string;
  price?: number;
  genderRestriction?: string;
  description?: string;
  status: GameStatus;
  players: string[]; // userIds
  results?: GameResultEntry[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Offer = {
  id: string;
  title: string;
  partnerName: string;
  description: string;
  discount?: string;
  promoCode?: string;
  link?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
};

export type NotificationType =
  | 'application_approved'
  | 'application_rejected'
  | 'added_to_game'
  | 'removed_from_game'
  | 'game_updated'
  | 'game_cancelled'
  | 'offer_added'
  | 'result_published';

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
};

export type StoreState = {
  users: User[];
  applications: Application[];
  games: Game[];
  offers: Offer[];
  notifications: Notification[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'padel-nomads-store-v1';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

function buildSeed(): StoreState {
  const created = nowIso();

  const admin: User = {
    id: 'u_admin',
    name: 'Dima Volkov',
    phoneNumber: '+971 50 111 2233',
    email: 'admin@padelnomads.com',
    role: 'admin',
    status: 'approved',
    level: 'Advanced',
    preferredSide: 'Both',
    memberSince: dateOffset(-420),
    createdAt: created,
  };

  const playerSeeds: Array<Partial<User> & { name: string }> = [
    { name: 'Alex Carter', level: 'Advanced', preferredSide: 'Right', gender: 'Male' },
    { name: 'Sofia Reyes', level: 'Professional', preferredSide: 'Left', gender: 'Female' },
    { name: 'Liam Novak', level: 'Intermediate', preferredSide: 'Both', gender: 'Male' },
    { name: 'Maya Haddad', level: 'Advanced', preferredSide: 'Left', gender: 'Female' },
    { name: 'Ethan Park', level: 'Intermediate', preferredSide: 'Right', gender: 'Male' },
    { name: 'Nadia Costa', level: 'Professional', preferredSide: 'Both', gender: 'Female' },
    { name: 'Omar Faris', level: 'Advanced', preferredSide: 'Right', gender: 'Male' },
    { name: 'Jenna Lee', level: 'Beginner', preferredSide: 'Left', gender: 'Female' },
  ];

  const players: User[] = playerSeeds.map((p, i) => ({
    id: `u_player_${i + 1}`,
    name: p.name,
    phoneNumber: `+971 50 ${100 + i}0 ${1000 + i}`,
    email: `${p.name.split(' ')[0].toLowerCase()}@example.com`,
    role: 'player',
    status: 'approved',
    level: p.level,
    preferredSide: p.preferredSide,
    gender: p.gender,
    memberSince: dateOffset(-300 + i * 20),
    createdAt: created,
  }));

  // The "demo" approved player used for quick login
  const demoPlayer: User = {
    id: 'u_me',
    name: 'Jordan Blake',
    phoneNumber: '+971 50 999 8877',
    email: 'player@padelnomads.com',
    role: 'player',
    status: 'approved',
    level: 'Intermediate',
    preferredSide: 'Right',
    gender: 'Non-binary',
    memberSince: dateOffset(-90),
    createdAt: created,
  };

  // A pending applicant used for quick login
  const pendingUser: User = {
    id: 'u_pending',
    name: 'Sam Rivera',
    phoneNumber: '+971 50 555 4433',
    email: 'pending@padelnomads.com',
    role: 'player',
    status: 'pending',
    level: 'Intermediate',
    preferredSide: 'Both',
    memberSince: dateOffset(-2),
    createdAt: created,
  };

  const users = [admin, demoPlayer, ...players, pendingUser];
  const allPlayerIds = [demoPlayer.id, ...players.map((p) => p.id)];

  const applications: Application[] = [
    {
      id: 'app_pending_1',
      userId: pendingUser.id,
      name: pendingUser.name,
      phoneNumber: pendingUser.phoneNumber,
      email: pendingUser.email,
      level: 'Intermediate',
      preferredSide: 'Both',
      gender: 'Prefer not to say',
      referralSource: 'Instagram',
      status: 'pending',
      createdAt: dateOffset(-2),
    },
    {
      id: 'app_pending_2',
      name: 'Priya Sharma',
      phoneNumber: '+971 50 222 1199',
      email: 'priya@example.com',
      level: 'Advanced',
      preferredSide: 'Left',
      gender: 'Female',
      referralSource: 'Friend',
      proofOfSkillFileUrl: 'proof-priya-ranking.pdf',
      status: 'pending',
      createdAt: dateOffset(-1),
    },
    {
      id: 'app_approved_1',
      userId: players[0].id,
      name: players[0].name,
      phoneNumber: players[0].phoneNumber,
      email: players[0].email,
      level: players[0].level!,
      preferredSide: players[0].preferredSide!,
      gender: players[0].gender,
      referralSource: 'Event',
      status: 'approved',
      reviewedBy: admin.id,
      reviewedAt: dateOffset(-60),
      createdAt: dateOffset(-62),
    },
  ];

  // Past games with results to feed the leaderboard
  const pastGame = (
    idx: number,
    daysAgo: number,
    format: GameFormat,
    participantIds: string[],
  ): Game => {
    const results: GameResultEntry[] = participantIds.map((userId, i) => ({
      userId,
      position: i + 1,
      points: Math.max(10, 50 - i * 8),
    }));
    return {
      id: `g_past_${idx}`,
      title: `${format} — Week ${idx}`,
      format,
      venue: idx % 2 === 0 ? 'Just Padel, Al Quoz' : 'Padel Pro, JLT',
      date: dateOffset(-daysAgo),
      startTime: '19:00',
      endTime: '21:00',
      courts: 2,
      capacity: participantIds.length,
      level: 'Intermediate',
      description: 'Completed community session.',
      status: 'past',
      players: participantIds,
      results,
      createdBy: admin.id,
      createdAt: dateOffset(-daysAgo - 5),
      updatedAt: dateOffset(-daysAgo),
    };
  };

  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const games: Game[] = [
    pastGame(1, 25, 'Americano', shuffle(allPlayerIds).slice(0, 6)),
    pastGame(2, 18, 'King of the Court', shuffle(allPlayerIds).slice(0, 8)),
    pastGame(3, 11, 'Social Shuffle', shuffle(allPlayerIds).slice(0, 6)),
    pastGame(4, 4, 'Mini-Tournament', shuffle(allPlayerIds).slice(0, 8)),
    {
      id: 'g_live_1',
      title: 'Friday Night King of the Court',
      format: 'King of the Court',
      venue: 'Just Padel, Al Quoz',
      date: dateOffset(0),
      startTime: '19:00',
      endTime: '21:00',
      courts: 2,
      capacity: 8,
      level: 'Intermediate',
      description: 'Live now — climb the court ladder.',
      status: 'live',
      players: [demoPlayer.id, ...players.slice(0, 5).map((p) => p.id)],
      createdBy: admin.id,
      createdAt: dateOffset(-7),
      updatedAt: dateOffset(0),
    },
    {
      id: 'g_up_1',
      title: 'Sunday Social Shuffle',
      format: 'Social Shuffle',
      venue: 'Padel Pro, JLT',
      date: dateOffset(2),
      startTime: '10:00',
      endTime: '12:00',
      courts: 3,
      capacity: 12,
      level: 'All levels',
      price: 60,
      description: 'Relaxed mixed games, rotating partners every round.',
      status: 'upcoming',
      players: [demoPlayer.id, ...players.slice(0, 3).map((p) => p.id)],
      createdBy: admin.id,
      createdAt: dateOffset(-3),
      updatedAt: dateOffset(-3),
    },
    {
      id: 'g_up_2',
      title: 'Court of Queens',
      format: 'Court of Queens',
      venue: 'Just Padel, Al Quoz',
      date: dateOffset(5),
      startTime: '18:00',
      endTime: '20:00',
      courts: 2,
      capacity: 8,
      level: 'Advanced',
      genderRestriction: 'Women',
      price: 70,
      description: 'Women-only competitive session.',
      status: 'upcoming',
      players: players.filter((p) => p.gender === 'Female').map((p) => p.id),
      createdBy: admin.id,
      createdAt: dateOffset(-3),
      updatedAt: dateOffset(-3),
    },
    {
      id: 'g_up_3',
      title: 'Midweek Americano',
      format: 'Americano',
      venue: 'Padel Pro, JLT',
      date: dateOffset(9),
      startTime: '20:00',
      endTime: '22:00',
      courts: 2,
      capacity: 8,
      level: 'Intermediate',
      price: 65,
      description: 'Individual scoring, everyone plays with everyone.',
      status: 'upcoming',
      players: players.slice(2, 5).map((p) => p.id),
      createdBy: admin.id,
      createdAt: dateOffset(-2),
      updatedAt: dateOffset(-2),
    },
    {
      id: 'g_up_4',
      title: 'Weekend Fixed Pairs',
      format: 'Fixed Pairs',
      venue: 'Just Padel, Al Quoz',
      date: dateOffset(13),
      startTime: '09:00',
      endTime: '11:00',
      courts: 2,
      capacity: 8,
      level: 'Advanced',
      price: 75,
      description: 'Bring your partner, fixed teams all session.',
      status: 'upcoming',
      players: [],
      createdBy: admin.id,
      createdAt: dateOffset(-1),
      updatedAt: dateOffset(-1),
    },
  ];

  const offers: Offer[] = [
    {
      id: 'o_1',
      title: '20% off all rackets',
      partnerName: 'Padel Pro Shop',
      description: 'Members get 20% off the entire range of rackets and accessories in store and online.',
      discount: '20% off',
      promoCode: 'NOMADS20',
      link: 'https://example.com/padel-pro',
      startDate: dateOffset(-10),
      endDate: dateOffset(40),
      status: 'active',
      createdAt: dateOffset(-10),
      updatedAt: dateOffset(-10),
    },
    {
      id: 'o_2',
      title: 'Free recovery session',
      partnerName: 'Reset Recovery',
      description: 'One complimentary recovery & stretch session for new members.',
      discount: 'Free session',
      promoCode: 'RESETNOMADS',
      link: 'https://example.com/reset',
      startDate: dateOffset(-5),
      endDate: dateOffset(60),
      status: 'active',
      createdAt: dateOffset(-5),
      updatedAt: dateOffset(-5),
    },
    {
      id: 'o_3',
      title: '15% off smoothies',
      partnerName: 'Green Fuel Cafe',
      description: 'Show your member profile for 15% off any smoothie or protein bowl.',
      discount: '15% off',
      link: 'https://example.com/greenfuel',
      startDate: dateOffset(-2),
      endDate: dateOffset(90),
      status: 'active',
      createdAt: dateOffset(-2),
      updatedAt: dateOffset(-2),
    },
    {
      id: 'o_4',
      title: 'Early bird court rental',
      partnerName: 'Just Padel',
      description: 'Discounted off-peak court rentals before 4pm on weekdays.',
      discount: '25% off',
      promoCode: 'EARLYBIRD',
      startDate: dateOffset(-30),
      endDate: dateOffset(-1),
      status: 'inactive',
      createdAt: dateOffset(-30),
      updatedAt: dateOffset(-1),
    },
  ];

  const notifications: Notification[] = [
    {
      id: uid('n'),
      userId: demoPlayer.id,
      title: 'Welcome to Padel Nomads',
      message: 'Your application was approved. Welcome to the community!',
      type: 'application_approved',
      isRead: true,
      createdAt: dateOffset(-90),
    },
    {
      id: uid('n'),
      userId: demoPlayer.id,
      title: 'You are in: Sunday Social Shuffle',
      message: 'You have been added to Sunday Social Shuffle on ' + dateOffset(2) + '.',
      type: 'added_to_game',
      isRead: false,
      createdAt: dateOffset(-3),
    },
    {
      id: uid('n'),
      userId: demoPlayer.id,
      title: 'New offer: 20% off all rackets',
      message: 'Padel Pro Shop is offering members 20% off rackets. Use code NOMADS20.',
      type: 'offer_added',
      isRead: false,
      createdAt: dateOffset(-10),
    },
    {
      id: uid('n'),
      userId: demoPlayer.id,
      title: 'Results published',
      message: 'Results for Mini-Tournament — Week 4 are now live. Check your stats.',
      type: 'result_published',
      isRead: false,
      createdAt: dateOffset(-4),
    },
  ];

  return { users, applications, games, offers, notifications };
}

/* ------------------------------------------------------------------ */
/* Reactive store                                                      */
/* ------------------------------------------------------------------ */

let state: StoreState = load();
const listeners = new Set<() => void>();

function load(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoreState;
  } catch {
    /* ignore */
  }
  const seed = buildSeed();
  persist(seed);
  return seed;
}

function persist(next: StoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function setState(updater: (prev: StoreState) => StoreState) {
  state = updater(state);
  persist(state);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): StoreState {
  return state;
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  // Snapshot the whole (referentially stable) state object so useSyncExternalStore
  // is happy, then derive the selected value during render. The state reference only
  // changes when setState produces a new object, so derived arrays/objects are safe.
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(snapshot);
}

export function getState(): StoreState {
  return state;
}

export function resetStore() {
  const seed = buildSeed();
  setState(() => seed);
}

/* ------------------------------------------------------------------ */
/* Notifications helper                                                 */
/* ------------------------------------------------------------------ */

function notify(userId: string, type: NotificationType, title: string, message: string) {
  const n: Notification = {
    id: uid('n'),
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: nowIso(),
  };
  setState((prev) => ({ ...prev, notifications: [n, ...prev.notifications] }));
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export const actions = {
  /* Applications --------------------------------------------------- */
  submitApplication(input: Omit<Application, 'id' | 'status' | 'createdAt'>): Application {
    const existing = state.users.find(
      (u) => u.phoneNumber.replace(/\s/g, '') === input.phoneNumber.replace(/\s/g, ''),
    );
    const user: User =
      existing ??
      {
        id: uid('u'),
        name: input.name,
        phoneNumber: input.phoneNumber,
        email: input.email,
        role: 'player',
        status: 'pending',
        level: input.level,
        preferredSide: input.preferredSide,
        gender: input.gender,
        memberSince: nowIso().slice(0, 10),
        createdAt: nowIso(),
      };

    const application: Application = {
      ...input,
      id: uid('app'),
      userId: user.id,
      status: 'pending',
      createdAt: nowIso(),
    };

    setState((prev) => ({
      ...prev,
      users: existing ? prev.users : [...prev.users, user],
      applications: [application, ...prev.applications],
    }));
    return application;
  },

  approveApplication(applicationId: string, adminId: string) {
    const app = state.applications.find((a) => a.id === applicationId);
    if (!app) return;
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === applicationId
          ? { ...a, status: 'approved', reviewedBy: adminId, reviewedAt: nowIso() }
          : a,
      ),
      users: prev.users.map((u) =>
        u.id === app.userId ? { ...u, status: 'approved' } : u,
      ),
    }));
    if (app.userId) {
      notify(
        app.userId,
        'application_approved',
        'Application approved',
        'Welcome to Padel Nomads! You now have full access to the member area.',
      );
    }
  },

  rejectApplication(applicationId: string, adminId: string) {
    const app = state.applications.find((a) => a.id === applicationId);
    if (!app) return;
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === applicationId
          ? { ...a, status: 'rejected', reviewedBy: adminId, reviewedAt: nowIso() }
          : a,
      ),
      users: prev.users.map((u) =>
        u.id === app.userId ? { ...u, status: 'rejected' } : u,
      ),
    }));
    if (app.userId) {
      notify(
        app.userId,
        'application_rejected',
        'Application update',
        'Thank you for applying. Unfortunately your application was not approved at this time.',
      );
    }
  },

  /* Games ---------------------------------------------------------- */
  createGame(input: Omit<Game, 'id' | 'createdAt' | 'updatedAt' | 'players' | 'results'> & { players?: string[] }): Game {
    const game: Game = {
      ...input,
      players: input.players ?? [],
      id: uid('g'),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    setState((prev) => ({ ...prev, games: [game, ...prev.games] }));
    return game;
  },

  updateGame(gameId: string, patch: Partial<Game>) {
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId ? { ...g, ...patch, updatedAt: nowIso() } : g,
      ),
    }));
    const game = state.games.find((g) => g.id === gameId);
    if (game) {
      game.players.forEach((uidp) =>
        notify(uidp, 'game_updated', 'Game updated', `${game.title} has been updated.`),
      );
    }
  },

  deleteGame(gameId: string) {
    const game = state.games.find((g) => g.id === gameId);
    setState((prev) => ({ ...prev, games: prev.games.filter((g) => g.id !== gameId) }));
    if (game) {
      game.players.forEach((uidp) =>
        notify(uidp, 'game_cancelled', 'Game cancelled', `${game.title} has been cancelled.`),
      );
    }
  },

  setGameStatus(gameId: string, status: GameStatus) {
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId ? { ...g, status, updatedAt: nowIso() } : g,
      ),
    }));
  },

  addPlayerToGame(gameId: string, userId: string) {
    const game = state.games.find((g) => g.id === gameId);
    if (!game || game.players.includes(userId)) return;
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId ? { ...g, players: [...g.players, userId], updatedAt: nowIso() } : g,
      ),
    }));
    notify(userId, 'added_to_game', 'Added to a game', `You have been added to ${game.title}.`);
  },

  removePlayerFromGame(gameId: string, userId: string) {
    const game = state.games.find((g) => g.id === gameId);
    if (!game) return;
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId
          ? { ...g, players: g.players.filter((p) => p !== userId), updatedAt: nowIso() }
          : g,
      ),
    }));
    notify(
      userId,
      'removed_from_game',
      'Removed from a game',
      `You have been removed from ${game.title}.`,
    );
  },

  publishResults(gameId: string, results: GameResultEntry[]) {
    const game = state.games.find((g) => g.id === gameId);
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId ? { ...g, results, status: 'past', updatedAt: nowIso() } : g,
      ),
    }));
    if (game) {
      results.forEach((r) =>
        notify(
          r.userId,
          'result_published',
          'Results published',
          `Results for ${game.title} are now live. You earned ${r.points} points.`,
        ),
      );
    }
  },

  /* Offers --------------------------------------------------------- */
  createOffer(input: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Offer {
    const offer: Offer = {
      ...input,
      id: uid('o'),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    setState((prev) => ({ ...prev, offers: [offer, ...prev.offers] }));
    if (offer.status === 'active') {
      state.users
        .filter((u) => u.status === 'approved' && u.role === 'player')
        .forEach((u) =>
          notify(u.id, 'offer_added', `New offer: ${offer.title}`, offer.description),
        );
    }
    return offer;
  },

  updateOffer(offerId: string, patch: Partial<Offer>) {
    setState((prev) => ({
      ...prev,
      offers: prev.offers.map((o) =>
        o.id === offerId ? { ...o, ...patch, updatedAt: nowIso() } : o,
      ),
    }));
  },

  deleteOffer(offerId: string) {
    setState((prev) => ({ ...prev, offers: prev.offers.filter((o) => o.id !== offerId) }));
  },

  /* Notifications -------------------------------------------------- */
  markNotificationRead(notificationId: string) {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n,
      ),
    }));
  },

  markAllNotificationsRead(userId: string) {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.userId === userId ? { ...n, isRead: true } : n,
      ),
    }));
  },
};

/* ------------------------------------------------------------------ */
/* Derived selectors                                                   */
/* ------------------------------------------------------------------ */

export type LeaderboardRow = {
  userId: string;
  name: string;
  level?: string;
  points: number;
  gamesPlayed: number;
  rank: number;
};

export function computeLeaderboard(s: StoreState): LeaderboardRow[] {
  const totals = new Map<string, { points: number; games: number }>();
  for (const g of s.games) {
    if (g.status !== 'past' || !g.results) continue;
    for (const r of g.results) {
      const cur = totals.get(r.userId) ?? { points: 0, games: 0 };
      cur.points += r.points;
      cur.games += 1;
      totals.set(r.userId, cur);
    }
  }
  const rows: LeaderboardRow[] = s.users
    .filter((u) => u.role === 'player' && u.status === 'approved')
    .map((u) => {
      const t = totals.get(u.id) ?? { points: 0, games: 0 };
      return {
        userId: u.id,
        name: u.name,
        level: u.level,
        points: t.points,
        gamesPlayed: t.games,
        rank: 0,
      };
    })
    .sort((a, b) => b.points - a.points || b.gamesPlayed - a.gamesPlayed);

  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export type PlayerQuickStats = {
  totalGames: number;
  totalPoints: number;
  rank: number | null;
  upcomingCount: number;
  lastGame?: Game;
  wins: number;
};

export function computePlayerStats(s: StoreState, userId: string): PlayerQuickStats {
  const board = computeLeaderboard(s);
  const row = board.find((r) => r.userId === userId);
  const pastGames = s.games
    .filter((g) => g.status === 'past' && g.players.includes(userId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const wins = pastGames.filter(
    (g) => g.results?.find((r) => r.userId === userId)?.position === 1,
  ).length;
  const upcoming = s.games.filter(
    (g) => (g.status === 'upcoming' || g.status === 'live') && g.players.includes(userId),
  );
  return {
    totalGames: pastGames.length,
    totalPoints: row?.points ?? 0,
    rank: row?.rank ?? null,
    upcomingCount: upcoming.length,
    lastGame: pastGames[0],
    wins,
  };
}

export function userById(s: StoreState, id: string): User | undefined {
  return s.users.find((u) => u.id === id);
}

export function upcomingWindowGames(s: StoreState): Game[] {
  const today = new Date().toISOString().slice(0, 10);
  const in14 = dateOffset(14);
  return s.games
    .filter(
      (g) =>
        (g.status === 'upcoming' || g.status === 'live') &&
        g.date >= today &&
        g.date <= in14,
    )
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.startTime.localeCompare(b.startTime)));
}
