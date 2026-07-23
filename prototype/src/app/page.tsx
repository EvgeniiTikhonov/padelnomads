'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ExternalLink, LogIn, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useMockData } from '@/data/provider';
import { spotsTaken, upcomingGamesNextTwoWeeks, maxFixedTeams } from '@/lib/derive';
import { LEVELS, LEVEL_LABELS, isFixedTeamFormat } from '@/lib/format';
import type { Game, GameFormat, Level } from '@/types';

/* Brand tokens from the landing design system */
const LIME = 'bg-[#c6e03a] text-[#0d0d0d] hover:bg-[#d4ec5a]';
const DOTS: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

const PHOTOS = {
  hero: '/brand/landing/hero.jpg',
  founder: '/brand/landing/founder.jpg',
  values: '/brand/landing/values.jpg',
  eventA: '/brand/landing/eventA.jpg',
  eventB: '/brand/landing/eventB.jpg',
  eventC: '/brand/landing/eventC.jpg',
  m1: '/brand/landing/player-coello.jpg',
  m2: '/brand/landing/player-tapia.jpg',
  m3: '/brand/landing/player-bela.jpg',
};

const IG_FEED = Array.from({ length: 15 }, (_, i) => `/brand/instagram/ig${String(i + 1).padStart(2, '0')}.jpg`);
const IG_URL = 'https://www.instagram.com/padel_nomads/';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function InstagramCarousel() {
  const track = [...IG_FEED, ...IG_FEED];
  return (
    <section id="instagram" className="scroll-mt-28 border-t border-white/5 py-20 sm:py-28">
      <div className="mx-auto mb-10 max-w-6xl px-4 text-center">
        <Eyebrow>Instagram</Eyebrow>
        <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Life at Padel Nomads
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/45">
          Games, vibes, and the crew — fresh from{' '}
          <a href={IG_URL} target="_blank" rel="noreferrer" className="text-white underline decoration-white/25 underline-offset-4 hover:text-primary">
            @padel_nomads
          </a>
        </p>
        <a
          href={IG_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/10"
        >
          <InstagramIcon className="size-4" />
          Follow on Instagram
          <ExternalLink className="size-3.5 text-white/40" />
        </a>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0d0d0d] to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0d0d0d] to-transparent sm:w-28" />

        <div className="pn-marquee flex gap-3 px-3 sm:gap-4 sm:px-4">
          {track.map((src, i) => (
            <a
              key={`${src}-${i}`}
              href={IG_URL}
              target="_blank"
              rel="noreferrer"
              className="group relative block w-[220px] shrink-0 overflow-hidden rounded-2xl sm:w-[260px]"
              aria-label="Open @padel_nomads on Instagram"
            >
              <div className="relative aspect-square overflow-hidden bg-white/5">
                <Image
                  src={src}
                  alt={`Padel Nomads Instagram highlight ${(i % IG_FEED.length) + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="260px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 text-xs text-white">
                  <InstagramIcon className="size-3.5 shrink-0" />
                  <span className="font-medium">@padel_nomads</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium tracking-[0.28em] text-white/40 uppercase">
      {children}
    </p>
  );
}

function AvatarDot({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const hue = (name.charCodeAt(0) * 47) % 360;
  if (src) {
    return (
      <span className={cn('relative inline-block size-8 overflow-hidden rounded-full border-2 border-[#0d0d0d]', className)}>
        <Image src={src} alt={name} fill className="object-cover object-top" sizes="40px" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'flex size-8 items-center justify-center rounded-full border-2 border-[#0d0d0d] text-[10px] font-bold text-white',
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 40% 40%), hsl(${(hue + 60) % 360} 35% 25%))`,
      }}
    >
      {name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </span>
  );
}

function BubbleAvatar({
  src,
  className,
  delay = 0,
}: {
  src: string;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn('pn-float absolute z-10', className)}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative size-14 overflow-hidden rounded-full border-[3px] border-[#3b82f6] shadow-lg sm:size-16">
        <Image src={src} alt="" fill className="object-cover object-top" sizes="64px" />
      </div>
      <span className="absolute -bottom-1 left-1/2 size-3 -translate-x-1/2 rotate-45 border-r-[3px] border-b-[3px] border-[#3b82f6] bg-[#0d0d0d]" />
    </div>
  );
}

const NAV = [
  { href: '#about', id: 'about', label: 'About' },
  { href: '#values', id: 'values', label: 'Values' },
  { href: '#community', id: 'community', label: 'Community' },
  { href: '#events', id: 'events', label: 'Events' },
  { href: '#apply', id: 'apply', label: 'How to apply' },
  { href: '#perks', id: 'perks', label: 'Perks' },
];

const VALUES = [
  {
    num: 'I',
    title: 'Play Better',
    text: 'Quality games, balanced levels, and the right challenge every time you step on court.',
  },
  {
    num: 'II',
    title: 'Grow Together',
    text: 'We support, challenge, and motivate each other to progress as players and as a community.',
  },
  {
    num: 'III',
    title: 'Feel the Passion',
    text: 'We are united by our love for padel — the energy, the emotions, and the desire to keep playing.',
  },
  {
    num: 'IV',
    title: 'Connect Beyond',
    text: 'We build friendships, meaningful connections, and a network that continues beyond the match.',
  },
  {
    num: 'V',
    title: 'Vibe Up',
    text: 'Bring your best energy, lift the people around you, and make every game feel fun, friendly, and alive.',
  },
];

const MEMBERS = [
  {
    name: 'Hilmi Abdelhadi',
    flag: '🇵🇸',
    level: 'C+',
    role: 'Partnerships lead @ Tencent',
    bio: 'Setting up partnerships by day, padel monster by night, Hilmi brings vibes and soul to Padel Nomads for over 10 years now.',
    src: PHOTOS.m1,
  },
  {
    name: 'Pelayo Valverde',
    flag: '',
    level: 'A',
    role: 'Padel Coach',
    bio: 'With 15+ years of padel experience, Pelayo coaches a padel clinic on Saturdays, taking the team’s level higher and higher up.',
    src: PHOTOS.m2,
  },
  {
    name: 'Alex',
    flag: '🇻🇦',
    level: 'C+',
    role: 'Partnerships lead @ Tencent',
    bio: 'A seasoned consultant, Alex got into padel years ago and brings experience and professionalism to Padel Nomads.',
    src: PHOTOS.m3,
  },
];

const STEPS = [
  {
    num: 'I',
    title: 'Become a Nomad',
    text: 'We’ll ask you a couple of questions about you and your Padel level. Takes a couple of minutes.',
  },
  {
    num: 'II',
    title: 'We review your profile',
    text: 'We’ll assess your level and experience, and let you know of the outcome. Takes up to 7 days.',
  },
  {
    num: 'III',
    title: 'Join your first game',
    text: 'Pick the right time, date and level, to start assimilating in the community.',
  },
];

const PARTNERS = [
  { name: 'Wilson', className: 'font-serif text-2xl font-bold italic text-[#e31c23]' },
  { name: 'ZIINA', className: 'text-xl font-extrabold tracking-[0.2em] text-white' },
  { name: 'PADEL SOJO', className: 'text-lg font-black tracking-tight text-[#4da3ff]' },
  { name: 'CENTRAL PADEL', className: 'text-xs font-bold tracking-[0.22em] text-white/75' },
];

type EventFilter = 'all' | 'king' | 'social' | 'competition' | 'clinic';
const EVENT_FILTERS: { key: EventFilter; label: string; icon?: string }[] = [
  { key: 'all', label: 'All formats' },
  { key: 'king', label: 'King of the court', icon: '👑' },
  { key: 'social', label: 'Social', icon: '👥' },
  { key: 'competition', label: 'Competition', icon: '🏆' },
  { key: 'clinic', label: 'Clinic', icon: '🎾' },
];

type LevelFilter = 'all' | Level | 'mixed';
const LEVEL_FILTERS: { key: LevelFilter; label: string }[] = [
  { key: 'all', label: 'All levels' },
  { key: 'mixed', label: 'Mixed' },
  ...LEVELS.map((l) => ({ key: l as LevelFilter, label: l })),
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
function categoryOf(format: GameFormat): EventFilter {
  if (
    format === 'king_of_the_court' ||
    format === 'king_queen_of_the_court'
  ) {
    return 'king';
  }
  if (format === 'mini_tournament') return 'competition';
  return 'social';
}

function startsInLabel(game: Game): string {
  const start = new Date(`${game.date}T${game.startTime}:00`);
  const diffH = Math.round((start.getTime() - Date.now()) / 3_600_000);
  if (diffH <= 0) return 'Starting now';
  if (diffH < 24) return `Starts in ${diffH}h`;
  return `Starts in ${Math.round(diffH / 24)}d`;
}

function eventPhoto(game: Game, index: number): string {
  if (game.status === 'completed') return PHOTOS.eventA;
  if (game.status === 'live') return PHOTOS.eventB;
  return [PHOTOS.eventC, PHOTOS.eventA, PHOTOS.eventB][index % 3];
}

function eventTint(game: Game): string {
  if (game.status === 'completed') return 'from-neutral-900/85 via-neutral-900/55 to-transparent';
  if (game.status === 'live') return 'from-[#0a1a3a]/90 via-[#0a1a3a]/55 to-transparent';
  return 'from-[#1a2a0a]/90 via-[#1a2a0a]/50 to-transparent';
}

function EventCard({ game, index }: { game: Game; index: number }) {
  const { participants, users, externalPartnerInvites } = useMockData();
  const taken = spotsTaken(participants, game.id, externalPartnerInvites, game.format);
  const spotsLeft = Math.max(0, game.capacity - taken);
  const fixed = isFixedTeamFormat(game.format);
  const teamsLeft = fixed ? Math.max(0, maxFixedTeams(game.capacity) - taken / 2) : 0;
  const roster = participants.filter(
    (p) => p.gameId === game.id && (p.status === 'confirmed' || p.status === 'registered'),
  );
  const names = roster
    .map((p) => users.find((u) => u.id === p.userId)?.name.split(' ')[0])
    .filter(Boolean) as string[];

  const finished = game.status === 'completed';
  const live = game.status === 'live';

  return (
    <article
      className={cn(
        'group relative grid min-h-[280px] overflow-hidden rounded-[28px] sm:min-h-[320px] sm:grid-cols-[1.15fr_0.85fr]',
        finished && 'opacity-70',
      )}
    >
      <div className="absolute inset-0">
        <Image
          src={eventPhoto(game, index)}
          alt=""
          fill
          className={cn(
            'object-cover transition-transform duration-700 group-hover:scale-[1.03]',
            finished && 'grayscale',
          )}
          sizes="(max-width: 768px) 100vw, 800px"
        />
        <div className={cn('absolute inset-0 bg-gradient-to-r', eventTint(game))} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 sm:bg-gradient-to-r sm:from-black/70 sm:via-black/25 sm:to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {live && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> Live
              </span>
            )}
            {finished && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
                <Clock className="size-3" /> Game finished
              </span>
            )}
            {!live && !finished && (
              <>
                <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-[#c6e03a] backdrop-blur-sm">
                  {fixed
                    ? (teamsLeft > 0 ? `${teamsLeft} team${teamsLeft === 1 ? '' : 's'} available` : 'Full — waitlist open')
                    : (spotsLeft > 0 ? `${spotsLeft} spots available` : 'Full — waitlist open')}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
                  <Clock className="size-3" /> {startsInLabel(game)}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Share"
            className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white/60 backdrop-blur-sm transition-colors hover:text-white"
          >
            <Share2 className="size-4" />
          </button>
        </div>

        <div className="mt-12 sm:mt-16">
          <h3 className="font-heading text-2xl leading-[1.15] font-semibold tracking-tight text-white sm:text-[1.85rem]">
            {game.title}
            <br />
            {game.startTime}–{game.endTime}
            <br />
            <span className="text-white/75">{game.venue.split(',')[0]}</span>
          </h3>

          {!finished && (
            <ul className="mt-4 space-y-1.5 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <span aria-hidden>✅</span> Level {LEVEL_LABELS[game.level]}
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>🎾</span> New balls for each court
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>🏆</span> Medals and prizes for winners
              </li>
            </ul>
          )}

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {!finished && (
                <Link
                  href="/apply"
                  className={cn(
                    'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                    LIME,
                  )}
                >
                  Book {game.price ?? 120} AED
                </Link>
              )}
              <Link
                href="/login"
                className="rounded-full border border-white/20 bg-black/35 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/55"
              >
                Learn more
              </Link>
            </div>
            {names.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {names.slice(0, 3).map((n) => (
                    <AvatarDot key={n} name={n} className="size-7 border-[#0d0d0d]" />
                  ))}
                </div>
                <span className="max-w-44 text-xs leading-snug text-white/55">
                  {names.slice(0, 2).join(', ')}
                  {names.length > 2 && ` & ${names.length - 2} others`}{' '}
                  {finished ? 'have competed.' : 'are competing.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right photo column spacer on desktop — image already full-bleed */}
      <div className="relative hidden sm:block" aria-hidden />
    </article>
  );
}

function EventsSection() {
  const { games } = useMockData();
  const horizon = React.useMemo(() => upcomingGamesNextTwoWeeks(games), [games]);

  const availableFormats = React.useMemo(() => {
    const present = new Set(horizon.map((g) => categoryOf(g.format)));
    return EVENT_FILTERS.filter((f) => f.key === 'all' || present.has(f.key));
  }, [horizon]);

  const availableLevels = React.useMemo(() => {
    const present = new Set(horizon.map((g) => g.level));
    return LEVEL_FILTERS.filter((f) => f.key === 'all' || present.has(f.key as Level | 'mixed'));
  }, [horizon]);

  const [formatFilter, setFormatFilter] = React.useState<EventFilter>('all');
  // null = untouched → trigger shows the "Level" placeholder
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter | null>(null);
  const [selectedDay, setSelectedDay] = React.useState(() => localISODate());

  // Clear format/level picks that no longer exist among scheduled games.
  const facetSig = `${availableFormats.map((f) => f.key).join(',')}|${availableLevels.map((f) => f.key).join(',')}`;
  const [syncedFacetSig, setSyncedFacetSig] = React.useState(facetSig);
  if (syncedFacetSig !== facetSig) {
    setSyncedFacetSig(facetSig);
    if (formatFilter !== 'all' && !availableFormats.some((f) => f.key === formatFilter)) {
      setFormatFilter('all');
    }
    if (levelFilter && levelFilter !== 'all' && !availableLevels.some((f) => f.key === levelFilter)) {
      setLevelFilter('all');
    }
  }

  const days = React.useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)),
    [],
  );

  const filteredHorizon = React.useMemo(() => {
    return horizon.filter((g) => {
      if (formatFilter !== 'all' && categoryOf(g.format) !== formatFilter) return false;
      if (levelFilter && levelFilter !== 'all' && g.level !== levelFilter) return false;
      return true;
    });
  }, [horizon, formatFilter, levelFilter]);

  const filtered = React.useMemo(
    () => filteredHorizon.filter((g) => g.date === selectedDay),
    [filteredHorizon, selectedDay],
  );

  const gameDates = React.useMemo(
    () => new Set(filteredHorizon.map((g) => g.date)),
    [filteredHorizon],
  );

  // Keep the calendar on a day that still has games after filters change.
  if (!gameDates.has(selectedDay)) {
    const next = days.find((d) => gameDates.has(localISODate(d)));
    if (next) setSelectedDay(localISODate(next));
  }

  const startLabel = days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endLabel = days[13].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const rangeLabel = `${startLabel} – ${endLabel}`;

  const emptyFormat = EVENT_FILTERS.find((f) => f.key === formatFilter)?.label.toLowerCase();
  const emptyLevel =
    !levelFilter || levelFilter === 'all'
      ? ''
      : levelFilter === 'mixed'
        ? 'mixed-level'
        : LEVEL_LABELS[levelFilter];

  return (
    <section id="events" className="mx-auto max-w-5xl scroll-mt-28 px-4 py-20 sm:py-28">
      <div className="mb-3">
        <Eyebrow>Next 2 weeks</Eyebrow>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {rangeLabel}
          </h2>
          <p className="text-sm text-white/40">{horizon.length} games scheduled</p>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {availableFormats.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFormatFilter(f.key)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                formatFilter === f.key
                  ? 'border-white bg-white text-black'
                  : 'border-white/20 text-white/65 hover:border-white/45 hover:text-white',
              )}
            >
              {f.icon && <span className="mr-1">{f.icon}</span>}
              {f.label}
            </button>
          ))}
        </div>

        <Select value={levelFilter ?? undefined} onValueChange={(v) => setLevelFilter(v as LevelFilter)}>
          <SelectTrigger
            className={cn(
              'h-9 w-full min-w-[10.5rem] rounded-full border-white/20 bg-transparent px-3.5 text-xs font-medium text-white shadow-none sm:w-auto',
              'hover:border-white/45 hover:bg-white/5',
              'focus-visible:border-[#c6e03a] focus-visible:ring-[#c6e03a]/30',
              '[&_svg]:text-white/50',
              levelFilter && levelFilter !== 'all' && 'border-[#c6e03a]/60 text-[#c6e03a] [&_svg]:text-[#c6e03a]',
            )}
          >
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#161616] text-white">
            {availableLevels.map((f) => (
              <SelectItem
                key={f.key}
                value={f.key}
                className="text-xs text-white/80 focus:bg-white/10 focus:text-white data-highlighted:bg-white/10 data-highlighted:text-white"
              >
                {f.key === 'all' || f.key === 'mixed' ? f.label : LEVEL_LABELS[f.key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const iso = localISODate(d);
          const active = iso === selectedDay;
          const hasGame = gameDates.has(iso);
          const isToday = iso === localISODate();
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelectedDay(iso)}
              className={cn(
                'flex min-w-[3.5rem] flex-col items-center rounded-full border px-3 py-2.5 transition-colors',
                active
                  ? 'border-white text-white'
                  : hasGame
                    ? 'border-white/35 text-white/75 hover:border-white/60'
                    : 'border-white/10 text-white/30 hover:border-white/25',
              )}
            >
              <span className="text-lg font-semibold leading-none">{d.getDate()}</span>
              <span className="mt-1 text-[10px] tracking-[0.14em] uppercase">
                {isToday ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              {hasGame && (
                <span
                  className={cn(
                    'mt-1.5 size-1 rounded-full',
                    active ? 'bg-[#c6e03a]' : 'bg-white/50',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        {filtered.map((g, i) => (
          <EventCard key={g.id} game={g} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-[28px] border border-white/10 px-8 py-16 text-center text-sm text-white/45">
            No {emptyFormat}
            {emptyLevel ? ` · ${emptyLevel}` : ''} games on this day — try another level, format, or date.
          </div>
        )}
      </div>
    </section>
  );
}

function LandingNav({ active }: { active: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Padel Nomads home" className="relative z-10">
          <Logo markClassName="h-6" />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/20 p-1 backdrop-blur-md md:flex">
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] transition-colors',
                  isActive
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-white/55 hover:text-white',
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="relative z-10 flex items-center gap-1.5">
          <RoleSwitcher tone="dark" />
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
          >
            <LogIn className="size-4" />
            <span className="hidden sm:inline">Sign in</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  const { users } = useMockData();
  const [active, setActive] = React.useState('about');
  const memberCount = 1000 + users.filter((u) => u.role === 'player' && u.status === 'approved').length;

  React.useEffect(() => {
    const ids = NAV.map((n) => n.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white" style={DOTS}>
      <LandingNav active={active} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={PHOTOS.hero}
            alt="Padel Nomads community"
            fill
            priority
            className="pn-hero-photo object-cover object-[70%_center] grayscale sm:object-right"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/88 to-[#0d0d0d]/25 sm:via-[#0d0d0d]/75 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-[#0d0d0d]/40" />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-4 pt-28 pb-24">
          <div className="pn-fade-up max-w-xl">
            <h1 className="font-heading text-[clamp(3.4rem,11vw,6.75rem)] leading-[0.92] font-bold tracking-[-0.03em]">
              Padel
              <br />
              Nomads
            </h1>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/55 sm:text-base">
              An international community of passionate Padel players, headquartered in Dubai, UAE
            </p>
            <Link
              href="/apply"
              className={cn(
                'mt-8 inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02]',
                LIME,
              )}
            >
              + Become a Nomad
            </Link>
          </div>

          <div className="pn-fade-up absolute inset-x-4 bottom-8 flex items-end justify-between sm:inset-x-4 sm:bottom-10" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {[PHOTOS.m1, PHOTOS.m2, PHOTOS.m3].map((src, i) => (
                  <AvatarDot key={src} name={`m${i}`} src={src} className="size-9 border-[#0d0d0d]" />
                ))}
              </div>
              <div className="text-sm leading-tight">
                <div className="font-semibold text-white">{memberCount.toLocaleString()} members</div>
                <div className="text-xs font-medium text-[#c6e03a]">3 joined today ▲</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/45">
              <span className="text-base leading-none" aria-hidden>
                🇦🇪
              </span>
              <span dir="rtl" lang="ar" className="tracking-wide">
                صنع في دبي
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem]">
              <Image
                src={PHOTOS.founder}
                alt="Eugene Trofimov, Founder"
                fill
                className="object-cover object-top grayscale"
                sizes="(max-width: 1024px) 90vw, 480px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
            </div>
          </div>
          <div className="max-w-md lg:ml-auto lg:max-w-lg">
            <Eyebrow>About</Eyebrow>
            <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              The Nomad way
            </h2>
            <p className="mt-6 text-[15px] leading-[1.7] text-white/65 sm:text-base">
              Padel Nomads was a community I launched in 2024 in sunny Dubai, with the aim to bring
              together the best of both worlds — great games, and great people. It&apos;s not your
              typical social padel community — every player here is genuinely looking to improve
              their level consistently, which is why we have some strong coaches as part of our gang.
            </p>
            <div className="mt-10 flex items-end justify-between gap-6">
              <div>
                <div className="font-semibold text-white">Eugene Trofimov</div>
                <div className="mt-0.5 text-sm text-white/40">Founder</div>
              </div>
              <span
                className="pb-1 text-3xl text-white/50 italic"
                style={{ fontFamily: 'Georgia, "Brush Script MT", cursive' }}
              >
                Eugene
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section id="values" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-20 sm:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <Eyebrow>Values</Eyebrow>
            <h2 className="font-heading max-w-md text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
              How we like to act as a community
            </h2>
            <div className="mt-12 grid gap-x-10 gap-y-0 sm:grid-cols-2">
              {VALUES.map((v, i) => (
                <div
                  key={v.num}
                  className={cn(
                    'border-t border-white/10 py-6',
                    i === VALUES.length - 1 && 'sm:col-span-2 sm:max-w-md',
                  )}
                >
                  <div className="text-[11px] tracking-[0.2em] text-white/35">{v.num}</div>
                  <h3 className="mt-2 text-base font-semibold text-white">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[2rem] lg:max-w-none lg:sticky lg:top-28">
            <Image
              src={PHOTOS.values}
              alt="Players celebrating on court"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 420px"
            />
          </div>
        </div>
      </section>

      {/* ── Community ────────────────────────────────────────── */}
      <section id="community" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-20 sm:py-28">
        <Eyebrow>Members</Eyebrow>
        <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Meet our community
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MEMBERS.map((m) => (
            <article
              key={m.name}
              className="rounded-[1.75rem] bg-white/[0.04] px-7 py-10 text-center ring-1 ring-white/[0.06] transition-colors hover:bg-white/[0.06]"
            >
              <div className="relative mx-auto mb-7 size-28 overflow-hidden rounded-full sm:size-32">
                <Image src={m.src} alt={m.name} fill className="object-cover object-top" sizes="128px" />
              </div>
              <div className="text-sm text-white/40">{m.level}</div>
              <h3 className="font-heading mt-1 text-2xl font-semibold tracking-tight">
                {m.name} {m.flag}
              </h3>
              <div className="mt-1.5 text-sm text-white/50">{m.role}</div>
              <p className="mt-5 text-sm leading-relaxed text-white/45">{m.bio}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Events ───────────────────────────────────────────── */}
      <EventsSection />

      {/* ── How to apply ─────────────────────────────────────── */}
      <section id="apply" className="mx-auto max-w-5xl scroll-mt-28 px-4 py-24 text-center sm:py-32">
        <Eyebrow>How to apply</Eyebrow>
        <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Become a Nomad
        </h2>
        <div className="mx-auto mt-14 grid max-w-4xl gap-12 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((s) => (
            <div key={s.num} className="px-2">
              <div className="text-[11px] tracking-[0.22em] text-white/35">{s.num}</div>
              <h3 className="mt-3 text-lg font-semibold text-white underline decoration-white/25 underline-offset-4">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/45">{s.text}</p>
            </div>
          ))}
        </div>
        <Link
          href="/apply"
          className={cn(
            'mt-14 inline-flex min-w-[220px] items-center justify-center rounded-full px-16 py-4 text-sm font-semibold transition-transform hover:scale-[1.02]',
            LIME,
          )}
        >
          Become a Nomad
        </Link>
      </section>

      {/* ── Perks ────────────────────────────────────────────── */}
      <section id="perks" className="relative mx-auto max-w-5xl scroll-mt-28 overflow-hidden px-4 py-24 text-center sm:py-32">
        <BubbleAvatar src={PHOTOS.m2} className="top-8 right-[8%] hidden sm:block" delay={0.4} />
        <BubbleAvatar src={PHOTOS.m1} className="bottom-16 left-[6%] hidden sm:block" delay={1.1} />

        <Eyebrow>Perks</Eyebrow>
        <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Play with benefits
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/45 sm:text-[15px]">
          We partner up with cool local &amp; international businesses around Dubai to bring you cool
          perks. The list of benefits changes on a monthly basis.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {PARTNERS.map((p) => (
            <span key={p.name} className={cn('select-none', p.className)}>
              {p.name}
            </span>
          ))}
        </div>
      </section>

      <InstagramCarousel />

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center">
          <Logo markClassName="h-6" />
          <p className="max-w-sm text-sm text-white/35">
            A closed, curated padel community. Membership by application.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/40">
            <a
              href={IG_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              @padel_nomads
            </a>
            <span className="text-white/20">·</span>
            <Link href="/login" className="transition-colors hover:text-white">
              Sign in
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/apply" className="transition-colors hover:text-white">
              Become a Nomad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
