import { cn } from '@/lib/utils';

// Brand logo files (logos/1-01.png … 1-04.png) were not found in the project;
// this typographic mark stands in until assets are dropped into /public/brand.
export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5 font-heading select-none', className)}>
      <span className="flex size-7 shrink-0 translate-y-1 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" />
          <circle cx="15" cy="9" r="1.2" fill="currentColor" />
          <circle cx="9" cy="15" r="1.2" fill="currentColor" />
          <circle cx="15" cy="15" r="1.2" fill="currentColor" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        </svg>
      </span>
      <span className={cn('text-lg font-bold tracking-tight', dark ? 'text-white' : 'text-foreground')}>
        Padel <span className="text-primary">Nomads</span>
      </span>
    </span>
  );
}
