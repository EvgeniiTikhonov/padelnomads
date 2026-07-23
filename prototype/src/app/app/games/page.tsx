'use client';

import * as React from 'react';
import { CalendarX, Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { GameCard } from '@/components/game-card';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { useMockData } from '@/data/provider';
import { visibleGames } from '@/lib/derive';
import { timeSlotOf } from '@/lib/eligibility';
import { LEVELS, LEVEL_LABELS, GENDER_RESTRICTION_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Level } from '@/types';

type DateRange = 'today' | 'tomorrow' | '3days' | 'week' | 'all';
type LevelFilter = 'all' | Level | 'mixed';
type GenderFilter = 'all' | 'male' | 'female' | 'mixed' | 'mixed_pairs';
type TimeFilter = 'all' | 'morning' | 'afternoon' | 'evening';

type Filters = {
  dateRange: DateRange;
  level: LevelFilter;
  gender: GenderFilter;
  location: string;
  time: TimeFilter;
};

const DEFAULT_FILTERS: Filters = {
  dateRange: 'week',
  level: 'all',
  gender: 'all',
  location: 'all',
  time: 'all',
};

type AvailableFilters = {
  levels: Array<Level | 'mixed'>;
  genders: Array<'mixed' | 'mixed_pairs' | 'male' | 'female'>;
  times: Array<'morning' | 'afternoon' | 'evening'>;
  venues: string[];
  dateRanges: { key: DateRange; label: string }[];
};

function sanitizeFilters(f: Filters, available: AvailableFilters): Filters {
  const dateRange = available.dateRanges.some((d) => d.key === f.dateRange)
    ? f.dateRange
    : (available.dateRanges.find((d) => d.key === 'week')?.key
      ?? available.dateRanges[0]?.key
      ?? 'all');
  return {
    dateRange,
    level: f.level === 'all' || available.levels.includes(f.level) ? f.level : 'all',
    gender: f.gender === 'all' || available.genders.includes(f.gender) ? f.gender : 'all',
    location: f.location === 'all' || available.venues.includes(f.location) ? f.location : 'all',
    time: f.time === 'all' || available.times.includes(f.time) ? f.time : 'all',
  };
}

const DATE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: '3days', label: '3 days' },
  { key: 'week', label: '1 week' },
  { key: 'all', label: 'All' },
];

function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function inDateRange(gameDate: string, range: DateRange): boolean {
  const today = localISODate();
  const tomorrow = localISODate(addDays(new Date(), 1));
  if (range === 'all') return true;
  if (range === 'today') return gameDate === today;
  if (range === 'tomorrow') return gameDate === tomorrow;
  if (range === '3days') {
    const end = localISODate(addDays(new Date(), 2));
    return gameDate >= today && gameDate <= end;
  }
  // 1 week
  const end = localISODate(addDays(new Date(), 6));
  return gameDate >= today && gameDate <= end;
}

function FilterOption({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 py-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-white/25',
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

function FilterSection({
  title,
  summary,
  children,
}: {
  title: string;
  /** Current selection shown when collapsed. */
  summary?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="border-t border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-3.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          {!open && summary && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className="divide-y divide-white/5 pb-2">{children}</div>}
    </section>
  );
}

export default function GamesPage() {
  const { games } = useMockData();

  const horizon = React.useMemo(
    () => visibleGames(games)
      .filter((g) => g.status === 'upcoming' || g.status === 'live')
      .filter((g) => g.date >= localISODate())
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    [games],
  );

  // Facet options = only values that exist on currently available games.
  const available = React.useMemo((): AvailableFilters => {
    const levelSet = new Set<Level | 'mixed'>();
    const genderSet = new Set<'male' | 'female' | 'mixed' | 'mixed_pairs'>();
    const timeSet = new Set<'morning' | 'afternoon' | 'evening'>();
    const venueSet = new Set<string>();
    for (const g of horizon) {
      levelSet.add(g.level);
      genderSet.add(g.genderRestriction ?? 'mixed');
      timeSet.add(timeSlotOf(g.startTime));
      venueSet.add(g.venue);
    }
    const levelOrder: Array<Level | 'mixed'> = ['mixed', ...LEVELS];
    const genderOrder: Array<'mixed' | 'mixed_pairs' | 'male' | 'female'> = ['mixed', 'mixed_pairs', 'male', 'female'];
    const timeOrder: Array<'morning' | 'afternoon' | 'evening'> = ['morning', 'afternoon', 'evening'];
    return {
      levels: levelOrder.filter((l) => levelSet.has(l)),
      genders: genderOrder.filter((g) => genderSet.has(g)),
      times: timeOrder.filter((t) => timeSet.has(t)),
      venues: [...venueSet].sort((a, b) => a.localeCompare(b)),
      dateRanges: DATE_OPTIONS.filter(
        (opt) => opt.key === 'all' || horizon.some((g) => inDateRange(g.date, opt.key)),
      ),
    };
  }, [horizon]);

  const [filters, setFilters] = React.useState<Filters>(() => sanitizeFilters(DEFAULT_FILTERS, {
    levels: [],
    genders: [],
    times: [],
    venues: [],
    dateRanges: DATE_OPTIONS,
  }));
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Filters>(filters);

  // Drop selections that no longer exist among available games.
  const availableSig = `${available.levels.join(',')}|${available.genders.join(',')}|${available.times.join(',')}|${available.venues.join(',')}|${available.dateRanges.map((d) => d.key).join(',')}`;
  const [syncedSig, setSyncedSig] = React.useState(availableSig);
  if (syncedSig !== availableSig) {
    setSyncedSig(availableSig);
    setFilters((f) => sanitizeFilters(f, available));
    setDraft((d) => sanitizeFilters(d, available));
  }

  const filtered = React.useMemo(() => {
    return horizon.filter((g) => {
      if (!inDateRange(g.date, filters.dateRange)) return false;
      if (filters.level !== 'all' && g.level !== filters.level) return false;
      if (filters.gender !== 'all') {
        const restriction = g.genderRestriction ?? 'mixed';
        if (restriction !== filters.gender) return false;
      }
      if (filters.location !== 'all' && g.venue !== filters.location) return false;
      if (filters.time !== 'all' && timeSlotOf(g.startTime) !== filters.time) return false;
      return true;
    });
  }, [horizon, filters]);

  const activeFilterCount = [
    filters.level !== 'all',
    filters.gender !== 'all',
    filters.location !== 'all',
    filters.time !== 'all',
  ].filter(Boolean).length;

  const openSheet = () => {
    setDraft(filters);
    setSheetOpen(true);
  };

  const clearDraft = () => {
    setDraft({ ...DEFAULT_FILTERS, dateRange: draft.dateRange });
  };

  const applyDraft = () => {
    setFilters(draft);
    setSheetOpen(false);
  };

  const chipClass = (active: boolean) => cn(
    'h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors',
    active
      ? 'border-primary bg-primary/15 text-foreground'
      : 'border-white/15 text-muted-foreground hover:border-white/35 hover:text-foreground',
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Games</h1>
        <p className="text-sm text-muted-foreground">
          Open games that fit your search.
        </p>
      </div>

      {/* Compact filter bar — Playtomic-style */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openSheet}
          aria-label="More filters"
          className={cn(
            'relative flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors',
            activeFilterCount > 0
              ? 'border-primary bg-primary/15 text-foreground'
              : 'border-white/15 text-muted-foreground hover:border-white/35 hover:text-foreground',
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {available.dateRanges.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, dateRange: opt.key }))}
              className={chipClass(filters.dateRange === opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter summary chips (from More filters) */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.level !== 'all' && (
            <button
              type="button"
              onClick={openSheet}
              className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium"
            >
              {filters.level === 'mixed' ? 'Mixed level' : LEVEL_LABELS[filters.level]}
            </button>
          )}
          {filters.gender !== 'all' && (
            <button
              type="button"
              onClick={openSheet}
              className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium"
            >
              {GENDER_RESTRICTION_LABELS[filters.gender]}
            </button>
          )}
          {filters.location !== 'all' && (
            <button
              type="button"
              onClick={openSheet}
              className="max-w-[10rem] truncate rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium"
            >
              {filters.location}
            </button>
          )}
          {filters.time !== 'all' && (
            <button
              type="button"
              onClick={openSheet}
              className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium capitalize"
            >
              {filters.time}
            </button>
          )}
        </div>
      )}

      <div>
        <h2 className="font-heading text-base font-semibold">
          {filters.dateRange === 'today' && 'Today'}
          {filters.dateRange === 'tomorrow' && 'Tomorrow'}
          {filters.dateRange === '3days' && 'Next 3 days'}
          {filters.dateRange === 'week' && 'This week'}
          {filters.dateRange === 'all' && 'All upcoming'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {filtered.length} game{filtered.length === 1 ? '' : 's'}
          {activeFilterCount > 0 ? ' matching your filters' : ''}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <CalendarX className="size-8 text-muted-foreground" />
          <p className="font-medium">No games found</p>
          <p className="text-sm text-muted-foreground">
            Try another date range or clear filters.
          </p>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, dateRange: f.dateRange }))}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              href={`/app/games/${g.id}`}
              showActions
              showEligibility
            />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-t-2xl border-white/10 p-0 sm:mx-auto sm:max-w-lg"
        >
          <SheetHeader className="flex-row items-start justify-between space-y-0 border-b border-white/10 p-4">
            <div>
              <SheetTitle className="font-heading text-xl font-bold">More filters</SheetTitle>
              <SheetDescription className="sr-only">
                Filter games by level, gender, location, and time of day.
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={clearDraft}
              className="text-sm font-medium text-primary hover:underline"
            >
              Clear all
            </button>
          </SheetHeader>

          <div key={sheetOpen ? 'filters-open' : 'filters-closed'} className="max-h-[min(60vh,28rem)] space-y-1 overflow-y-auto px-4 pb-2">
            <FilterSection
              title="Level"
              summary={
                draft.level === 'all'
                  ? 'All levels'
                  : draft.level === 'mixed'
                    ? 'Mixed'
                    : LEVEL_LABELS[draft.level]
              }
            >
              <FilterOption
                label="All levels"
                description="Show every level."
                selected={draft.level === 'all'}
                onSelect={() => setDraft((d) => ({ ...d, level: 'all' }))}
              />
              {available.levels.map((l) => (
                <FilterOption
                  key={l}
                  label={l === 'mixed' ? 'Mixed' : LEVEL_LABELS[l]}
                  description={l === 'mixed' ? 'Open to all levels.' : undefined}
                  selected={draft.level === l}
                  onSelect={() => setDraft((d) => ({ ...d, level: l }))}
                />
              ))}
            </FilterSection>

            <FilterSection
              title="Play with"
              summary={
                draft.gender === 'all'
                  ? 'All'
                  : GENDER_RESTRICTION_LABELS[draft.gender]
              }
            >
              <FilterOption
                label="All"
                description="Show all gender formats."
                selected={draft.gender === 'all'}
                onSelect={() => setDraft((d) => ({ ...d, gender: 'all' }))}
              />
              {available.genders.map((g) => (
                <FilterOption
                  key={g}
                  label={GENDER_RESTRICTION_LABELS[g]}
                  description={
                    g === 'male'
                      ? 'Men-only match.'
                      : g === 'female'
                        ? 'Women-only match.'
                        : g === 'mixed_pairs'
                          ? 'Man + woman teams only.'
                          : 'Open mixed games.'
                  }
                  selected={draft.gender === g}
                  onSelect={() => setDraft((d) => ({ ...d, gender: g }))}
                />
              ))}
            </FilterSection>

            <FilterSection
              title="Location"
              summary={draft.location === 'all' ? 'All locations' : draft.location}
            >
              <FilterOption
                label="All locations"
                selected={draft.location === 'all'}
                onSelect={() => setDraft((d) => ({ ...d, location: 'all' }))}
              />
              {available.venues.map((v) => (
                <FilterOption
                  key={v}
                  label={v}
                  selected={draft.location === v}
                  onSelect={() => setDraft((d) => ({ ...d, location: v }))}
                />
              ))}
            </FilterSection>

            <FilterSection
              title="Time of day"
              summary={
                draft.time === 'all'
                  ? 'Any time'
                  : draft.time.charAt(0).toUpperCase() + draft.time.slice(1)
              }
            >
              <FilterOption
                label="Any time"
                selected={draft.time === 'all'}
                onSelect={() => setDraft((d) => ({ ...d, time: 'all' }))}
              />
              {available.times.map((t) => (
                <FilterOption
                  key={t}
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                  description={
                    t === 'morning'
                      ? 'Before 12:00.'
                      : t === 'afternoon'
                        ? '12:00 – 17:00.'
                        : 'From 17:00.'
                  }
                  selected={draft.time === t}
                  onSelect={() => setDraft((d) => ({ ...d, time: t }))}
                />
              ))}
            </FilterSection>
          </div>

          <SheetFooter className="mt-0 border-t border-white/10 p-4">
            <Button className="h-11 w-full text-base" onClick={applyDraft}>
              Apply filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
