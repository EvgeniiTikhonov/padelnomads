'use client';

import Link from 'next/link';
import {
  CalendarDays, PartyPopper, Tag, Zap, Lock, CreditCard, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// PRD §7.5 — hardcoded content for MVP (open question: admin-managed later)
const BENEFITS = [
  {
    icon: CalendarDays,
    title: 'Curated games',
    text: 'Weekly Americanos, King of the Court, socials and tournaments — always matched to your level, always organized for you.',
  },
  {
    icon: PartyPopper,
    title: 'Community events',
    text: 'Season kick-offs, beach days, award nights and post-game hangouts with the Nomads crew.',
  },
  {
    icon: Tag,
    title: 'Special partner offers',
    text: 'Court discounts, gear deals, physio sessions and café perks from our partners — updated monthly on the Offers page.',
  },
  {
    icon: Zap,
    title: 'Priority access',
    text: 'Members in good karma standing get first access to high-demand games before spots open up.',
  },
  {
    icon: Lock,
    title: 'Member-only activities',
    text: 'Coaching clinics, ladder leagues and format nights exclusive to the community.',
  },
  {
    icon: CreditCard,
    title: 'Coming soon: paid membership perks',
    text: 'Free court hours, guest passes and bigger partner discounts as part of the future paid tier.',
    soon: true,
  },
];

export default function BenefitsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Membership benefits</h1>
        <p className="text-sm text-muted-foreground">What being a Padel Nomad gets you.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <Card key={b.title} className="rounded-2xl py-0 shadow-sm">
            <CardContent className="flex gap-4 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="size-5" />
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  {b.title}
                  {b.soon && <Badge variant="secondary">Future</Badge>}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl bg-primary py-0 text-primary-foreground">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="font-heading font-semibold">Current partner offers</h3>
            <p className="text-sm text-primary-foreground/80">Promo codes and deals live right now.</p>
          </div>
          <Link href="/app/offers">
            <Button variant="secondary" size="sm">
              Browse offers <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
