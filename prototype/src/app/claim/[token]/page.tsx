'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import { VerifiedBadge } from '@/components/badges';
import { useMockData } from '@/data/provider';
import { LEVEL_LABELS, SIDE_LABELS, GENDER_LABELS } from '@/lib/format';

export default function ClaimInvitePage() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : Array.isArray(params.token) ? params.token[0] : '';
  const router = useRouter();
  const { communityInvites, users, claimCommunityInvite } = useMockData();

  const invite = communityInvites.find((i) => i.token === token);
  const referrer = invite ? users.find((u) => u.id === invite.referredByUserId) : undefined;
  const [consent, setConsent] = React.useState(true);

  const join = () => {
    if (!invite) return;
    const ok = claimCommunityInvite(invite.token, { whatsappOptIn: consent });
    if (ok) router.push('/app');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/"><Logo markClassName="h-6" /></Link>
          <RoleSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-10">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Home
        </Link>

        {!invite ? (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Invite not found</CardTitle>
              <CardDescription>
                This link is invalid or expired. Ask the Nomad who invited you for a new one, or{' '}
                <Link href="/apply" className="text-primary underline-offset-2 hover:underline">apply here</Link>.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : invite.status === 'revoked' ? (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Invite revoked</CardTitle>
              <CardDescription>
                This invite is no longer active. Contact Padel Nomads or{' '}
                <Link href="/apply" className="text-primary underline-offset-2 hover:underline">submit an application</Link>.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : invite.status === 'claimed' ? (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-xl">
                <CheckCircle2 className="size-5 text-primary" />
                Already joined
              </CardTitle>
              <CardDescription>
                This invite was already claimed. You can{' '}
                <Link href="/login" className="text-primary underline-offset-2 hover:underline">log in</Link>
                {' '}to the member area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push('/login')}>Go to login</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl">You’re invited</CardTitle>
              <CardDescription>
                {referrer
                  ? `${referrer.name} recommended you for Padel Nomads. Confirm below to join — no application review.`
                  : 'Your profile was preset by Padel Nomads. Confirm below to join — no application review.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-heading text-lg font-semibold">{invite.name}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="gap-1">
                    {LEVEL_LABELS[invite.level]}
                    {invite.levelVerified && <VerifiedBadge className="size-3.5" />}
                  </Badge>
                  <Badge variant="outline">Side: {SIDE_LABELS[invite.preferredSide]}</Badge>
                  {invite.gender && (
                    <Badge variant="outline">{GENDER_LABELS[invite.gender]}</Badge>
                  )}
                  {invite.levelVerified && (
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="size-3 text-sky-400" />
                      Level verified
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="font-mono text-sm">{invite.phoneNumber}</p>
                </div>
                {referrer && (
                  <div>
                    <p className="text-xs text-muted-foreground">Referred by</p>
                    <p className="text-sm font-medium">{referrer.name}</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="claim-consent"
                  checked={consent}
                  onCheckedChange={(c) => setConsent(c === true)}
                />
                <Label htmlFor="claim-consent" className="text-sm font-normal leading-snug text-muted-foreground">
                  I agree to receive game reminders and confirmations on WhatsApp.
                </Label>
              </div>

              <Button
                size="lg"
                className="h-12 w-full text-base"
                disabled={!consent}
                onClick={join}
              >
                <UserPlus className="size-4" />
                Join Padel Nomads
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Prefer the normal path?{' '}
                <Link href="/apply" className="text-primary underline-offset-2 hover:underline">Apply instead</Link>
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
