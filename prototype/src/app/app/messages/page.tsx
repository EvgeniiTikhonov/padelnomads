'use client';

import Link from 'next/link';
import { MessageCircle, MessagesSquare, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/player-avatar';
import { useMockData } from '@/data/provider';
import { buildInbox } from '@/lib/chat';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function MessagesInboxPage() {
  const {
    games, participants, chatMessages, directMessages, chatReads, users, currentUser,
  } = useMockData();

  const conversations = buildInbox(currentUser.id, {
    games,
    participants,
    chatMessages,
    directMessages,
    chatReads,
    users,
    isAdmin: currentUser.role === 'admin',
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Game chats and direct messages with other Nomads.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <MessagesSquare className="size-8 text-muted-foreground" />
          <p className="font-medium">No conversations yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Join a game to open its chat, or message a player from their profile.
          </p>
        </div>
      ) : (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="divide-y p-0">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className={cn(
                  'flex items-start gap-3 p-4 transition-colors hover:bg-muted/50',
                  c.unread > 0 && 'bg-primary/[0.03]',
                )}
              >
                {c.kind === 'dm' && c.otherUser ? (
                  <PlayerAvatar user={c.otherUser} className="size-10" fallbackClassName="text-xs" />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {c.kind === 'game' ? <Users className="size-4" /> : <MessageCircle className="size-4" />}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn('truncate text-sm', c.unread > 0 && 'font-semibold')}>
                      {c.title}
                    </span>
                    {c.unread > 0 && (
                      <Badge className="h-5 shrink-0 px-1.5 text-[10px]">{c.unread}</Badge>
                    )}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{c.subtitle}</span>
                  <span className={cn('mt-0.5 line-clamp-1 block text-sm', c.unread > 0 ? 'text-foreground/90' : 'text-muted-foreground')}>
                    {c.lastBody}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground/70">
                  {timeAgo(c.lastAt)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
