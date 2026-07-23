import type { AppNotification } from '@/types';

type Related = {
  gameId?: string;
  offerId?: string;
  applicationId?: string;
};

/** Deep link for a player notification. */
export function notificationHref(n: AppNotification): string {
  if (n.audience === 'admin') return adminNotificationHref(n);
  if (n.relatedGameId) return `/app/games/${n.relatedGameId}`;
  if (n.relatedOfferId) return `/app/offers?offer=${n.relatedOfferId}`;
  if (n.type === 'offer_added') return '/app/offers';
  if (n.type === 'application_approved' || n.type === 'level_verified') return '/app/profile';
  return '/app/notifications';
}

/** Deep link for an admin attention notification. */
export function adminNotificationHref(n: AppNotification): string {
  if (n.relatedApplicationId) return `/admin/applications?application=${n.relatedApplicationId}`;
  if (n.relatedGameId) return `/admin/games/${n.relatedGameId}`;
  return '/admin/notifications';
}

export function notificationIsActionable(n: AppNotification): boolean {
  if (n.audience === 'admin') {
    return Boolean(n.relatedApplicationId || n.relatedGameId);
  }
  return Boolean(
    n.relatedGameId
    || n.relatedOfferId
    || n.type === 'offer_added'
    || n.type === 'application_approved'
    || n.type === 'level_verified',
  );
}

export function relatedFromNotification(n: AppNotification): Related {
  return {
    gameId: n.relatedGameId,
    offerId: n.relatedOfferId,
    applicationId: n.relatedApplicationId,
  };
}
