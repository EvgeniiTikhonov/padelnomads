'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell, CheckCheck, ChevronRight, Inbox, UserMinus, AlertTriangle, RefreshCw, LifeBuoy,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMockData } from '@/data/provider';
import { playerWhatsAppUrl, SUPPORT_CATEGORY_LABELS, timeAgo } from '@/lib/format';
import { adminNotificationHref, notificationIsActionable } from '@/lib/notifications';
import type { AppNotification } from '@/types';

const TYPE_ICONS: Record<string, React.ElementType> = {
  admin_new_application: Inbox,
  admin_player_cancelled: UserMinus,
  admin_late_cancellation: AlertTriangle,
  admin_replacement_needed: AlertTriangle,
  admin_replacement_offered: RefreshCw,
  admin_support_request: LifeBuoy,
};

function actionLabel(n: AppNotification): string {
  if (n.relatedApplicationId) return 'Review application';
  if (n.type === 'admin_replacement_needed' || n.type === 'admin_late_cancellation') return 'Open game';
  if (n.type === 'admin_support_request') return 'Contact player';
  if (n.relatedGameId) return 'View game';
  return 'Open';
}

export default function AdminNotificationsPage() {
  const {
    notifications, supportRequests, users, currentUser,
    markNotificationRead, markAllNotificationsRead,
  } = useMockData();
  const mine = notifications
    .filter((n) => n.userId === currentUser.id && n.audience === 'admin')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} need attention` : 'All caught up'} · Only important events that need your action.
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
          <p className="font-medium">No attention items</p>
          <p className="text-sm text-muted-foreground">
            New applications, cancellations, and support requests will show up here.
          </p>
        </div>
      ) : (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="divide-y p-0">
            {mine.map((n) => {
              const Icon = TYPE_ICONS[n.type] ?? Bell;
              const href = adminNotificationHref(n);
              const actionable = notificationIsActionable(n);
              const support = n.relatedSupportRequestId
                ? supportRequests.find((r) => r.id === n.relatedSupportRequestId)
                : undefined;
              const supportUser = support
                ? users.find((u) => u.id === support.userId)
                : undefined;
              const waHref = support
                ? playerWhatsAppUrl(
                  support.contactPhone,
                  `Hi ${supportUser?.name?.split(' ')[0] ?? 'there'}, this is Padel Nomads support regarding your ${SUPPORT_CATEGORY_LABELS[support.category].toLowerCase()} request.`,
                )
                : null;

              const rowClass = cn(
                'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50',
                !n.isRead && 'bg-primary/[0.03]',
              );

              const body = (
                <>
                  <span
                    className={cn(
                      'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                      !n.isRead ? 'bg-amber-500/15 text-amber-300' : 'bg-muted text-muted-foreground',
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
                      {actionable && !waHref && <span className="text-primary/80">{actionLabel(n)}</span>}
                    </span>
                    {waHref && (
                      <span className="mt-2 inline-flex">
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            'inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!n.isRead) markNotificationRead(n.id);
                          }}
                        >
                          <MessageCircle className="size-3.5" />
                          WhatsApp {support?.contactPhone}
                        </a>
                      </span>
                    )}
                  </span>
                  {actionable && !waHref && <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" />}
                </>
              );

              if (waHref) {
                return (
                  <div
                    key={n.id}
                    className={rowClass}
                    onClick={() => { if (!n.isRead) markNotificationRead(n.id); }}
                  >
                    {body}
                  </div>
                );
              }

              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => { if (!n.isRead) markNotificationRead(n.id); }}
                  className={rowClass}
                >
                  {body}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
