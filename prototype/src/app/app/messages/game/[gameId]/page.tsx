'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatThread } from '@/components/chat-thread';
import { ClubLink } from '@/components/club-link';
import { FormatLabel } from '@/components/format-icon';
import { useMockData } from '@/data/provider';
import { canChatInGame } from '@/lib/chat';
import { formatDate, LEVEL_LABELS } from '@/lib/format';

export default function GameChatPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const {
    games, participants, chatMessages, users, currentUser,
    sendGameChatMessage, markGameChatRead,
  } = useMockData();

  const game = games.find((g) => g.id === gameId && !g.deleted);
  if (!game) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">Game not found</p>
        <Button variant="outline" onClick={() => router.push('/app/messages')}>Back to messages</Button>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const isParticipant = canChatInGame(participants, game.id, currentUser.id);
  if (!isParticipant && !isAdmin) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">Chat unavailable</p>
        <p className="text-sm text-muted-foreground">Only players in this game can open the chat.</p>
        <Button variant="outline" render={<Link href={`/app/games/${game.id}`} />}>View game</Button>
      </div>
    );
  }

  const messages = chatMessages
    .filter((m) => m.gameId === game.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const closed = game.status === 'completed' || game.status === 'cancelled';

  return (
    <div className="space-y-4">
      <Link href="/app/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Messages
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold">{game.title}</h1>
          <p className="text-sm text-muted-foreground">
            <FormatLabel format={game.format} className="text-sm" /> · Game chat
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" /> {formatDate(game.date)} · {game.startTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> <ClubLink name={game.venue} className="text-xs" />
            </span>
            <Badge variant="secondary">{LEVEL_LABELS[game.level]}</Badge>
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href={`/app/games/${game.id}`} />}>
          Game details
        </Button>
      </div>

      <ChatThread
        messages={messages}
        users={users}
        currentUserId={currentUser.id}
        canPost={(isParticipant || isAdmin) && !closed}
        placeholder="Message players in this game…"
        emptyLabel="No messages yet — coordinate warm-ups, delays, or replacements here."
        readOnlyLabel={`This game is ${game.status} — the chat is read-only.`}
        onSend={(body) => sendGameChatMessage(game.id, body)}
        onMarkRead={() => markGameChatRead(game.id)}
      />
    </div>
  );
}
