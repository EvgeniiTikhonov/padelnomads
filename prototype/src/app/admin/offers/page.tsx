'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useMockData } from '@/data/provider';
import { formatDate } from '@/lib/format';
import type { Offer } from '@/types';

const SEGMENTS = [
  'All marketing-opted-in players',
  'Advanced & professional players',
  'Active in last 30 days',
  'Women',
  'Beginners',
];

const emptyForm = { title: '', partnerName: '', description: '', promoCode: '', link: '', startDate: '', endDate: '' };

export default function AdminOffersPage() {
  const { offers, users, createOffer, updateOffer, toggleOffer, deleteOffer, sendOfferToSegment } = useMockData();

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [sendTarget, setSendTarget] = React.useState<Offer | null>(null);
  const [segment, setSegment] = React.useState<string | null>(SEGMENTS[0]);

  const marketingOptIns = users.filter((u) => u.role === 'player' && u.status === 'approved' && u.whatsappMarketingOptIn).length;

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setEditorOpen(true); };
  const openEdit = (o: Offer) => {
    setEditingId(o.id);
    setForm({
      title: o.title, partnerName: o.partnerName, description: o.description,
      promoCode: o.promoCode ?? '', link: o.link ?? '', startDate: o.startDate, endDate: o.endDate,
    });
    setEditorOpen(true);
  };

  const valid = form.title.trim() && form.partnerName.trim() && form.description.trim() && form.startDate && form.endDate;

  const save = () => {
    if (!valid) return;
    const payload = {
      title: form.title.trim(), partnerName: form.partnerName.trim(), description: form.description.trim(),
      promoCode: form.promoCode.trim() || undefined, link: form.link.trim() || undefined,
      startDate: form.startDate, endDate: form.endDate,
    };
    if (editingId) updateOffer(editingId, payload);
    else createOffer({ ...payload, status: 'active' });
    setEditorOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Offers</h1>
          <p className="text-sm text-muted-foreground">Partner offers shown to members and sendable via WhatsApp.</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4" /> Add offer</Button>
      </div>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Offer</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Promo code</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="max-w-56 pl-4">
                    <p className="truncate font-medium">{o.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.description}</p>
                  </TableCell>
                  <TableCell>{o.partnerName}</TableCell>
                  <TableCell>{o.promoCode ? <Badge variant="secondary" className="font-mono">{o.promoCode}</Badge> : '—'}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {formatDate(o.startDate)} – {formatDate(o.endDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch size="sm" checked={o.status === 'active'} onCheckedChange={() => toggleOffer(o.id)} />
                      <span className="text-xs capitalize">{o.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => { setSendTarget(o); }} disabled={o.status !== 'active'}>
                        <Send className="size-3.5" />
                        <span className="sr-only">Send via WhatsApp</span>
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(o)}>
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteOffer(o.id)}>
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit offer' : 'Add offer'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Partner *</Label>
              <Input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Promo code</Label>
              <Input value={form.promoCode} onChange={(e) => setForm({ ...form, promoCode: e.target.value })} className="font-mono" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>External link</Label>
              <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Start date *</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End date *</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button disabled={!valid} onClick={save}>{editingId ? 'Save changes' : 'Create offer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to segment dialog (PRD §11.2 / §12.6) */}
      <Dialog open={sendTarget !== null} onOpenChange={(o) => !o && setSendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send offer via WhatsApp</DialogTitle>
            <DialogDescription>
              Marketing template sent 1:1 to the selected segment. Only players with marketing opt-in
              receive it ({marketingOptIns} players currently opted in). Meta frequency caps may drop some sends.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Segment</Label>
            <Select value={segment} onValueChange={(v) => setSegment(v as string)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border bg-muted/50 p-3 text-sm">
            <p className="font-medium">{sendTarget?.title}</p>
            <p className="text-xs text-muted-foreground">
              Template: partner_offer_july (marketing, approved) · buttons: Copy code, View offer
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendTarget(null)}>Cancel</Button>
            <Button onClick={() => {
              if (sendTarget && segment) sendOfferToSegment(sendTarget.id, segment, Math.min(marketingOptIns, 12));
              setSendTarget(null);
            }}>
              <Send className="size-4" /> Send now (simulated)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
