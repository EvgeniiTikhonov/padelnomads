'use client';

import * as React from 'react';
import { Copy, ExternalLink, Tag, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useMockData } from '@/data/provider';
import { formatDate } from '@/lib/format';
import type { Offer } from '@/types';

export default function OffersPage() {
  const { offers } = useMockData();
  const [selected, setSelected] = React.useState<Offer | null>(null);
  const active = offers.filter((o) => o.status === 'active');

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast.success('Promo code copied', { description: code });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Partner offers</h1>
        <p className="text-sm text-muted-foreground">Member-only deals from our partners.</p>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <Tag className="size-8 text-muted-foreground" />
          <p className="font-medium">No active offers right now</p>
          <p className="text-sm text-muted-foreground">New partner deals drop every month.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)} className="text-left">
              <Card className="h-full rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Store className="size-3.5" /> {o.partnerName}
                  </div>
                  <h3 className="font-heading font-semibold">{o.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5">
                    {o.promoCode && (
                      <Badge variant="secondary" className="font-mono">{o.promoCode}</Badge>
                    )}
                    <Badge variant="outline">Until {formatDate(o.endDate)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Store className="size-3.5" /> {selected.partnerName}
                </div>
                <DialogTitle className="font-heading text-lg">{selected.title}</DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Valid {formatDate(selected.startDate)} – {formatDate(selected.endDate)}
                </p>
                {selected.promoCode && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed bg-muted/50 p-3">
                    <span className="font-mono text-base font-bold tracking-wider">{selected.promoCode}</span>
                    <Button size="sm" onClick={() => copyCode(selected.promoCode!)}>
                      <Copy className="size-3.5" /> Copy code
                    </Button>
                  </div>
                )}
                {selected.link && (
                  <a href={selected.link} target="_blank" rel="noreferrer" className="block">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="size-4" /> Open partner website
                    </Button>
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
