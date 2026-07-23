'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, UserPlus, UserMinus, RefreshCw, Ban, Tag, Trophy, Bell,
  MessageCircle, CheckCheck, Users, Sparkles, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMockData } from '@/data/provider';
import { timeAgo } from '@/lib/format';
import { notificationHref, notificationIsActionable } from '@/lib/notifications';
import type { AppNotification } from '@/types';

const TYPE_ICONS: Record<string, React.ElementType> = {
  application_approved: CheckCircle2,
  application_rejected: XCircle,
  added_to_game: UserPlus,
  removed_from_game: UserMinus,
  game_updated: RefreshCw,
  game_cancelled: Ban,
  offer_added: Tag,
  result_published: Trophy,
  confirmation_request: MessageCircle,
  partner_invite: Users,
  partner_join_request: Users,
  partner_accepted: CheckCircle2,
  partner_declined: XCircle,
  waitlist_offer: Sparkles,
  waitlist_promoted: CheckCircle2,
  late_cancellation: Ban,
  replacement_taken: RefreshCw,
  level_verified: CheckCircle2,
};

function NotificationRow({
  n,
  onOpen,
}: {
  n: AppNotification;
  onOpen: (n: AppNotification) => void;
}) {
  const Icon = TYPE_ICONS[n.type] ?? Bell;
  const href = notificationHref(n);
  const actionable = notificationIsActionable(n);

  return (
    <Link
      href={href}
      onClick={() => onOpen(n)}
      className={cn(
        'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50',
        !n.isRead && 'bg-primary/[0.03]',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
          n.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</span>
          {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className="block text-sm text-muted-foreground">{n.message}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/70">
          {timeAgo(n.createdAt)}
          {n.channel === 'whatsapp' && (
            <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px]">
              <MessageCircle className="size-2.5" /> WhatsApp
            </Badge>
          )}
          {actionable && (
            <span className="text-primary/80">
              {n.relatedOfferId || n.type === 'offer_added'
                ? 'View offer'
                : n.relatedGameId
                  ? 'View game'
                  : 'Open'}
            </span>
          )}
        </span>
      </span>
      {actionable && <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" />}
    </Link>
  );
}

export default function NotificationsPage() {
  const { notifications, currentUser, markNotificationRead, markAllNotificationsRead } = useMockData();
  const mine = notifications
    .filter((n) => n.userId === currentUser.id && n.audience !== 'admin')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : 'All caught up'} · Tap a notification to open the game or offer.
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllNotificationsRead(currentUser.id)}>
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {mine.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <Bell className="size-8 text-muted-foreground" />
          <p className="font-medium">No notifications</p>
        </div>
      ) : (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="divide-y p-0">
            {mine.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                onOpen={(item) => {
                  if (!item.isRead) markNotificationRead(item.id);
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
