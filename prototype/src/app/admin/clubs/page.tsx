'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, MapPin, ExternalLink, Upload, ImageIcon, Building2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { useMockData } from '@/data/provider';
import { CLUB_AMENITY_LABELS } from '@/lib/format';
import { CLUB_AMENITIES, type Club, type ClubAmenity } from '@/types';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

type ClubForm = {
  name: string;
  description: string;
  mapsUrl: string;
  instagramUrl: string;
  imageUrl: string;
  courtCount: number;
  courtNames: string[];
  amenities: ClubAmenity[];
  status: Club['status'];
};

const emptyForm = (): ClubForm => ({
  name: '',
  description: '',
  mapsUrl: '',
  instagramUrl: '',
  imageUrl: '',
  courtCount: 4,
  courtNames: ['Court 1', 'Court 2', 'Court 3', 'Court 4'],
  amenities: [],
  status: 'active',
});

function syncCourtNames(count: number, names: string[]): string[] {
  const next = names.slice(0, count);
  while (next.length < count) next.push(`Court ${next.length + 1}`);
  return next;
}

export default function AdminClubsPage() {
  const { clubs, createClub, updateClub, toggleClub, deleteClub } = useMockData();
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<ClubForm>(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setEditorOpen(true);
  };

  const openEdit = (c: Club) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      description: c.description,
      mapsUrl: c.mapsUrl ?? '',
      instagramUrl: c.instagramUrl ?? '',
      imageUrl: c.imageUrl ?? '',
      courtCount: c.courtCount,
      courtNames: [...c.courtNames],
      amenities: [...c.amenities],
      status: c.status,
    });
    setEditorOpen(true);
  };

  const patch = <K extends keyof ClubForm>(key: K, value: ClubForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setCourtCount = (n: number) => {
    const count = Math.max(1, Math.min(20, n || 1));
    setForm((f) => ({
      ...f,
      courtCount: count,
      courtNames: syncCourtNames(count, f.courtNames),
    }));
  };

  const toggleAmenity = (a: ClubAmenity) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  };

  const onImageFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') patch('imageUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const valid = form.name.trim() && form.description.trim() && form.courtCount > 0;

  const save = () => {
    if (!valid) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      mapsUrl: form.mapsUrl.trim() || undefined,
      instagramUrl: form.instagramUrl.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      courtCount: form.courtCount,
      courtNames: syncCourtNames(form.courtCount, form.courtNames.map((n) => n.trim() || 'Court')),
      amenities: form.amenities,
      status: form.status,
    };
    if (editingId) updateClub(editingId, payload);
    else createClub(payload);
    setEditorOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Clubs</h1>
          <p className="text-sm text-muted-foreground">
            Venues where games are hosted — photos, maps, courts, and amenities.
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4" /> Add club</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {clubs.map((c) => (
          <Card key={c.id} className={`overflow-hidden rounded-2xl py-0 shadow-sm ${c.status === 'inactive' ? 'opacity-60' : ''}`}>
            <div className="relative aspect-[16/9] bg-muted">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="size-10 opacity-40" />
                </div>
              )}
              {c.status === 'inactive' && (
                <Badge className="absolute top-2 left-2 border-none bg-black/60 text-white">Inactive</Badge>
              )}
            </div>
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="flex items-center gap-1.5 font-heading text-base font-semibold">
                  <Building2 className="size-4 text-primary" /> {c.name}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">{c.courtCount} courts</Badge>
                {c.mapsUrl && (
                  <a
                    href={c.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 hover:text-foreground"
                  >
                    <MapPin className="size-3" /> Maps <ExternalLink className="size-3" />
                  </a>
                )}
                {c.instagramUrl && (
                  <a
                    href={c.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 hover:text-foreground"
                  >
                    <InstagramIcon className="size-3" /> Instagram <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              {c.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.amenities.map((a) => (
                    <Badge key={a} variant="outline" className="text-[10px]">
                      {CLUB_AMENITY_LABELS[a]}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleClub(c.id)}>
                  {c.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteClub(c.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {clubs.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No clubs yet — add the first venue.
          </div>
        )}
      </div>

      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-lg">
          <SheetHeader className="p-0">
            <SheetTitle className="font-heading text-lg">
              {editingId ? 'Edit club' : 'Add club'}
            </SheetTitle>
            <SheetDescription>
              Upload a photo, set courts and amenities, and link Maps / Instagram for players.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="overflow-hidden rounded-xl border bg-muted">
                <div className="relative aspect-[16/9]">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-10 opacity-40" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Label
                  htmlFor="club-photo"
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                >
                  <Upload className="size-3.5" /> Upload picture
                </Label>
                <input
                  id="club-photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onImageFile(e.target.files?.[0] ?? null)}
                />
                {form.imageUrl && (
                  <Button size="sm" variant="ghost" onClick={() => patch('imageUrl', '')}>
                    Remove
                  </Button>
                )}
              </div>
              <Input
                value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                onChange={(e) => patch('imageUrl', e.target.value)}
                placeholder="Or paste an image URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-name">Name *</Label>
              <Input
                id="club-name"
                value={form.name}
                onChange={(e) => patch('name', e.target.value)}
                placeholder="e.g. Padel Edition"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-desc">Short description *</Label>
              <Textarea
                id="club-desc"
                value={form.description}
                onChange={(e) => patch('description', e.target.value)}
                rows={3}
                placeholder="What players should know about this venue…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-maps">Google Maps link</Label>
              <Input
                id="club-maps"
                value={form.mapsUrl}
                onChange={(e) => patch('mapsUrl', e.target.value)}
                placeholder="https://maps.google.com/…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-ig">Instagram</Label>
              <Input
                id="club-ig"
                value={form.instagramUrl}
                onChange={(e) => patch('instagramUrl', e.target.value)}
                placeholder="https://www.instagram.com/…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-courts">Number of courts *</Label>
              <Input
                id="club-courts"
                type="number"
                min={1}
                max={20}
                value={form.courtCount}
                onChange={(e) => setCourtCount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Court names</Label>
              <div className="space-y-2">
                {form.courtNames.map((name, i) => (
                  <Input
                    key={i}
                    value={name}
                    onChange={(e) => {
                      const next = [...form.courtNames];
                      next[i] = e.target.value;
                      patch('courtNames', next);
                    }}
                    placeholder={`Court ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available amenities</Label>
              <div className="space-y-2 rounded-xl border p-3">
                {CLUB_AMENITIES.map((a) => (
                  <label key={a} className="flex items-center gap-2.5 text-sm">
                    <Checkbox
                      checked={form.amenities.includes(a)}
                      onCheckedChange={() => toggleAmenity(a)}
                    />
                    {CLUB_AMENITY_LABELS[a]}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive clubs are hidden when creating games.</p>
              </div>
              <Switch
                checked={form.status === 'active'}
                onCheckedChange={(c) => patch('status', c === true ? 'active' : 'inactive')}
              />
            </div>
          </div>

          <SheetFooter className="mt-6 gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={!valid} onClick={save}>
              {editingId ? 'Save club' : 'Create club'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
