'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Official Padel Nomads brand mark.
 * Transparent PNGs live in /public/brand (black + white variants).
 */
export function Logo({
  className,
  markClassName,
  showWordmark = false,
  tone = 'light',
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  /** `light` = white mark for dark backgrounds; `dark` = black mark for light backgrounds */
  tone?: 'light' | 'dark';
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <Image
        src={tone === 'light' ? '/brand/logo-white.png' : '/brand/logo.png'}
        alt="Padel Nomads"
        width={285}
        height={152}
        priority
        className={cn('h-7 w-auto object-contain', markClassName)}
      />
      {showWordmark && (
        <span
          className={cn(
            'font-heading text-lg font-semibold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-foreground',
          )}
        >
          Padel Nomads
        </span>
      )}
    </span>
  );
}
