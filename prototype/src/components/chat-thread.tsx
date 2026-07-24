'use client';

import * as React from 'react';
import { SendHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/player-avatar';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/lib/chat';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export type ThreadBubble = {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
};

/** Shared bubble list + composer for game chat and DMs. */
export function ChatThread({
  messages,
  users,
  currentUserId,
  canPost,
  placeholder,
  emptyLabel,
  readOnlyLabel,
  showAuthorName = true,
  onSend,
  onMarkRead,
}: {
  messages: ThreadBubble[];
  users: User[];
  currentUserId: string;
  canPost: boolean;
  placeholder: string;
  emptyLabel: string;
  readOnlyLabel?: string;
  showAuthorName?: boolean;
  onSend: (body: string) => void;
  onMarkRead: () => void;
}) {
  const [draft, setDraft] = React.useState('');
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    onMarkRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const send = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col rounded-2xl border border-white/10 bg-card">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        {messages.map((m) => {
          const author = users.find((u) => u.id === m.userId);
          const own = m.userId === currentUserId;
          return (
            <div key={m.id} className={cn('flex items-end gap-2', own && 'flex-row-reverse')}>
              {!own && author && (
                <PlayerAvatar user={author} className="size-7" fallbackClassName="text-[10px]" />
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2',
                  own ? 'rounded-br-sm bg-primary/15' : 'rounded-bl-sm bg-muted',
                )}
              >
                {!own && showAuthorName && (
                  <p className="text-[11px] font-semibold text-primary">
                    {author?.name ?? 'Player'}
                    {author?.role === 'admin' && (
                      <span className="text-muted-foreground"> · organizer</span>
                    )}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground/70">
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 p-3">
        {canPost ? (
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2"
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
              className="h-11 flex-1"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              <SendHorizontal className="size-4" />
            </Button>
          </form>
        ) : (
          <p className="py-2 text-center text-xs text-muted-foreground">
            {readOnlyLabel ?? 'This conversation is read-only.'}
          </p>
        )}
      </div>
    </div>
  );
}
