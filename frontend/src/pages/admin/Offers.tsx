import { useState, type FormEvent } from 'react';
import { actions, useStore, type Offer } from '@/lib/store';
import { PageHeader, Card, Badge, EmptyState, Modal, Field, ConfirmDialog } from '@/components/ui';

export default function AdminOffers() {
  const offers = useStore((s) => s.offers);
  const [formOpen, setFormOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [deleteOffer, setDeleteOffer] = useState<Offer | null>(null);

  const openCreate = () => {
    setEditOffer(null);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Offers"
        subtitle="Manage partner offers and member benefits."
        action={
          <button onClick={openCreate} className="btn-primary !py-3 !text-xs">
            + Add offer
          </button>
        }
      />

      {offers.length === 0 ? (
        <EmptyState title="No offers yet" message="Add your first partner offer." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <Card key={o.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
                  {o.partnerName}
                </p>
                <Badge tone={o.status === 'active' ? 'success' : 'muted'}>{o.status}</Badge>
              </div>
              <h3 className="mt-2 font-heading text-base font-semibold text-brand-black">{o.title}</h3>
              <p className="mt-2 flex-1 font-body text-sm text-brand-black/65">{o.description}</p>
              {o.promoCode && (
                <p className="mt-3 font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
                  Code: {o.promoCode}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-brand-black/10 pt-3">
                <Action
                  onClick={() =>
                    actions.updateOffer(o.id, { status: o.status === 'active' ? 'inactive' : 'active' })
                  }
                >
                  {o.status === 'active' ? 'Deactivate' : 'Activate'}
                </Action>
                <Action
                  onClick={() => {
                    setEditOffer(o);
                    setFormOpen(true);
                  }}
                >
                  Edit
                </Action>
                <Action danger onClick={() => setDeleteOffer(o)}>
                  Delete
                </Action>
              </div>
            </Card>
          ))}
        </div>
      )}

      {formOpen && (
        <OfferFormModal offer={editOffer} onClose={() => setFormOpen(false)} />
      )}
      <ConfirmDialog
        open={!!deleteOffer}
        title="Delete offer"
        message={`Delete "${deleteOffer?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteOffer(null)}
        onConfirm={() => {
          if (deleteOffer) actions.deleteOffer(deleteOffer.id);
          setDeleteOffer(null);
        }}
      />
    </div>
  );
}

function OfferFormModal({ offer, onClose }: { offer: Offer | null; onClose: () => void }) {
  const editing = !!offer;
  const [form, setForm] = useState(() => ({
    title: offer?.title ?? '',
    partnerName: offer?.partnerName ?? '',
    description: offer?.description ?? '',
    discount: offer?.discount ?? '',
    promoCode: offer?.promoCode ?? '',
    link: offer?.link ?? '',
    startDate: offer?.startDate ?? '',
    endDate: offer?.endDate ?? '',
    status: offer?.status ?? ('active' as Offer['status']),
  }));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.partnerName || !form.description) {
      setError('Title, partner name and description are required.');
      return;
    }
    const payload = {
      title: form.title,
      partnerName: form.partnerName,
      description: form.description,
      discount: form.discount || undefined,
      promoCode: form.promoCode || undefined,
      link: form.link || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
    };
    if (editing && offer) actions.updateOffer(offer.id, payload);
    else actions.createOffer(payload);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={editing ? 'Edit offer' : 'Add offer'} wide>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Offer title" required>
            <input className="form-control" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Partner name" required>
            <input
              className="form-control"
              value={form.partnerName}
              onChange={(e) => set('partnerName', e.target.value)}
            />
          </Field>
          <Field label="Discount / benefit">
            <input
              className="form-control"
              value={form.discount}
              onChange={(e) => set('discount', e.target.value)}
              placeholder="e.g. 20% off"
            />
          </Field>
          <Field label="Promo code">
            <input
              className="form-control"
              value={form.promoCode}
              onChange={(e) => set('promoCode', e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="Start date">
            <input
              type="date"
              className="form-control"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              className="form-control"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </Field>
          <Field label="Link">
            <input
              className="form-control"
              value={form.link}
              onChange={(e) => set('link', e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="Status">
            <select
              className="form-control"
              value={form.status}
              onChange={(e) => set('status', e.target.value as Offer['status'])}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
        <Field label="Description" required>
          <textarea
            className="form-control min-h-24"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        {error && <p className="font-body text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary !px-6 !py-3 !text-xs">
            Cancel
          </button>
          <button type="submit" className="btn-primary !px-6 !py-3 !text-xs">
            {editing ? 'Save changes' : 'Add offer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Action({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-heading text-xs font-semibold uppercase tracking-wide transition-colors ${
        danger ? 'text-red-700 hover:text-red-900' : 'text-brand-black/70 hover:text-brand-black'
      }`}
    >
      {children}
    </button>
  );
}
