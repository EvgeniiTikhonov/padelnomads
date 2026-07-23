'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

/** Player avatar with photo when available, initials fallback otherwise. */
export function PlayerAvatar({
  user,
  className,
  fallbackClassName,
}: {
  user: Pick<User, 'name'> & { avatarUrl?: string };
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {user.avatarUrl ? (
        <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover object-top" />
      ) : null}
      <AvatarFallback className={cn('bg-primary/10 font-semibold text-primary', fallbackClassName)}>
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
