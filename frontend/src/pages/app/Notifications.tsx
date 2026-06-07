import { useAuth } from '@/lib/auth';
import { actions, useStore } from '@/lib/store';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { relativeFromNow } from '@/lib/format';

export default function Notifications() {
  const { user } = useAuth();
  const notifications = useStore((s) =>
    s.notifications
      .filter((n) => n.userId === user!.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Updates about your games, applications, and offers."
        action={
          hasUnread ? (
            <button
              onClick={() => actions.markAllNotificationsRead(user!.id)}
              className="btn-secondary !py-3 !text-xs"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" message="You're all caught up." />
      ) : (
        <Card className="divide-y divide-brand-black/10">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => actions.markNotificationRead(n.id)}
              className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-black/[0.02]"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  n.isRead ? 'bg-brand-black/15' : 'bg-brand-black'
                }`}
              />
              <span className="flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-heading text-sm font-semibold text-brand-black">
                    {n.title}
                  </span>
                  <span className="shrink-0 font-body text-xs text-brand-black/40">
                    {relativeFromNow(n.createdAt)}
                  </span>
                </span>
                <span className="mt-1 block font-body text-sm text-brand-black/65">{n.message}</span>
              </span>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
