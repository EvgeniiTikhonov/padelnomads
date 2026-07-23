'use client';

import Link from 'next/link';
import { Tag, Zap, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BenefitsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Membership benefits</h1>
        <p className="text-sm text-muted-foreground">What being a Padel Nomad gets you.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="flex gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tag className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Special partner offers</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Court discounts, gear deals, physio sessions and café perks from our partners — updated monthly.
              </p>
              <Link href="/app/offers" className="mt-3 inline-flex">
                <Button size="sm">
                  Browse offers <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="flex gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Priority access</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Members in good karma standing get first access to high-demand games before spots open up.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl py-0 shadow-sm sm:col-span-2">
          <CardContent className="flex gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Member-only activities</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Coaching clinics and special invite-only events exclusive to the community.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
