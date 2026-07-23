'use client';

import {
  Crown, HeartHandshake, RefreshCw, Shuffle, Trophy, Users,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FORMAT_ACCENT, FORMAT_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { GameFormat } from '@/types';

/** One distinct icon per game format for quick visual scanning. */
export const FORMAT_ICONS: Record<GameFormat, LucideIcon> = {
  king_of_the_court: Crown,
  king_queen_of_the_court: HeartHandshake,
  fixed_pairs: Users,
  team_mexicano: RefreshCw,
  social_shuffle: Shuffle,
  mini_tournament: Trophy,
};

export function FormatIcon({
  format,
  className,
}: {
  format: GameFormat;
  className?: string;
}) {
  const Icon = FORMAT_ICONS[format];
  return <Icon className={cn('size-3.5 shrink-0', className)} aria-hidden />;
}

/** Icon + label inline (detail headers, list subtitles). */
export function FormatLabel({
  format,
  className,
  iconClassName,
}: {
  format: GameFormat;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <FormatIcon format={format} className={iconClassName} />
      <span>{FORMAT_LABELS[format]}</span>
    </span>
  );
}

/** Colored badge with format icon. */
export function FormatBadge({
  format,
  className,
}: {
  format: GameFormat;
  className?: string;
}) {
  return (
    <Badge className={cn('gap-1 border-none', FORMAT_ACCENT[format], className)}>
      <FormatIcon format={format} className="size-3" />
      {FORMAT_LABELS[format]}
    </Badge>
  );
}
