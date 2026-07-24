'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/player-avatar';
import { ChatThread } from '@/components/chat-thread';
import { VerifiedBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { dmMessagesForThread } from '@/lib/chat';
import { LEVEL_LABELS } from '@/lib/format';

export default function DirectMessagePage() {
  const { userId: otherId } = useParams<{ userId: string }>();
  const router = useRouter();
  const {
    users, directMessages, currentUser, sendDirectMessage, markDirectChatRead,
  } = useMockData();

  const other = users.find((u) => u.id === otherId && u.role === 'player' && u.status !== 'banned');
  if (!other) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">Player not found</p>
        <Button variant="outline" onClick={() => router.push('/app/messages')}>Back to messages</Button>
      </div>
    );
  }

  if (other.id === currentUser.id) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">That&apos;s you</p>
        <Button variant="outline" onClick={() => router.push('/app/messages')}>Back to messages</Button>
      </div>
    );
  }

  const thread = dmMessagesForThread(directMessages, currentUser.id, other.id);
  const bubbles = thread.map((m) => ({
    id: m.id,
    userId: m.fromUserId,
    body: m.body,
    createdAt: m.createdAt,
  }));

  return (
    <div className="space-y-4">
      <Link href="/app/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Messages
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/app/players/${other.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90">
          <PlayerAvatar user={other} className="size-12" fallbackClassName="text-sm" />
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold">{other.name}</h1>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="gap-1">
                {LEVEL_LABELS[other.level]}
                {other.levelVerified && <VerifiedBadge className="size-3.5" />}
              </Badge>
              <span className="text-xs text-muted-foreground">Direct message</span>
            </div>
          </div>
        </Link>
        <Button variant="outline" size="sm" render={<Link href={`/app/players/${other.id}`} />}>
          Profile
        </Button>
      </div>

      <ChatThread
        messages={bubbles}
        users={users}
        currentUserId={currentUser.id}
        canPost
        placeholder={`Message ${other.name.split(' ')[0]}…`}
        emptyLabel={`Say hi to ${other.name.split(' ')[0]} — plan a game or ask about partnering up.`}
        showAuthorName={false}
        onSend={(body) => sendDirectMessage(other.id, body)}
        onMarkRead={() => markDirectChatRead(other.id)}
      />
    </div>
  );
}
