'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Copy, ExternalLink, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMockData } from '@/data/provider';
import { formatDate, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Offer } from '@/types';

function offerLogo(offer: Offer): string | undefined {
  return offer.logoUrl || offer.imageUrl;
}

function PartnerLogo({ offer, size = 'md' }: { offer: Offer; size?: 'sm' | 'md' | 'lg' }) {
  const src = offerLogo(offer);
  const box = size === 'lg' ? 'size-16' : size === 'sm' ? 'size-10' : 'size-14';
  const text = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm';

  if (src) {
    return (
      <img
        src={src}
        alt={`${offer.partnerName} logo`}
        className={cn(box, 'shrink-0 rounded-xl border border-white/10 bg-white/5 object-cover')}
      />
    );
  }

  return (
    <div
      className={cn(
        box,
        'flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-primary/10 font-heading font-bold text-primary',
        text,
      )}
      aria-hidden
    >
      {initials(offer.partnerName)}
    </div>
  );
}

function PromoCodeField({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    toast.success('Promo code copied', { description: code });
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Promo code</p>
        <p className="truncate font-mono text-sm font-bold tracking-wider">{code}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-8 shrink-0"
        onClick={copy}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

function OfferLinks({ offer }: { offer: Offer }) {
  if (!offer.link && !offer.instagramUrl) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {offer.link && (
        <a
          href={offer.link}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-white/35 hover:text-foreground"
        >
          <ExternalLink className="size-3.5" /> Website
        </a>
      )}
      {offer.instagramUrl && (
        <a
          href={offer.instagramUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-white/35 hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current" strokeWidth="2" aria-hidden>
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          Instagram
        </a>
      )}
    </div>
  );
}

export function OfferCard({ offer, highlighted = false }: { offer: Offer; highlighted?: boolean }) {
  return (
    <Card
      id={`offer-${offer.id}`}
      className={cn(
        'h-full rounded-2xl border-white/10 bg-card py-0 shadow-none transition-shadow',
        highlighted && 'ring-2 ring-primary/70',
      )}
    >
      <CardContent className="flex h-full flex-col gap-3.5 p-4">
        <div className="flex items-start gap-3">
          <PartnerLogo offer={offer} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{offer.partnerName}</p>
            <h3 className="font-heading text-base leading-snug font-semibold">{offer.title}</h3>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{offer.description}</p>

        {offer.promoCode && <PromoCodeField code={offer.promoCode} />}

        <OfferLinks offer={offer} />

        <p className="mt-auto pt-1 text-[11px] text-muted-foreground">
          Valid until {formatDate(offer.endDate)}
        </p>
      </CardContent>
    </Card>
  );
}

function OffersPageContent() {
  const { offers } = useMockData();
  const searchParams = useSearchParams();
  const focusOfferId = searchParams.get('offer');
  const active = offers.filter((o) => o.status === 'active');

  React.useEffect(() => {
    if (!focusOfferId) return;
    const el = document.getElementById(`offer-${focusOfferId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusOfferId, active.length]);

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
            <OfferCard key={o.id} offer={o} highlighted={o.id === focusOfferId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OffersPage() {
  return (
    <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading offers…</div>}>
      <OffersPageContent />
    </React.Suspense>
  );
}
