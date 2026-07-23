'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, MessageCircle, UserPlus, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMockData } from '@/data/provider';
import {
  LEVELS, LEVEL_LABELS, formatDateTime,
  playerReferralApplyUrl, playerReferralWhatsAppMessage,
} from '@/lib/format';
import type { Level, PlayerReferralStatus } from '@/types';

const STATUS_TONE: Record<PlayerReferralStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  applied: 'bg-primary/15 text-primary',
  revoked: 'bg-white/10 text-white/50',
};

export default function PlayerReferralsPage() {
  const {
    currentUser, playerReferrals,
    createPlayerReferral, resendPlayerReferralWhatsApp, revokePlayerReferral,
  } = useMockData();

  const mine = playerReferrals
    .filter((r) => r.fromUserId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const [friendName, setFriendName] = React.useState('');
  const [friendPhone, setFriendPhone] = React.useState('+971');
  const [level, setLevel] = React.useState<Level>('C');
  const [tab, setTab] = React.useState<'pending' | 'applied' | 'all'>('pending');

  const listed = mine.filter((r) => tab === 'all' || r.status === tab);

  const reset = () => {
    setFriendName('');
    setFriendPhone('+971');
    setLevel('C');
  };

  const submit = (openWhatsApp: boolean) => {
    const created = createPlayerReferral({
      friendName,
      friendPhone,
      level,
      openWhatsApp,
    });
    if (created) reset();
  };

  const copyLink = async (token: string) => {
    const url = playerReferralApplyUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Application link copied');
    } catch {
      toast.message('Application link', { description: url });
    }
  };

  const copyMessage = async (r: (typeof mine)[number]) => {
    const text = playerReferralWhatsAppMessage({
      friendName: r.friendName,
      referrerName: currentUser.name,
      levelLabel: LEVEL_LABELS[r.level],
      applyUrl: playerReferralApplyUrl(r.token),
    });
    try {
      await navigator.clipboard.writeText(text);
      toast.success('WhatsApp text copied');
    } catch {
      toast.message('WhatsApp text', { description: text });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/profile" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Profile
        </Link>
        <h1 className="font-heading text-2xl font-bold">Invite a friend</h1>
        <p className="text-sm text-muted-foreground">
          Share a WhatsApp invite with their name, number, and suggested level.
          Friend referrals have a much higher chance of being approved — and when they join, you earn <span className="text-foreground/90">+20 karma</span>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <UserPlus className="size-4 text-primary" />
              New referral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ref-name">Friend’s name</Label>
              <Input
                id="ref-name"
                className="h-11"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref-phone">WhatsApp number</Label>
              <Input
                id="ref-phone"
                type="tel"
                className="h-11 font-mono"
                value={friendPhone}
                onChange={(e) => setFriendPhone(e.target.value)}
                placeholder="+9715…"
              />
            </div>
            <div className="space-y-2">
              <Label>Suggested level</Label>
              <Select value={level} onValueChange={(v) => { if (v) setLevel(v as Level); }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Your estimate — they can keep or adjust it on the application form.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => submit(true)}>
                <MessageCircle className="size-3.5" />
                Create &amp; open WhatsApp
              </Button>
              <Button variant="outline" onClick={() => submit(false)}>
                Create only
              </Button>
            </div>
            <p className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3 text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground/90">Why refer?</strong> Friends you invite are prioritized in review
              (higher approval odds). When they’re approved, you get <strong className="text-foreground/90">+20 karma</strong>.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="applied">Applied</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {listed.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-14 text-center text-sm text-muted-foreground">
              No referrals here yet.
            </div>
          ) : (
            <Card className="rounded-2xl py-0 shadow-sm">
              <CardContent className="divide-y p-0">
                {listed.map((r) => (
                  <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{r.friendName}</p>
                        <Badge className={STATUS_TONE[r.status]}>{r.status}</Badge>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">{r.friendPhone}</p>
                      <p className="text-sm text-muted-foreground">
                        Suggested {LEVEL_LABELS[r.level]} · {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => resendPlayerReferralWhatsApp(r.id)}>
                          <MessageCircle className="size-3.5" />
                          WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => copyLink(r.token)}>
                          <Copy className="size-3.5" />
                          Link
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => copyMessage(r)}>
                          <Copy className="size-3.5" />
                          Text
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revokePlayerReferral(r.id)}>
                          <Ban className="size-3.5" />
                          Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
