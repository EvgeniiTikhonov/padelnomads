import { useState } from 'react';
import { useStore, type Offer } from '@/lib/store';
import { PageHeader, Card, Badge, EmptyState, Modal } from '@/components/ui';

export default function Offers() {
  const offers = useStore((s) => s.offers.filter((o) => o.status === 'active'));
  const [selected, setSelected] = useState<Offer | null>(null);

  return (
    <div>
      <PageHeader title="Offers" subtitle="Exclusive partner offers for Padel Nomads members." />

      {offers.length === 0 ? (
        <EmptyState title="No active offers" message="Check back soon for new partner offers." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <Card key={o.id} className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-2">
                <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
                  {o.partnerName}
                </p>
                {o.discount && <Badge>{o.discount}</Badge>}
              </div>
              <h3 className="mt-2 font-heading text-lg font-semibold text-brand-black">{o.title}</h3>
              <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-brand-black/70">
                {o.description}
              </p>
              <button onClick={() => setSelected(o)} className="btn-secondary mt-5 !py-3 !text-xs">
                View details
              </button>
            </Card>
          ))}
        </div>
      )}

      <OfferModal offer={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function OfferModal({ offer, onClose }: { offer: Offer | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!offer) return null;

  const copy = () => {
    if (!offer.promoCode) return;
    navigator.clipboard?.writeText(offer.promoCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal open={!!offer} onClose={onClose} title={offer.title}>
      <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
        {offer.partnerName}
      </p>
      {offer.discount && (
        <p className="mt-3">
          <Badge>{offer.discount}</Badge>
        </p>
      )}
      <p className="mt-4 font-body text-body text-brand-black/80">{offer.description}</p>

      {offer.promoCode && (
        <div className="mt-6">
          <p className="form-label">Promo code</p>
          <div className="mt-2 flex items-center gap-3">
            <code className="flex-1 border border-dashed border-brand-black/30 bg-brand-white px-4 py-3 font-heading text-sm font-semibold tracking-wider text-brand-black">
              {offer.promoCode}
            </code>
            <button onClick={copy} className="btn-primary !px-5 !py-3 !text-xs">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {offer.link && (
        <div className="mt-6">
          <a href={offer.link} target="_blank" rel="noreferrer" className="btn-secondary">
            Open partner link
          </a>
        </div>
      )}
    </Modal>
  );
}
