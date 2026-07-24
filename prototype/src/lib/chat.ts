import type {
  DirectMessage, Game, GameChatMessage, GameParticipant, User,
} from '@/types';

/** Statuses that may read + post in a game chat (they need to align on participation). */
const ACTIVE_CHAT_STATUSES: GameParticipant['status'][] = [
  'registered', 'confirmed', 'waitlisted', 'pending_replacement',
];

export const CHAT_MESSAGE_MAX_LENGTH = 500;

export function gameChatReadKey(gameId: string, userId: string): string {
  return `game:${gameId}:${userId}`;
}

/** Stable id for a DM thread between two users (order-independent). */
export function dmThreadId(userA: string, userB: string): string {
  return [userA, userB].sort().join('_');
}

export function dmChatReadKey(threadId: string, userId: string): string {
  return `dm:${threadId}:${userId}`;
}

/** @deprecated Prefer gameChatReadKey — kept for any leftover callers. */
export function chatReadKey(gameId: string, userId: string): string {
  return gameChatReadKey(gameId, userId);
}

/** Non-cancelled participant of the game (chat access). */
export function canChatInGame(
  participants: GameParticipant[],
  gameId: string,
  userId: string,
): boolean {
  return participants.some(
    (p) => p.gameId === gameId && p.userId === userId && ACTIVE_CHAT_STATUSES.includes(p.status),
  );
}

/** Messages from others posted after the user's last-read marker. */
export function unreadGameChatCount(
  messages: GameChatMessage[],
  reads: Record<string, string>,
  gameId: string,
  userId: string,
): number {
  const lastRead = reads[gameChatReadKey(gameId, userId)] ?? '';
  return messages.filter(
    (m) => m.gameId === gameId && m.userId !== userId && m.createdAt > lastRead,
  ).length;
}

/** Alias used by game cards. */
export const unreadChatCount = unreadGameChatCount;

export function unreadDmCount(
  messages: DirectMessage[],
  reads: Record<string, string>,
  otherUserId: string,
  userId: string,
): number {
  const threadId = dmThreadId(userId, otherUserId);
  const lastRead = reads[dmChatReadKey(threadId, userId)] ?? '';
  return messages.filter(
    (m) =>
      m.fromUserId === otherUserId
      && m.toUserId === userId
      && m.createdAt > lastRead,
  ).length;
}

export function dmMessagesForThread(
  messages: DirectMessage[],
  userA: string,
  userB: string,
): DirectMessage[] {
  return messages
    .filter(
      (m) =>
        (m.fromUserId === userA && m.toUserId === userB)
        || (m.fromUserId === userB && m.toUserId === userA),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export type InboxConversation =
  | {
      kind: 'game';
      id: string;
      gameId: string;
      title: string;
      subtitle: string;
      lastBody: string;
      lastAt: string;
      unread: number;
      href: string;
    }
  | {
      kind: 'dm';
      id: string;
      otherUserId: string;
      title: string;
      subtitle: string;
      lastBody: string;
      lastAt: string;
      unread: number;
      href: string;
      otherUser?: User;
    };

/** Build inbox rows: game chats the user can access + DM threads they're in. */
export function buildInbox(
  userId: string,
  opts: {
    games: Game[];
    participants: GameParticipant[];
    chatMessages: GameChatMessage[];
    directMessages: DirectMessage[];
    chatReads: Record<string, string>;
    users: User[];
    isAdmin?: boolean;
  },
): InboxConversation[] {
  const {
    games, participants, chatMessages, directMessages, chatReads, users, isAdmin,
  } = opts;
  const rows: InboxConversation[] = [];

  for (const game of games.filter((g) => !g.deleted)) {
    const allowed = isAdmin || canChatInGame(participants, game.id, userId);
    if (!allowed) continue;
    const msgs = chatMessages
      .filter((m) => m.gameId === game.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    // Upcoming/live: always list so players can open an empty chat.
    // Past/cancelled: only if there is history.
    if (msgs.length === 0 && game.status !== 'upcoming' && game.status !== 'live') continue;
    const last = msgs[msgs.length - 1];
    rows.push({
      kind: 'game',
      id: `game:${game.id}`,
      gameId: game.id,
      title: game.title,
      subtitle: 'Game chat',
      lastBody: last?.body ?? 'No messages yet — say hi to your fellow players.',
      lastAt: last?.createdAt ?? game.updatedAt,
      unread: unreadGameChatCount(chatMessages, chatReads, game.id, userId),
      href: `/app/messages/game/${game.id}`,
    });
  }

  const peerIds = new Set<string>();
  for (const m of directMessages) {
    if (m.fromUserId === userId) peerIds.add(m.toUserId);
    if (m.toUserId === userId) peerIds.add(m.fromUserId);
  }
  for (const otherId of peerIds) {
    const other = users.find((u) => u.id === otherId);
    const thread = dmMessagesForThread(directMessages, userId, otherId);
    const last = thread[thread.length - 1];
    if (!last) continue;
    rows.push({
      kind: 'dm',
      id: `dm:${dmThreadId(userId, otherId)}`,
      otherUserId: otherId,
      title: other?.name ?? 'Player',
      subtitle: 'Direct message',
      lastBody: last.body,
      lastAt: last.createdAt,
      unread: unreadDmCount(directMessages, chatReads, otherId, userId),
      href: `/app/messages/u/${otherId}`,
      otherUser: other,
    });
  }

  return rows.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export function totalUnreadMessages(
  userId: string,
  opts: {
    games: Game[];
    participants: GameParticipant[];
    chatMessages: GameChatMessage[];
    directMessages: DirectMessage[];
    chatReads: Record<string, string>;
    users: User[];
    isAdmin?: boolean;
  },
): number {
  return buildInbox(userId, opts).reduce((sum, row) => sum + row.unread, 0);
}
