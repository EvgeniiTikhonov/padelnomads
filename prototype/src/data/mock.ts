import type {
  User, PlayerPhoneNumber, Application, Game, GameParticipant, Offer,
  AppNotification, KarmaEvent, MessageTemplate, OutboundMessage, InboundMessage,
  ImportBatch, ImportRecord, PlayerMergeLog, BanRecord, RatingAdjustment, ActivityLog,
  Level, PreferredSide, Gender, UserStatus, GameFormat, GameStatus,
  ParticipantStatus, KarmaEventType,
} from '@/types';
import { karmaTierFor } from '@/lib/format';

// ---- date helpers (all seed dates are relative to "now" so the demo stays fresh) ----
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
function dateStr(days: number): string {
  return daysFromNow(days).toISOString().slice(0, 10);
}
function iso(days: number, hour = 12): string {
  const d = daysFromNow(days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ---- players (~40) ----
interface P {
  id: string; name: string; level: Level; side: PreferredSide; gender?: Gender;
  points: number; karma: number; status?: UserStatus; email?: string;
  source?: 'signup' | 'import'; marketing?: boolean; memberDays?: number;
}
const P_LIST: P[] = [
  { id: 'u1', name: 'Alex Ivanov', level: 'C+', side: 'right', gender: 'male', points: 342, karma: 88, email: 'alex.ivanov@example.com', marketing: true, memberDays: 410 },
  { id: 'u2', name: 'Maria Petrova', level: 'B+', side: 'left', gender: 'female', points: 512, karma: 100, email: 'maria.p@example.com', marketing: true, memberDays: 620 },
  { id: 'u3', name: 'James Carter', level: 'B', side: 'both', gender: 'male', points: 486, karma: 95, email: 'jcarter@example.com', memberDays: 540 },
  { id: 'u4', name: 'Sofia Rossi', level: 'C Strong', side: 'right', gender: 'female', points: 298, karma: 76, email: 'sofia.rossi@example.com', marketing: true, memberDays: 300 },
  { id: 'u5', name: 'Daniel Kim', level: 'A+', side: 'left', gender: 'male', points: 640, karma: 92, email: 'dkim@example.com', memberDays: 700 },
  { id: 'u6', name: 'Laura Sanchez', level: 'D', side: 'both', gender: 'female', points: 112, karma: 100, email: 'laura.s@example.com', marketing: true, memberDays: 90 },
  { id: 'u7', name: 'Omar Haddad', level: 'C', side: 'left', gender: 'male', points: 275, karma: 64, email: 'omar.h@example.com', memberDays: 250 },
  { id: 'u8', name: 'Emma Wilson', level: 'B+', side: 'right', gender: 'female', points: 455, karma: 82, email: 'emma.w@example.com', marketing: true, memberDays: 480 },
  { id: 'u9', name: 'Lucas Meyer', level: 'C+', side: 'both', gender: 'male', points: 310, karma: 71, email: 'lucas.m@example.com', memberDays: 330 },
  { id: 'u10', name: 'Anna Kowalska', level: 'D+', side: 'right', gender: 'female', points: 95, karma: 97, email: 'anna.k@example.com', memberDays: 60 },
  { id: 'u11', name: 'Pavel Novak', level: 'B', side: 'left', gender: 'male', points: 470, karma: 58, email: 'pavel.n@example.com', memberDays: 500 },
  { id: 'u12', name: 'Chloe Dubois', level: 'C', side: 'right', gender: 'female', points: 288, karma: 90, email: 'chloe.d@example.com', marketing: true, memberDays: 280 },
  { id: 'u13', name: 'Marco Bianchi', level: 'A', side: 'both', gender: 'male', points: 605, karma: 85, email: 'marco.b@example.com', memberDays: 650 },
  { id: 'u14', name: 'Yuki Tanaka', level: 'C', side: 'left', gender: 'female', points: 265, karma: 100, email: 'yuki.t@example.com', memberDays: 200 },
  { id: 'u15', name: 'Sergey Volkov', level: 'B', side: 'right', gender: 'male', points: 430, karma: 45, email: 'sergey.v@example.com', memberDays: 420 },
  { id: 'u16', name: 'Isabella Ferrari', level: 'D', side: 'both', gender: 'female', points: 130, karma: 93, email: 'isa.f@example.com', marketing: true, memberDays: 120 },
  { id: 'u17', name: 'Tom Becker', level: 'C', side: 'left', gender: 'male', points: 320, karma: 38, email: 'tom.b@example.com', memberDays: 350 },
  { id: 'u18', name: 'Nadia Rahman', level: 'B+', side: 'right', gender: 'female', points: 495, karma: 100, email: 'nadia.r@example.com', marketing: true, memberDays: 560 },
  { id: 'u19', name: 'Carlos Mendes', level: 'C', side: 'both', gender: 'male', points: 240, karma: 79, email: 'carlos.m@example.com', memberDays: 220 },
  { id: 'u20', name: 'Elena Georgiou', level: 'E', side: 'left', gender: 'female', points: 88, karma: 96, email: 'elena.g@example.com', memberDays: 45 },
  { id: 'u21', name: 'Viktor Petrov', level: 'B', side: 'right', gender: 'male', points: 448, karma: 68, email: 'viktor.p@example.com', memberDays: 460 },
  { id: 'u22', name: 'Hannah Schmidt', level: 'C', side: 'both', gender: 'female', points: 302, karma: 87, email: 'hannah.s@example.com', marketing: true, memberDays: 310 },
  { id: 'u23', name: 'Rafael Costa', level: 'A+', side: 'left', gender: 'male', points: 588, karma: 91, email: 'rafael.c@example.com', memberDays: 610 },
  { id: 'u24', name: 'Aisha Al Maktoum', level: 'C', side: 'right', gender: 'female', points: 270, karma: 100, email: 'aisha.m@example.com', marketing: true, memberDays: 180 },
  { id: 'u25', name: 'Dmitry Sokolov', level: 'B', side: 'both', gender: 'male', points: 415, karma: 53, email: 'dmitry.s@example.com', memberDays: 390 },
  { id: 'u26', name: 'Julia Lindqvist', level: 'E', side: 'left', gender: 'female', points: 105, karma: 94, email: 'julia.l@example.com', memberDays: 75 },
  { id: 'u27', name: 'Ahmed Zayed', level: 'C', side: 'right', gender: 'male', points: 255, karma: 73, email: 'ahmed.z@example.com', memberDays: 240 },
  { id: 'u28', name: 'Olivia Brown', level: 'B', side: 'left', gender: 'female', points: 462, karma: 89, email: 'olivia.b@example.com', marketing: true, memberDays: 520 },
  { id: 'u29', name: 'Nikolai Orlov', level: 'C', side: 'both', gender: 'male', points: 290, karma: 61, email: 'nikolai.o@example.com', memberDays: 260 },
  { id: 'u30', name: 'Fatima Hassan', level: 'E', side: 'right', gender: 'female', points: 75, karma: 98, email: 'fatima.h@example.com', memberDays: 30 },
  { id: 'u31', name: 'Piotr Zielinski', level: 'B', side: 'left', gender: 'male', points: 402, karma: 77, email: 'piotr.z@example.com', memberDays: 370 },
  { id: 'u32', name: 'Grace Taylor', level: 'C Strong', side: 'both', gender: 'female', points: 315, karma: 84, email: 'grace.t@example.com', marketing: true, memberDays: 340 },
  // Restricted tier (karma 1–19)
  { id: 'u33', name: 'Igor Baranov', level: 'C', side: 'right', gender: 'male', points: 232, karma: 14, email: 'igor.b@example.com', memberDays: 290 },
  { id: 'u34', name: 'Sara Nilsen', level: 'B', side: 'left', gender: 'female', points: 388, karma: 8, email: 'sara.n@example.com', memberDays: 430 },
  // Suspended tier (karma <= 0)
  { id: 'u35', name: 'Max Kuznetsov', level: 'C', side: 'both', gender: 'male', points: 198, karma: -10, email: 'max.k@example.com', memberDays: 320 },
  // Banned
  { id: 'u36', name: 'Boris Lebedev', level: 'B', side: 'right', gender: 'male', points: 356, karma: -35, status: 'banned', email: 'boris.l@example.com', memberDays: 480 },
  // Imported shell profiles
  { id: 'u37', name: 'Khalid Mansour', level: 'C', side: 'left', gender: 'male', points: 210, karma: 100, status: 'imported', source: 'import', memberDays: 0 },
  { id: 'u38', name: 'Rita Fernandes', level: 'D', side: 'both', gender: 'female', points: 60, karma: 100, status: 'imported', source: 'import', memberDays: 0 },
  // Duplicate pair (same person, two profiles)
  { id: 'u39', name: 'Katerina Smirnova', level: 'C', side: 'right', gender: 'female', points: 248, karma: 92, email: 'kat.smirnova@example.com', memberDays: 210 },
  { id: 'u40', name: 'Kate Smirnova', level: 'C', side: 'right', gender: 'female', points: 36, karma: 100, status: 'imported', source: 'import', memberDays: 0 },
];

function mkUser(p: P): User {
  const created = iso(-(p.memberDays ?? 100));
  return {
    id: p.id, name: p.name, email: p.email,
    role: 'player',
    status: p.status ?? 'approved',
    level: p.level, preferredSide: p.side, gender: p.gender,
    whatsappOptIn: true, whatsappOptInAt: created,
    whatsappMarketingOptIn: p.marketing ?? false,
    whatsappMarketingOptInAt: p.marketing ? created : undefined,
    source: p.source ?? 'signup',
    importBatchId: p.source === 'import' ? 'imp1' : undefined,
    karmaBalance: p.karma, karmaTier: karmaTierFor(p.karma),
    points: p.points,
    memberSince: (p.memberDays ?? 0) > 0 ? dateStr(-(p.memberDays ?? 100)) : undefined,
    createdAt: created, updatedAt: iso(-1),
  };
}

const ADMIN: User = {
  id: 'admin1', name: 'Dima Organizer', email: 'admin@padelnomads.com',
  role: 'admin', status: 'approved', level: 'B', preferredSide: 'both',
  whatsappOptIn: true, whatsappMarketingOptIn: false, source: 'signup',
  karmaBalance: 100, karmaTier: 'good', points: 0,
  memberSince: dateStr(-800), createdAt: iso(-800), updatedAt: iso(-1),
};

export const seedUsers: User[] = [...P_LIST.map(mkUser), ADMIN];

// ---- phone numbers ----
export const seedPhones: PlayerPhoneNumber[] = P_LIST.map((p, i): PlayerPhoneNumber => ({
  id: `ph${i + 1}`, userId: p.id,
  phoneNumber: `+9715${(50000000 + i * 137113).toString().slice(0, 8)}`,
  label: 'mobile', isPrimary: true,
  verifiedAt: p.source === 'import' ? undefined : iso(-(p.memberDays ?? 100)),
  source: p.source === 'import' ? 'import' : 'signup',
  createdAt: iso(-(p.memberDays ?? 100)), updatedAt: iso(-(p.memberDays ?? 100)),
})).concat([
  {
    id: 'ph41', userId: 'u1', phoneNumber: '+971521234988', label: 'work',
    isPrimary: false, verifiedAt: iso(-30), source: 'signup',
    createdAt: iso(-30), updatedAt: iso(-30),
  },
]);

// ---- games (~12): 5 upcoming, 1 live, 6 past ----
interface G {
  id: string; title: string; format: GameFormat; venue: string;
  day: number; start: string; end: string; courts: number; capacity: number;
  level: Level | 'mixed'; gender?: 'male' | 'female' | 'mixed'; price?: number;
  status: GameStatus; desc?: string;
}
const G_LIST: G[] = [
  // upcoming / live — next 2 weeks
  { id: 'g6', title: 'Monday Night Fixed Pairs', format: 'fixed_pairs', venue: 'Padel Point, Al Quoz', day: 0, start: '19:00', end: '21:00', courts: 2, capacity: 8, level: 'C', price: 90, status: 'live', desc: 'Bring your partner or get matched. Fixed pairs round-robin.' },
  { id: 'g1', title: 'Tuesday Americano', format: 'americano', venue: 'Padel Point, Al Quoz', day: 1, start: '19:00', end: '21:00', courts: 3, capacity: 12, level: 'C', price: 90, status: 'upcoming', desc: 'Classic weekly Americano. Every point counts — rotating partners, all games to 16.' },
  { id: 'g13', title: 'E / D Intro Session', format: 'social_shuffle', venue: 'Real Padel Club, Al Barsha', day: 2, start: '18:00', end: '19:30', courts: 2, capacity: 8, level: 'E', price: 60, status: 'upcoming', desc: 'Gentle intro session for Entry players. Coaches on court, focus on rallies and basics.' },
  { id: 'g2', title: 'Ladies Court of Queens', format: 'court_of_queens', venue: 'Matcha Club, Al Quoz', day: 3, start: '18:30', end: '20:30', courts: 2, capacity: 8, level: 'mixed', gender: 'female', price: 100, status: 'upcoming', desc: 'Ladies-only ladder night. Win to move up a court, hold the queen court to take the crown.' },
  { id: 'g14', title: 'D+ Social Shuffle', format: 'social_shuffle', venue: 'Matcha Club, Al Quoz', day: 4, start: '19:00', end: '21:00', courts: 2, capacity: 8, level: 'D+', price: 80, status: 'upcoming', desc: 'Social night for D+ players building consistency and net awareness.' },
  { id: 'g3', title: 'B+ King of the Court', format: 'king_of_the_court', venue: 'The Padel Lab, JLT', day: 5, start: '20:00', end: '22:00', courts: 2, capacity: 8, level: 'B+', price: 110, status: 'upcoming', desc: 'High-intensity KOTC for B+ players. Winners stay on the king court.' },
  { id: 'g15', title: 'C+ Friday Americano', format: 'americano', venue: 'Padel Point, Al Quoz', day: 6, start: '19:30', end: '21:30', courts: 3, capacity: 12, level: 'C+', price: 95, status: 'upcoming', desc: 'Friday Americano for C+ — solid pace, rotating partners.' },
  { id: 'g16', title: 'C Strong Clinic', format: 'social_shuffle', venue: 'The Padel Lab, JLT', day: 7, start: '09:00', end: '10:30', courts: 2, capacity: 8, level: 'C Strong', price: 120, status: 'upcoming', desc: 'Morning clinic focused on bandeja, vibora, and transition play.' },
  { id: 'g4', title: 'Sunday Social Shuffle', format: 'social_shuffle', venue: 'Real Padel Club, Al Barsha', day: 8, start: '10:00', end: '12:00', courts: 4, capacity: 16, level: 'mixed', price: 80, status: 'upcoming', desc: 'Relaxed Sunday morning shuffle. All levels welcome, partners rotate every round.' },
  { id: 'g17', title: 'B Americano', format: 'americano', venue: 'ISD Sports City', day: 9, start: '20:00', end: '22:00', courts: 2, capacity: 8, level: 'B', price: 110, status: 'upcoming', desc: 'Fast-paced Americano for B players.' },
  { id: 'g18', title: 'A / A+ Night', format: 'king_of_the_court', venue: 'The Padel Lab, JLT', day: 11, start: '21:00', end: '23:00', courts: 2, capacity: 8, level: 'A', price: 130, status: 'upcoming', desc: 'Late session for A and A+ — structured points, full intensity.' },
  { id: 'g5', title: 'Nomads Mini-Tournament', format: 'mini_tournament', venue: 'ISD Sports City', day: 12, start: '17:00', end: '21:00', courts: 4, capacity: 16, level: 'mixed', price: 140, status: 'upcoming', desc: 'Monthly bracket tournament with group stage + knockouts. Prizes from our partners.' },
  { id: 'g19', title: 'D Midweek Fixed Pairs', format: 'fixed_pairs', venue: 'Padel Point, Al Quoz', day: 13, start: '19:00', end: '21:00', courts: 2, capacity: 8, level: 'D', price: 85, status: 'upcoming', desc: 'Fixed pairs for D level — learn positioning with a steady partner.' },
  // past
  { id: 'g7', title: 'Thursday Americano', format: 'americano', venue: 'Padel Point, Al Quoz', day: -2, start: '19:00', end: '21:00', courts: 3, capacity: 12, level: 'C', price: 90, status: 'completed' },
  { id: 'g8', title: 'King & Queen Night', format: 'king_queen_of_the_court', venue: 'Matcha Club, Al Quoz', day: -5, start: '18:00', end: '20:00', courts: 2, capacity: 8, level: 'mixed', price: 100, status: 'completed' },
  { id: 'g9', title: 'Weekend Social Shuffle', format: 'social_shuffle', venue: 'Real Padel Club, Al Barsha', day: -9, start: '10:00', end: '12:00', courts: 4, capacity: 16, level: 'mixed', price: 80, status: 'completed' },
  { id: 'g10', title: 'B Americano', format: 'americano', venue: 'The Padel Lab, JLT', day: -14, start: '20:00', end: '22:00', courts: 2, capacity: 8, level: 'B', price: 110, status: 'completed' },
  { id: 'g11', title: 'July Mini-Tournament', format: 'mini_tournament', venue: 'ISD Sports City', day: -20, start: '17:00', end: '21:00', courts: 4, capacity: 16, level: 'mixed', price: 140, status: 'completed' },
  { id: 'g12', title: 'E Entry Social', format: 'social_shuffle', venue: 'Real Padel Club, Al Barsha', day: -27, start: '09:00', end: '11:00', courts: 2, capacity: 8, level: 'E', price: 70, status: 'cancelled' },
];

export const seedGames: Game[] = G_LIST.map((g) => ({
  id: g.id, title: g.title, format: g.format, venue: g.venue,
  date: dateStr(g.day), startTime: g.start, endTime: g.end,
  courts: g.courts, capacity: g.capacity, level: g.level,
  genderRestriction: g.gender, price: g.price, description: g.desc,
  status: g.status,
  reminderSchedule: ['24h', '2h'], confirmationSchedule: '48h',
  createdBy: 'admin1', createdAt: iso(g.day - 14), updatedAt: iso(g.day - 1),
}));

// ---- participants ----
let pid = 0;
function part(gameId: string, userId: string, status: ParticipantStatus, extra: Partial<GameParticipant> = {}): GameParticipant {
  pid += 1;
  return {
    id: `gp${pid}`, gameId, userId, status,
    createdAt: iso(-10), updatedAt: iso(-1),
    ...extra,
  };
}

function pastRoster(gameId: string, userIds: string[], day: number): GameParticipant[] {
  return userIds.map((uid, i) =>
    part(gameId, uid, i === userIds.length - 1 ? 'no_show' : 'confirmed', {
      confirmedAt: iso(day - 1),
      attendance: i === userIds.length - 1 ? 'no_show' : i === userIds.length - 2 ? 'late' : 'on_time',
      paymentStatus: i === 2 ? 'unpaid' : 'paid',
      position: i === userIds.length - 1 ? undefined : i + 1,
      pointsAwarded: i === userIds.length - 1 ? 0 : Math.max(2, 20 - i * 2),
    })
  );
}

export const seedParticipants: GameParticipant[] = [
  // g1 Tuesday Americano (u1 registered, awaiting confirmation)
  part('g1', 'u1', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g1', 'u2', 'confirmed', { confirmedAt: iso(-1) }),
  part('g1', 'u4', 'confirmed', { confirmedAt: iso(-1) }),
  part('g1', 'u7', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g1', 'u9', 'confirmed', { confirmedAt: iso(-2) }),
  part('g1', 'u12', 'confirmed', { confirmedAt: iso(-1) }),
  part('g1', 'u14', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g1', 'u19', 'confirmed', { confirmedAt: iso(-1) }),
  part('g1', 'u22', 'confirmed', { confirmedAt: iso(-2) }),
  part('g1', 'u27', 'cancelled', { cancelledAt: iso(0, 9) }),
  part('g1', 'u32', 'waitlisted'),
  // g2 Ladies Court of Queens
  part('g2', 'u2', 'confirmed', { confirmedAt: iso(-1) }),
  part('g2', 'u8', 'confirmed', { confirmedAt: iso(-1) }),
  part('g2', 'u18', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g2', 'u24', 'confirmed', { confirmedAt: iso(-1) }),
  part('g2', 'u28', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g2', 'u12', 'confirmed', { confirmedAt: iso(-2) }),
  // g3 B+ KOTC (u1 confirmed)
  part('g3', 'u3', 'confirmed', { confirmedAt: iso(-1) }),
  part('g3', 'u5', 'confirmed', { confirmedAt: iso(-2) }),
  part('g3', 'u11', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g3', 'u13', 'confirmed', { confirmedAt: iso(-1) }),
  part('g3', 'u15', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g3', 'u21', 'confirmed', { confirmedAt: iso(-1) }),
  part('g3', 'u23', 'confirmed', { confirmedAt: iso(-1) }),
  // g4 Sunday Social Shuffle (u1 confirmed)
  part('g4', 'u1', 'confirmed', { confirmedAt: iso(-1) }),
  part('g4', 'u6', 'confirmed', { confirmedAt: iso(-1) }),
  part('g4', 'u10', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g4', 'u16', 'confirmed', { confirmedAt: iso(-1) }),
  part('g4', 'u20', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g4', 'u26', 'confirmed', { confirmedAt: iso(-1) }),
  part('g4', 'u30', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g4', 'u37', 'registered'),
  // g5 Mini-Tournament — plenty of space left
  part('g5', 'u2', 'confirmed', { confirmedAt: iso(-1) }),
  part('g5', 'u5', 'confirmed', { confirmedAt: iso(-1) }),
  part('g5', 'u13', 'registered', { confirmationRequestedAt: iso(-1) }),
  part('g5', 'u18', 'confirmed', { confirmedAt: iso(-1) }),
  part('g5', 'u23', 'confirmed', { confirmedAt: iso(-1) }),
  // g6 LIVE Fixed Pairs
  part('g6', 'u3', 'confirmed', { confirmedAt: iso(-1), attendance: 'on_time', paymentStatus: 'paid' }),
  part('g6', 'u8', 'confirmed', { confirmedAt: iso(-1), attendance: 'on_time', paymentStatus: 'paid' }),
  part('g6', 'u9', 'confirmed', { confirmedAt: iso(-1), attendance: 'late', paymentStatus: 'paid' }),
  part('g6', 'u17', 'confirmed', { confirmedAt: iso(-1), attendance: 'on_time', paymentStatus: 'pending' }),
  part('g6', 'u22', 'confirmed', { confirmedAt: iso(-1), attendance: 'on_time', paymentStatus: 'paid' }),
  part('g6', 'u25', 'confirmed', { confirmedAt: iso(-1), attendance: 'on_time', paymentStatus: 'pending' }),
  part('g6', 'u29', 'confirmed', { confirmedAt: iso(-1), attendance: 'on_time', paymentStatus: 'paid' }),
  part('g6', 'u31', 'confirmed', { confirmedAt: iso(-1), attendance: 'on_time', paymentStatus: 'paid' }),
  // past games
  ...pastRoster('g7', ['u1', 'u2', 'u4', 'u7', 'u9', 'u12', 'u19', 'u22', 'u27', 'u29', 'u32', 'u33'], -2),
  ...pastRoster('g8', ['u3', 'u8', 'u5', 'u18', 'u13', 'u28', 'u21', 'u34'], -5),
  ...pastRoster('g9', ['u1', 'u6', 'u10', 'u14', 'u16', 'u20', 'u24', 'u26', 'u30', 'u37', 'u39', 'u35'], -9),
  ...pastRoster('g10', ['u5', 'u11', 'u13', 'u15', 'u23', 'u25', 'u3', 'u21'], -14),
  ...pastRoster('g11', ['u1', 'u2', 'u3', 'u5', 'u8', 'u11', 'u13', 'u15', 'u18', 'u21', 'u23', 'u28', 'u31', 'u25', 'u9', 'u17'], -20),
];

// ---- applications (~8) ----
export const seedApplications: Application[] = [
  { id: 'a1', name: 'Jonas Weber', level: 'C', preferredSide: 'right', gender: 'male', referralSource: 'friend', proofOfSkillFileUrl: 'jonas_match_video.pdf', phoneNumber: '+971529001001', email: 'jonas.w@example.com', whatsappOptIn: true, whatsappMarketingOptIn: true, blacklistFlag: false, status: 'pending', createdAt: iso(-1), updatedAt: iso(-1) },
  { id: 'a2', name: 'Priya Sharma', level: 'D', preferredSide: 'both', gender: 'female', referralSource: 'instagram', phoneNumber: '+971529001002', email: 'priya.s@example.com', whatsappOptIn: true, whatsappMarketingOptIn: false, blacklistFlag: false, status: 'pending', createdAt: iso(-2), updatedAt: iso(-2) },
  { id: 'a3', name: 'Khalid Mansour', level: 'C', preferredSide: 'left', gender: 'male', referralSource: 'event', proofOfSkillFileUrl: 'khalid_ranking.png', phoneNumber: '+971555004637', email: 'khalid.m@example.com', whatsappOptIn: true, whatsappMarketingOptIn: true, matchedExistingUserId: 'u37', blacklistFlag: false, status: 'pending', createdAt: iso(-2), updatedAt: iso(-2) },
  { id: 'a4', name: 'Boris Lebedev', level: 'B', preferredSide: 'right', gender: 'male', referralSource: 'other', phoneNumber: '+971529001004', whatsappOptIn: true, whatsappMarketingOptIn: false, matchedExistingUserId: 'u36', blacklistFlag: true, status: 'pending', createdAt: iso(-3), updatedAt: iso(-3) },
  { id: 'a5', name: 'Camille Laurent', level: 'B+', preferredSide: 'left', gender: 'female', referralSource: 'search', proofOfSkillFileUrl: 'camille_wpt_profile.pdf', phoneNumber: '+971529001005', email: 'camille.l@example.com', whatsappOptIn: true, whatsappMarketingOptIn: true, blacklistFlag: false, status: 'pending', createdAt: iso(-4), updatedAt: iso(-4) },
  { id: 'a6', name: 'Andrei Popescu', level: 'C', preferredSide: 'both', gender: 'male', referralSource: 'facebook', phoneNumber: '+971529001006', whatsappOptIn: true, whatsappMarketingOptIn: false, blacklistFlag: false, status: 'pending', createdAt: iso(-5), updatedAt: iso(-5) },
  { id: 'a7', name: 'Mia Johnson', level: 'E', preferredSide: 'right', gender: 'female', referralSource: 'friend', phoneNumber: '+971529001007', email: 'mia.j@example.com', whatsappOptIn: true, whatsappMarketingOptIn: true, blacklistFlag: false, status: 'approved', reviewedBy: 'admin1', reviewedAt: iso(-6), createdAt: iso(-8), updatedAt: iso(-6) },
  { id: 'a8', name: 'Stefan Horvat', level: 'C', preferredSide: 'left', gender: 'male', referralSource: 'instagram', phoneNumber: '+971529001008', whatsappOptIn: false, whatsappMarketingOptIn: false, blacklistFlag: false, status: 'rejected', reviewedBy: 'admin1', reviewedAt: iso(-7), createdAt: iso(-10), updatedAt: iso(-7) },
];

// ---- offers (~6) ----
export const seedOffers: Offer[] = [
  { id: 'o1', title: '20% off court bookings', partnerName: 'Padel Point', description: 'Members get 20% off all off-peak court bookings at Padel Point Al Quoz. Book through the app or at reception with your promo code.', promoCode: 'NOMADS20', link: 'https://example.com/padelpoint', startDate: dateStr(-10), endDate: dateStr(30), status: 'active', createdAt: iso(-10), updatedAt: iso(-10) },
  { id: 'o2', title: 'Free protein shake with any smoothie', partnerName: 'Matcha Club Café', description: 'Show your Padel Nomads membership after any game at Matcha Club and get a free protein shake with any smoothie order.', startDate: dateStr(-20), endDate: dateStr(20), status: 'active', createdAt: iso(-20), updatedAt: iso(-20) },
  { id: 'o3', title: '15% off Bullpadel rackets', partnerName: 'Padel Gear UAE', description: 'Exclusive discount on the full Bullpadel range, including the Vertex and Hack series. Online and in-store.', promoCode: 'PN-BULL15', link: 'https://example.com/padelgear', startDate: dateStr(-5), endDate: dateStr(45), status: 'active', createdAt: iso(-5), updatedAt: iso(-5) },
  { id: 'o4', title: 'Physio assessment for AED 99', partnerName: 'MoveWell Clinic', description: 'Full-body movement and injury-risk assessment for members, normally AED 350. Perfect if you play 3+ times a week.', promoCode: 'NOMADSPHYSIO', startDate: dateStr(-3), endDate: dateStr(60), status: 'active', createdAt: iso(-3), updatedAt: iso(-3) },
  { id: 'o5', title: 'Summer camp early-bird', partnerName: 'The Padel Lab', description: 'Early-bird pricing on the junior summer camp for members\' kids.', link: 'https://example.com/padellab', startDate: dateStr(-60), endDate: dateStr(-10), status: 'inactive', createdAt: iso(-60), updatedAt: iso(-10) },
  { id: 'o6', title: '2-for-1 padel socks', partnerName: 'Padel Gear UAE', description: 'Buy one pair of grip socks, get one free.', promoCode: 'PNSOCKS', startDate: dateStr(-90), endDate: dateStr(-30), status: 'inactive', createdAt: iso(-90), updatedAt: iso(-30) },
];

// ---- notifications (u1 = demo player) ----
export const seedNotifications: AppNotification[] = [
  { id: 'n1', userId: 'u1', title: 'Confirm your spot', message: 'Please confirm your participation in Tuesday Americano.', type: 'confirmation_request', channel: 'whatsapp', isRead: false, relatedOutboundMessageId: 'om3', createdAt: iso(-1, 18) },
  { id: 'n2', userId: 'u1', title: 'Result published', message: 'Results for Thursday Americano are out — you finished 1st and earned 20 points!', type: 'result_published', channel: 'in_app', isRead: false, createdAt: iso(-2, 22) },
  { id: 'n3', userId: 'u1', title: 'New offer added', message: '15% off Bullpadel rackets at Padel Gear UAE.', type: 'offer_added', channel: 'whatsapp', isRead: false, createdAt: iso(-5, 12) },
  { id: 'n4', userId: 'u1', title: 'Added to game', message: 'You were added to Sunday Social Shuffle at Real Padel Club.', type: 'added_to_game', channel: 'whatsapp', isRead: true, createdAt: iso(-6, 15) },
  { id: 'n5', userId: 'u1', title: 'Game updated', message: 'B+ King of the Court moved to 20:00 (was 19:30).', type: 'game_updated', channel: 'in_app', isRead: true, createdAt: iso(-7, 10) },
  { id: 'n6', userId: 'u1', title: 'Game cancelled', message: 'E Entry Social on ' + dateStr(-27) + ' was cancelled due to court maintenance.', type: 'game_cancelled', channel: 'whatsapp', isRead: true, createdAt: iso(-27, 9) },
  { id: 'n7', userId: 'u1', title: 'Result published', message: 'Results for July Mini-Tournament are out — you finished 1st!', type: 'result_published', channel: 'in_app', isRead: true, createdAt: iso(-20, 22) },
  { id: 'n8', userId: 'u1', title: 'Application approved', message: 'Welcome to Padel Nomads! Your application has been approved.', type: 'application_approved', channel: 'whatsapp', isRead: true, createdAt: iso(-410, 11) },
  { id: 'n9', userId: 'u1', title: 'Removed from game', message: 'You were removed from Weekend Warm-up at your request.', type: 'removed_from_game', channel: 'in_app', isRead: true, createdAt: iso(-40, 13) },
];

// ---- karma events ----
let kid = 0;
function karma(userId: string, eventType: KarmaEventType, points: number, balanceAfter: number, day: number, extra: Partial<KarmaEvent> = {}): KarmaEvent {
  kid += 1;
  return {
    id: `k${kid}`, userId, eventType, points,
    source: extra.performedBy ? 'admin' : 'system',
    balanceAfter, tierAfter: karmaTierFor(balanceAfter),
    createdAt: iso(day), ...extra,
  };
}

export const seedKarmaEvents: KarmaEvent[] = [
  // u1: 100 -> 88
  karma('u1', 'late_cancellation', -15, 85, -35, { gameId: 'g10', note: 'Cancelled 18h before B Americano' }),
  karma('u1', 'on_time_game', 2, 87, -20, { gameId: 'g11' }),
  karma('u1', 'conduct_award', 3, 90, -12, { performedBy: 'admin1', reasonCode: 'helped_organize', note: 'Helped set up courts at short notice' }),
  karma('u1', 'late_arrival', -5, 85, -9, { gameId: 'g9' }),
  karma('u1', 'on_time_game', 2, 87, -9, { gameId: 'g9' }),
  karma('u1', 'on_time_game', 2, 88, -2, { gameId: 'g7' }),
  // u33 (restricted, 14)
  karma('u33', 'no_show', -30, 70, -50, { gameId: 'g11' }),
  karma('u33', 'late_cancellation', -15, 55, -32, { note: 'Cancelled 10h before game' }),
  karma('u33', 'very_late_cancellation', -25, 30, -18 ),
  karma('u33', 'non_payment', -20, 10, -6, { gameId: 'g7' }),
  karma('u33', 'on_time_game', 2, 12, -2, { gameId: 'g7' }),
  karma('u33', 'conduct_award', 2, 14, -1, { performedBy: 'admin1', reasonCode: 'fair_play' }),
  // u34 (restricted, 8)
  karma('u34', 'no_show', -30, 70, -40),
  karma('u34', 'no_show', -30, 40, -25),
  karma('u34', 'late_cancellation', -15, 25, -12),
  karma('u34', 'misconduct_minor', -10, 15, -8, { performedBy: 'admin1', reasonCode: 'arguing', note: 'Repeated arguing with opponents' }),
  karma('u34', 'late_arrival', -5, 10, -5, { gameId: 'g8' }),
  karma('u34', 'on_time_game', 2, 8, -5, { gameId: 'g8' }),
  // u35 (suspended, -10)
  karma('u35', 'no_show', -30, 70, -45),
  karma('u35', 'non_payment', -20, 50, -30, { gameId: 'g11' }),
  karma('u35', 'no_show', -30, 20, -15),
  karma('u35', 'misconduct_major', -30, -10, -9, { performedBy: 'admin1', reasonCode: 'aggression', note: 'Aggressive behavior towards opponent, game g9' }),
  // u36 (banned)
  karma('u36', 'misconduct_major', -30, 55, -60, { performedBy: 'admin1', reasonCode: 'aggression' }),
  karma('u36', 'no_show', -30, 25, -50),
  karma('u36', 'no_show', -30, -5, -45),
  karma('u36', 'misconduct_major', -30, -35, -42, { performedBy: 'admin1', reasonCode: 'unsafe_behavior' }),
  // u17 (warning, 38)
  karma('u17', 'late_cancellation', -15, 85, -30),
  karma('u17', 'no_show', -30, 55, -18),
  karma('u17', 'late_cancellation', -15, 40, -10),
  karma('u17', 'on_time_game', 2, 42, -5),
  karma('u17', 'non_payment', -20, 22, -3, { gameId: 'g7' }),
  karma('u17', 'non_payment_reversal', 20, 42, -1, { compensatesEventId: 'k30' }),
  karma('u17', 'late_arrival', -5, 38, 0, { gameId: 'g6' }),
];

// ---- WhatsApp stub data ----
export const seedTemplates: MessageTemplate[] = [
  { id: 't1', metaTemplateName: 'game_reminder_v2', category: 'utility', language: 'en', bodyText: 'Hi {{1}}, reminder: {{2}} on {{3}} at {{4}}, {{5}}. See you on court!', variables: ['name', 'game', 'date', 'time', 'venue'], buttons: ['View game'], approvalStatus: 'approved', createdAt: iso(-90), updatedAt: iso(-90) },
  { id: 't2', metaTemplateName: 'participation_confirmation', category: 'utility', language: 'en', bodyText: 'You are registered for {{1}} on {{2}}. Will you play?', variables: ['game', 'date'], buttons: ['Confirm', 'Cannot play'], approvalStatus: 'approved', createdAt: iso(-90), updatedAt: iso(-90) },
  { id: 't3', metaTemplateName: 'application_approved', category: 'utility', language: 'en', bodyText: 'Welcome to Padel Nomads, {{1}}! Your application has been approved. Log in to see upcoming games.', variables: ['name'], buttons: ['Open app'], approvalStatus: 'approved', createdAt: iso(-120), updatedAt: iso(-120) },
  { id: 't4', metaTemplateName: 'partner_offer_july', category: 'marketing', language: 'en', bodyText: '{{1}}, our partner {{2}} has a new offer for Nomads: {{3}}. Use code {{4}}.', variables: ['name', 'partner', 'offer', 'code'], buttons: ['Copy code', 'View offer'], approvalStatus: 'approved', createdAt: iso(-30), updatedAt: iso(-30) },
  { id: 't5', metaTemplateName: 'weekly_schedule', category: 'utility', language: 'en', bodyText: 'This week at Padel Nomads: {{1}}', variables: ['schedule'], approvalStatus: 'pending', createdAt: iso(-2), updatedAt: iso(-2) },
  { id: 't6', metaTemplateName: 'summer_promo_blast', category: 'marketing', language: 'en', bodyText: 'Summer deal: {{1}}', variables: ['deal'], approvalStatus: 'rejected', rejectionReason: 'Body text too generic for marketing category; add clear opt-out wording.', createdAt: iso(-15), updatedAt: iso(-12) },
  { id: 't7', metaTemplateName: 'login_otp', category: 'authentication', language: 'en', bodyText: 'Your Padel Nomads verification code is {{1}}.', variables: ['code'], approvalStatus: 'approved', createdAt: iso(-120), updatedAt: iso(-120) },
];

let omid = 0;
function om(userId: string, templateId: string, status: OutboundMessage['status'], day: number, payload: string, extra: Partial<OutboundMessage> = {}): OutboundMessage {
  omid += 1;
  return {
    id: `om${omid}`, waMessageId: `wamid.${1000 + omid}`, userId,
    phoneNumberUsed: seedPhones.find((p) => p.userId === userId && p.isPrimary)?.phoneNumber ?? '+971500000000',
    templateId, type: 'template', payload, status,
    sentAt: status === 'queued' ? undefined : iso(day),
    createdAt: iso(day), updatedAt: iso(day), ...extra,
  };
}

export const seedOutbound: OutboundMessage[] = [
  om('u2', 't1', 'read', -1, 'Hi Maria, reminder: Tuesday Americano tomorrow at 19:00, Padel Point.'),
  om('u4', 't1', 'delivered', -1, 'Hi Sofia, reminder: Tuesday Americano tomorrow at 19:00, Padel Point.'),
  om('u1', 't2', 'read', -1, 'You are registered for Tuesday Americano. Will you play?'),
  om('u7', 't2', 'delivered', -1, 'You are registered for Tuesday Americano. Will you play?'),
  om('u14', 't2', 'sent', -1, 'You are registered for Tuesday Americano. Will you play?'),
  om('u9', 't1', 'read', -1, 'Hi Lucas, reminder: Tuesday Americano tomorrow at 19:00, Padel Point.'),
  om('u12', 't1', 'read', -1, 'Hi Chloe, reminder: Tuesday Americano tomorrow at 19:00, Padel Point.'),
  om('u19', 't1', 'failed', -1, 'Hi Carlos, reminder: Tuesday Americano tomorrow at 19:00, Padel Point.', { errorCode: '131026', errorDetail: 'Message undeliverable: recipient may have changed number' }),
  om('u22', 't4', 'read', -3, 'Hannah, our partner Padel Gear UAE has a new offer: 15% off Bullpadel rackets. Use code PN-BULL15.', { campaignId: 'c-offer-o3' }),
  om('u2', 't4', 'delivered', -3, 'Maria, our partner Padel Gear UAE has a new offer: 15% off Bullpadel rackets. Use code PN-BULL15.', { campaignId: 'c-offer-o3' }),
  om('u8', 't4', 'dropped', -3, 'Emma, our partner Padel Gear UAE has a new offer: 15% off Bullpadel rackets. Use code PN-BULL15.', { campaignId: 'c-offer-o3', errorCode: '131049', errorDetail: 'Dropped by Meta: per-user marketing frequency cap' }),
  om('u24', 't4', 'read', -3, 'Aisha, our partner Padel Gear UAE has a new offer: 15% off Bullpadel rackets. Use code PN-BULL15.', { campaignId: 'c-offer-o3' }),
  om('u6', 't1', 'read', -2, 'Hi Laura, reminder: Sunday Social Shuffle on Sunday at 10:00, Real Padel Club.'),
  om('u30', 't2', 'queued', 0, 'You are registered for Sunday Social Shuffle. Will you play?'),
  om('u18', 't3', 'read', -6, 'Welcome to Padel Nomads, Mia! Your application has been approved.'),
];

export const seedInbound: InboundMessage[] = [
  { id: 'im1', waMessageId: 'wamid.in1', fromPhone: seedPhones.find((p) => p.userId === 'u2')!.phoneNumber, userId: 'u2', type: 'button_reply', body: 'Confirm', buttonPayload: 'confirm:g1', handled: true, handledBy: 'system', handledAt: iso(-1), receivedAt: iso(-1), createdAt: iso(-1) },
  { id: 'im2', waMessageId: 'wamid.in2', fromPhone: seedPhones.find((p) => p.userId === 'u27')!.phoneNumber, userId: 'u27', type: 'button_reply', body: 'Cannot play', buttonPayload: 'decline:g1', handled: true, handledBy: 'system', handledAt: iso(0, 9), receivedAt: iso(0, 9), createdAt: iso(0, 9) },
  { id: 'im3', waMessageId: 'wamid.in3', fromPhone: seedPhones.find((p) => p.userId === 'u7')!.phoneNumber, userId: 'u7', type: 'text', body: 'Can I bring a friend on Tuesday? He is C level.', handled: false, receivedAt: iso(0, 10), createdAt: iso(0, 10) },
  { id: 'im4', waMessageId: 'wamid.in4', fromPhone: '+971528887766', type: 'text', body: 'Hi, how do I join Padel Nomads?', handled: false, receivedAt: iso(0, 11), createdAt: iso(0, 11) },
  { id: 'im5', waMessageId: 'wamid.in5', fromPhone: seedPhones.find((p) => p.userId === 'u15')!.phoneNumber, userId: 'u15', type: 'text', body: 'STOP', handled: true, handledBy: 'system', handledAt: iso(-4), receivedAt: iso(-4), createdAt: iso(-4) },
];

// ---- player-management stub data ----
export const seedImportBatches: ImportBatch[] = [
  { id: 'imp1', sourceType: 'google_sheet', fileName: 'nomads_master_roster_2026.xlsx', status: 'committed', createdBy: 'admin1', createdAt: iso(-45), committedAt: iso(-45) },
  { id: 'imp2', sourceType: 'whatsapp_export', fileName: 'wa_group_contacts_jun.csv', status: 'rolled_back', createdBy: 'admin1', createdAt: iso(-30), committedAt: iso(-30) },
];

export const seedImportRecords: ImportRecord[] = [
  { id: 'ir1', importBatchId: 'imp1', rowNumber: 1, rawData: 'Khalid Mansour, +971555004637, C', resolvedUserId: 'u37', action: 'created', createdAt: iso(-45) },
  { id: 'ir2', importBatchId: 'imp1', rowNumber: 2, rawData: 'Rita Fernandes, +971555004774, E', resolvedUserId: 'u38', action: 'created', createdAt: iso(-45) },
  { id: 'ir3', importBatchId: 'imp1', rowNumber: 3, rawData: 'Kate Smirnova, +971555004911, C', resolvedUserId: 'u40', action: 'created', createdAt: iso(-45) },
  { id: 'ir4', importBatchId: 'imp1', rowNumber: 4, rawData: 'Maria Petrova, +971550137113, B', resolvedUserId: 'u2', action: 'skipped', errorDetail: 'Exact phone match with existing profile', createdAt: iso(-45) },
  { id: 'ir5', importBatchId: 'imp1', rowNumber: 5, rawData: 'John ???, 05x-invalid', action: 'error', errorDetail: 'Phone not parseable to E.164', createdAt: iso(-45) },
];

export interface DuplicateCandidate {
  id: string; userIdA: string; userIdB: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string; dismissed: boolean; merged: boolean;
}
export const seedDuplicates: DuplicateCandidate[] = [
  { id: 'dup1', userIdA: 'u39', userIdB: 'u40', confidence: 'high', reason: 'Same normalized name + same level; different phone numbers', dismissed: false, merged: false },
  { id: 'dup2', userIdA: 'u21', userIdB: 'u11', confidence: 'low', reason: 'Similar name strings (Viktor Petrov / Pavel Novak — flagged by fuzzy match run #12)', dismissed: false, merged: false },
];

export const seedBanRecords: BanRecord[] = [
  { id: 'br1', userId: 'u36', phoneNumbers: [seedPhones.find((p) => p.userId === 'u36')!.phoneNumber], email: 'boris.l@example.com', action: 'ban', reasonCode: 'conduct', note: 'Repeated aggressive behavior after two formal warnings.', performedBy: 'admin1', createdAt: iso(-40) },
  { id: 'br2', phoneNumbers: ['+971529990000'], action: 'blacklist_number', reasonCode: 'other', note: 'Known troublemaker from the WhatsApp group, never signed up.', performedBy: 'admin1', createdAt: iso(-60) },
];

export const seedRatingAdjustments: RatingAdjustment[] = [
  { id: 'ra1', userId: 'u11', adjustmentType: 'delta', pointsBefore: 450, pointsAfter: 470, reasonCode: 'retroactive_result', note: 'Missing points from May tournament, court 2 sheet lost.', performedBy: 'admin1', createdAt: iso(-25) },
  { id: 'ra2', userId: 'u37', adjustmentType: 'absolute', pointsBefore: 0, pointsAfter: 210, reasonCode: 'migration_fix', note: 'Carried-over rating from Google Sheets master roster.', performedBy: 'admin1', createdAt: iso(-45) },
];

export const seedActivityLogs: ActivityLog[] = [
  { id: 'al1', userId: 'u1', eventType: 'application', relatedEntityType: 'application', relatedEntityId: 'a-old-1', summary: 'Application submitted and approved', createdAt: iso(-410) },
  { id: 'al2', userId: 'u1', eventType: 'registration', relatedEntityType: 'game', relatedEntityId: 'g11', summary: 'Registered for July Mini-Tournament', createdAt: iso(-24) },
  { id: 'al3', userId: 'u1', eventType: 'result', relatedEntityType: 'game', relatedEntityId: 'g11', summary: 'Finished 1st, +20 points', createdAt: iso(-20) },
  { id: 'al4', userId: 'u1', eventType: 'attendance', relatedEntityType: 'game', relatedEntityId: 'g9', summary: 'Marked late at Weekend Social Shuffle', createdAt: iso(-9) },
  { id: 'al5', userId: 'u1', eventType: 'confirmation', relatedEntityType: 'game', relatedEntityId: 'g7', summary: 'Confirmed participation via WhatsApp button', createdAt: iso(-4) },
  { id: 'al6', userId: 'u1', eventType: 'result', relatedEntityType: 'game', relatedEntityId: 'g7', summary: 'Finished 1st, +20 points', createdAt: iso(-2) },
  { id: 'al7', userId: 'u36', eventType: 'ban', relatedEntityType: 'ban_record', relatedEntityId: 'br1', summary: 'Banned: repeated aggressive behavior', createdAt: iso(-40) },
  { id: 'al8', userId: 'u37', eventType: 'admin_action', relatedEntityType: 'import_batch', relatedEntityId: 'imp1', summary: 'Profile created from Google Sheets import', createdAt: iso(-45) },
];

export const seedMergeLogs: PlayerMergeLog[] = [
  { id: 'ml1', survivorUserId: 'u2', absorbedUserId: 'u2-old', movedData: '2 phone numbers, 14 game participations, 380 points, 22 activity entries', performedBy: 'admin1', performedAt: iso(-70) },
];
