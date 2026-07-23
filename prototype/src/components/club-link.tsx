'use client';

import Link from 'next/link';
import { useMockData } from '@/data/provider';
import { cn } from '@/lib/utils';

/** Clickable club name → player club detail. Falls back to plain text if unknown. */
export function ClubLink({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { clubs } = useMockData();
  const club = clubs.find((c) => c.name === name && c.status === 'active')
    ?? clubs.find((c) => c.name === name);

  if (!club) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link
      href={`/app/clubs/${club.id}`}
      className={cn(
        'font-medium text-foreground underline decoration-white/25 underline-offset-2 transition-colors hover:decoration-primary hover:text-primary',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {name}
    </Link>
  );
}
