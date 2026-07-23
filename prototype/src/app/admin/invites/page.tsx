'use client';

import * as React from 'react';
import {
  UserPlus, MessageCircle, Copy, Search, ShieldCheck, Ban, Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMockData } from '@/data/provider';
import {
  LEVELS, LEVEL_LABELS, SIDE_LABELS, GENDER_LABELS, formatDateTime,
  communityInviteClaimUrl,
} from '@/lib/format';
import type { CommunityInviteStatus, Gender, Level, PreferredSide } from '@/types';

const STATUS_TONE: Record<CommunityInviteStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  claimed: 'bg-primary/15 text-primary',
  revoked: 'bg-white/10 text-white/50',
};

export default function AdminInvitesPage() {
  const {
    users, communityInvites,
    createCommunityInvite, resendCommunityInviteWhatsApp, revokeCommunityInvite,
  } = useMockData();

  const nomads = users
    .filter((u) => u.role === 'player' && u.status === 'approved')
    .sort((a, b) => a.name.localeCompare(b.name));

  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('+971');
  const [email, setEmail] = React.useState('');
  const [level, setLevel] = React.useState<Level>('C');
  const [levelVerified, setLevelVerified] = React.useState(false);
  const [side, setSide] = React.useState<PreferredSide>('both');
  const [gender, setGender] = React.useState<Gender | ''>('male');
  const [referredBy, setReferredBy] = React.useState(nomads[0]?.id ?? 'u1');
  const [referrerQuery, setReferrerQuery] = React.useState('');
  const [tab, setTab] = React.useState<'pending' | 'claimed' | 'all'>('pending');

  const filteredReferrers = nomads.filter((u) =>
    !referrerQuery.trim()
    || u.name.toLowerCase().includes(referrerQuery.trim().toLowerCase()));

  const invites = communityInvites
    .filter((i) => tab === 'all' || i.status === tab || (tab === 'pending' && i.status === 'pending'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const resetForm = () => {
    setName('');
    setPhone('+971');
    setEmail('');
    setLevel('C');
    setLevelVerified(false);
    setSide('both');
    setGender('male');
  };

  const submit = (openWhatsApp: boolean) => {
    const invite = createCommunityInvite({
      name,
      phoneNumber: phone,
      email: email.trim() || undefined,
      level,
      levelVerified,
      preferredSide: side,
      gender: gender || undefined,
      referredByUserId: referredBy,
      openWhatsApp,
    });
    if (invite) resetForm();
  };

  const copyLink = async (token: string) => {
    const url = communityInviteClaimUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Claim link copied');
    } catch {
      toast.message('Claim link', { description: url });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Invite friends</h1>
        <p className="text-sm text-muted-foreground">
          Preset a profile (level ± verification + referring Nomad), then send a WhatsApp invite.
          The claim link joins them as approved — no application review.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <UserPlus className="size-4 text-primary" />
              New invite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-name">Name</Label>
              <Input id="inv-name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="Friend’s full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-phone">WhatsApp number</Label>
              <Input id="inv-phone" type="tel" className="h-11 font-mono" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9715…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-email">Email (optional)</Label>
              <Input id="inv-email" type="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={level} onValueChange={(v) => { if (v) setLevel(v as Level); }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preferred side</Label>
                <Select value={side} onValueChange={(v) => { if (v) setSide(v as PreferredSide); }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SIDE_LABELS) as PreferredSide[]).map((s) => (
                      <SelectItem key={s} value={s}>{SIDE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <Checkbox
                id="inv-verified"
                checked={levelVerified}
                onCheckedChange={(c) => setLevelVerified(c === true)}
              />
              <div>
                <Label htmlFor="inv-verified" className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="size-3.5 text-sky-400" />
                  Mark level as verified
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use when you’ve confirmed their level (e.g. known player). Optional.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender || 'none'} onValueChange={(v) => setGender(!v || v === 'none' ? '' : v as Gender)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
                    <SelectItem key={g} value={g}>{GENDER_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referred by (Nomad)</Label>
              <Input
                className="h-9"
                placeholder="Search members…"
                value={referrerQuery}
                onChange={(e) => setReferrerQuery(e.target.value)}
              />
              <Select value={referredBy} onValueChange={(v) => { if (v) setReferredBy(v); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {filteredReferrers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} · {LEVEL_LABELS[u.level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The community member who recommended this friend.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button className="flex-1" onClick={() => submit(true)}>
                <MessageCircle className="size-3.5" />
                Create &amp; open WhatsApp
              </Button>
              <Button variant="outline" onClick={() => submit(false)}>
                Create only
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="claimed">Claimed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Search className="size-3" />
              {invites.length} invite{invites.length === 1 ? '' : 's'}
            </p>
          </div>

          {invites.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
              No invites in this filter yet.
            </div>
          ) : (
            <Card className="rounded-2xl py-0 shadow-sm">
              <CardContent className="divide-y p-0">
                {invites.map((inv) => {
                  const referrer = users.find((u) => u.id === inv.referredByUserId);
                  return (
                    <div key={inv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{inv.name}</p>
                          <Badge className={STATUS_TONE[inv.status]}>{inv.status}</Badge>
                          {inv.levelVerified && (
                            <Badge variant="secondary" className="gap-1">
                              <ShieldCheck className="size-3 text-sky-400" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">{inv.phoneNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {LEVEL_LABELS[inv.level]} · side {SIDE_LABELS[inv.preferredSide]}
                          {inv.gender ? ` · ${GENDER_LABELS[inv.gender]}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Referred by <span className="text-foreground/80">{referrer?.name ?? '—'}</span>
                          {' · '}
                          {formatDateTime(inv.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {inv.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => resendCommunityInviteWhatsApp(inv.id)}>
                              <MessageCircle className="size-3.5" />
                              WhatsApp
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)}>
                              <Copy className="size-3.5" />
                              Copy link
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revokeCommunityInvite(inv.id)}>
                              <Ban className="size-3.5" />
                              Revoke
                            </Button>
                          </>
                        )}
                        {inv.status === 'claimed' && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Link2 className="size-3" />
                            Joined {inv.claimedAt ? formatDateTime(inv.claimedAt) : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
