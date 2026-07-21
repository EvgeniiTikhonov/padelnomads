'use client';

import Link from 'next/link';
import {
  Inbox, CalendarDays, Radio, Tag, Gauge, Copy, MessageCircle, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMockData } from '@/data/provider';
import { visibleGames } from '@/lib/derive';
import { formatDate } from '@/lib/format';

export default function AdminDashboard() {
  const { applications, games, offers, users, duplicates, outbound } = useMockData();

  const pendingApps = applications.filter((a) => a.status === 'pending');
  const upcoming = visibleGames(games).filter((g) => g.status === 'upcoming');
  const live = visibleGames(games).find((g) => g.status === 'live');
  const activeOffers = offers.filter((o) => o.status === 'active');
  const suspensionQueue = users.filter((u) => u.role === 'player' && u.status !== 'banned' && u.karmaTier === 'suspended');
  const openDuplicates = duplicates.filter((d) => !d.dismissed && !d.merged);
  const delivered = outbound.filter((m) => ['delivered', 'read'].includes(m.status)).length;
  const failed = outbound.filter((m) => ['failed', 'dropped'].includes(m.status)).length;
  const deliveryRate = outbound.length ? Math.round((delivered / outbound.length) * 100) : 0;

  const cards = [
    { href: '/admin/applications', icon: Inbox, label: 'Pending applications', value: pendingApps.length, sub: `${applications.length} total`, tone: 'text-amber-600 bg-amber-100' },
    { href: '/admin/games', icon: CalendarDays, label: 'Upcoming games', value: upcoming.length, sub: 'next 2 weeks focus', tone: 'text-blue-600 bg-blue-100' },
    { href: live ? `/admin/games/${live.id}` : '/admin/games', icon: Radio, label: 'Live game', value: live ? 1 : 0, sub: live ? `${live.title} · ${live.venue}` : 'none right now', tone: 'text-green-600 bg-green-100' },
    { href: '/admin/offers', icon: Tag, label: 'Active offers', value: activeOffers.length, sub: `${offers.length} total`, tone: 'text-violet-600 bg-violet-100' },
    { href: '/admin/karma', icon: Gauge, label: 'Suspension queue', value: suspensionQueue.length, sub: 'karma ≤ 0, awaiting review', tone: 'text-red-600 bg-red-100' },
    { href: '/admin/players', icon: Copy, label: 'Open duplicates', value: openDuplicates.length, sub: 'candidate pairs to review', tone: 'text-orange-600 bg-orange-100' },
    { href: '/admin/whatsapp', icon: MessageCircle, label: 'WhatsApp delivery', value: `${deliveryRate}%`, sub: `${failed} failed/dropped of ${outbound.length}`, tone: 'text-teal-600 bg-teal-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">Community operations at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="h-full rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className={`flex size-9 items-center justify-center rounded-xl ${c.tone}`}>
                    <c.icon className="size-4" />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground/50" />
                </div>
                <p className="mt-3 font-heading text-2xl font-bold">{c.value}</p>
                <p className="text-sm font-medium">{c.label}</p>
                <p className="truncate text-xs text-muted-foreground">{c.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick queues */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-heading font-semibold">Newest applications</h2>
              <Link href="/admin/applications" className="text-sm font-medium text-primary">Review all</Link>
            </div>
            <div className="divide-y">
              {pendingApps.slice(0, 4).map((a) => (
                <Link key={a.id} href="/admin/applications" className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.name ?? a.phoneNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.level} · {formatDate(a.createdAt.slice(0, 10))}</p>
                  </div>
                  <div className="flex gap-1">
                    {a.matchedExistingUserId && <Badge variant="secondary">Identity match</Badge>}
                    {a.blacklistFlag && <Badge variant="destructive">Blacklist</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-heading font-semibold">Next games</h2>
              <Link href="/admin/games" className="text-sm font-medium text-primary">Manage games</Link>
            </div>
            <div className="divide-y">
              {upcoming.slice(0, 4).map((g) => (
                <Link key={g.id} href={`/admin/games/${g.id}`} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{g.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(g.date)} · {g.startTime} · {g.venue}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
