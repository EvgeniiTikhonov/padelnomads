'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ExternalLink, ImageIcon, LayoutGrid, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMockData } from '@/data/provider';
import { CLUB_AMENITY_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { clubs, games } = useMockData();

  const club = clubs.find((c) => c.id === id);
  if (!club) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">Club not found</p>
        <Button variant="outline" onClick={() => router.push('/app/games')}>Back to games</Button>
      </div>
    );
  }

  const upcomingHere = games
    .filter((g) => !g.deleted && g.venue === club.name && (g.status === 'upcoming' || g.status === 'live'))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back
      </button>

      <div className={cn('overflow-hidden rounded-2xl border bg-card')}>
        <div className="relative aspect-[16/9] bg-muted">
          {club.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.imageUrl} alt={club.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-12 opacity-40" />
            </div>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h1 className="font-heading text-2xl font-bold">{club.name}</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{club.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <LayoutGrid className="size-3" /> {club.courtCount} courts
            </Badge>
            {club.status === 'inactive' && <Badge variant="outline">Inactive</Badge>}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {club.mapsUrl && (
              <a
                href={club.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm hover:bg-muted"
              >
                <MapPin className="size-3.5" /> Maps <ExternalLink className="size-3 opacity-60" />
              </a>
            )}
            {club.instagramUrl && (
              <a
                href={club.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm hover:bg-muted"
              >
                <InstagramIcon className="size-3.5" /> Instagram <ExternalLink className="size-3 opacity-60" />
              </a>
            )}
          </div>
        </div>
      </div>

      {club.amenities.length > 0 && (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="font-heading text-base">Amenities</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5 p-5 pt-0">
            {club.amenities.map((a) => (
              <Badge key={a} variant="outline">{CLUB_AMENITY_LABELS[a]}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="font-heading text-base">Courts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 p-5 pt-0 sm:grid-cols-2">
          {club.courtNames.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              {name}
            </div>
          ))}
        </CardContent>
      </Card>

      {upcomingHere.length > 0 && (
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="font-heading text-base">Upcoming here</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-5 pt-0">
            {upcomingHere.map((g) => (
              <Link
                key={g.id}
                href={`/app/games/${g.id}`}
                className="flex items-center justify-between gap-2 py-3 text-sm hover:text-primary"
              >
                <span className="font-medium">{g.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {g.date} · {g.startTime}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
