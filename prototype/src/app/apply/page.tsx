'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, Info, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import { useMockData } from '@/data/provider';
import { LEVELS, LEVEL_LABELS, SIDE_LABELS, GENDER_LABELS } from '@/lib/format';
import type { Level, PreferredSide, Gender, Application } from '@/types';

const REFERRAL_OPTIONS: { value: NonNullable<Application['referralSource']>; label: string }[] = [
  { value: 'friend', label: 'Friend' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'event', label: 'Event' },
];

function ApplyForm() {
  const { submitApplication, setViewRole, setApplicationStatus, playerReferrals, users, phones } = useMockData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refToken = searchParams.get('ref')?.trim() || '';

  const playerReferral = refToken
    ? playerReferrals.find((r) => r.token === refToken && r.status === 'pending')
    : undefined;
  const referrer = playerReferral
    ? users.find((u) => u.id === playerReferral.fromUserId)
    : undefined;
  const referrerPhone = referrer
    ? (phones.find((p) => p.userId === referrer.id && p.isPrimary)?.phoneNumber
      ?? phones.find((p) => p.userId === referrer.id)?.phoneNumber)
    : undefined;

  const fromInvite = Boolean(playerReferral && referrer);

  const [name, setName] = React.useState('');
  const [level, setLevel] = React.useState<Level | null>(null);
  const [side, setSide] = React.useState<PreferredSide | null>(null);
  const [gender, setGender] = React.useState<Gender | null>(null);
  const [referral, setReferral] = React.useState<Application['referralSource'] | null>(null);
  const [friendPhone, setFriendPhone] = React.useState('');
  const [proofName, setProofName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [serviceConsent, setServiceConsent] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!playerReferral) return;
    setName(playerReferral.friendName);
    setPhone(playerReferral.friendPhone);
    setLevel(playerReferral.level);
    setReferral('friend');
    if (referrerPhone) setFriendPhone(referrerPhone);
  }, [playerReferral, referrerPhone]);

  const isFriendReferral = referral === 'friend';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!level) errs.push('Skill level is required.');
    if (!side) errs.push('Preferred side is required.');
    if (!gender) errs.push('Gender is required.');
    if (!fromInvite && !referral) errs.push('Please tell us how you heard about us.');
    if (!phone.trim()) errs.push('Phone number is required.');
    else if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) errs.push('Phone number must be in international E.164 format, e.g. +971501234567.');
    if (friendPhone.trim() && !/^\+[1-9]\d{7,14}$/.test(friendPhone.trim())) {
      errs.push("Friend's phone number must be in international E.164 format, e.g. +971501234567.");
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errs.push('Email address is not valid.');
    if (!serviceConsent) errs.push('WhatsApp service messages consent is required (it enables reminders and confirmations).');
    if (refToken && !playerReferral) {
      errs.push('This referral link is invalid or already used. Apply without a link, or ask your friend for a new invite.');
    }
    setErrors(errs);
    if (errs.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    submitApplication({
      name: name.trim(),
      level: level!, preferredSide: side!,
      gender: gender!,
      referralSource: fromInvite ? 'friend' : referral!,
      referrerPhoneNumber: fromInvite
        ? (referrerPhone ?? (friendPhone.trim() || undefined))
        : (isFriendReferral && friendPhone.trim() ? friendPhone.trim() : undefined),
      referredByUserId: fromInvite ? playerReferral!.fromUserId : undefined,
      playerReferralId: fromInvite ? playerReferral!.id : undefined,
      proofOfSkillFileUrl: proofName || undefined,
      phoneNumber: phone.trim(),
      email: email.trim() || undefined,
      whatsappOptIn: serviceConsent,
      whatsappMarketingOptIn: false,
    });
    setViewRole('player');
    setApplicationStatus('pending');
    router.push('/status');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/"><Logo markClassName="h-6" /></Link>
          <RoleSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to home
        </Link>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Become a Nomad</CardTitle>
            <CardDescription>
              {fromInvite
                ? 'Finish a few details below. Your friend already shared your name, number, and suggested level.'
                : 'Tell us about your padel. We review every application to keep games balanced and reliable.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fromInvite && referrer && (
              <Alert className="mb-5 border-primary/25 bg-primary/[0.06]">
                <Users className="size-4 text-primary" />
                <AlertTitle>Invited by {referrer.name}</AlertTitle>
                <AlertDescription>
                  Friend referrals are prioritized — you have a higher chance of being approved.
                  Organizers will see {referrer.name} as your referrer.
                </AlertDescription>
              </Alert>
            )}
            {refToken && !playerReferral && (
              <Alert variant="destructive" className="mb-5">
                <Info className="size-4" />
                <AlertTitle>Referral link unavailable</AlertTitle>
                <AlertDescription>
                  This invite was already used or revoked. You can still apply below without the referral tag.
                </AlertDescription>
              </Alert>
            )}

            {errors.length > 0 && (
              <Alert variant="destructive" className="mb-5">
                <Info className="size-4" />
                <AlertTitle>Please fix the following</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {errors.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!fromInvite && (
                <>
                  <div className="space-y-2">
                    <Label>How did you hear about us? <span className="text-destructive">*</span></Label>
                    <Select
                      value={referral}
                      onValueChange={(v) => {
                        const next = v as Application['referralSource'];
                        setReferral(next);
                        if (next !== 'friend') setFriendPhone('');
                      }}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERRAL_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isFriendReferral && (
                    <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                      <Label htmlFor="friendPhone">
                        Friend&apos;s phone number <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="friendPhone"
                        type="tel"
                        inputMode="tel"
                        value={friendPhone}
                        onChange={(e) => setFriendPhone(e.target.value)}
                        placeholder="+971 50 123 4567"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sharing your friend&apos;s number will increase your chances of being approved to the community.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-11"
                  readOnly={fromInvite}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Skill level <span className="text-destructive">*</span></Label>
                  <Select value={level ?? undefined} onValueChange={(v) => setLevel(v as Level)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fromInvite && (
                    <p className="text-xs text-muted-foreground">Suggested by your friend — change if needed.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Preferred side <span className="text-destructive">*</span></Label>
                  <Select value={side ?? undefined} onValueChange={(v) => setSide(v as PreferredSide)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SIDE_LABELS) as PreferredSide[]).map((s) => (
                        <SelectItem key={s} value={s}>{SIDE_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender <span className="text-destructive">*</span></Label>
                <Select value={gender ?? undefined} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
                      <SelectItem key={g} value={g}>{GENDER_LABELS[g]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof">Proof of skill <span className="text-muted-foreground">(optional — JPEG, PNG, WebP, PDF)</span></Label>
                <label
                  htmlFor="proof"
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <Upload className="size-4 shrink-0" />
                  {proofName || 'Upload proof of skill'}
                </label>
                <input
                  id="proof" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="sr-only"
                  onChange={(e) => setProofName(e.target.files?.[0]?.name ?? '')}
                />
                <p className="text-xs text-muted-foreground">
                  We accept screenshots from club apps, WhatsApp groups of clubs with your level specified,
                  or a screenshot of your Playtomic / WeCourts profile.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone" type="tel" inputMode="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)} placeholder="+971 50 123 4567" className="h-11"
                    readOnly={fromInvite}
                  />
                  <p className="text-xs text-muted-foreground">International format — this is your WhatsApp identifier.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-muted/60 p-4">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={serviceConsent}
                    onCheckedChange={(c) => setServiceConsent(c === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    <strong>WhatsApp service messages</strong> <span className="text-destructive">*</span>
                    <br />
                    <span className="text-muted-foreground">
                      I consent to receive game-related WhatsApp messages (reminders, confirmations, announcements).
                    </span>
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Meta policy requires opt-in before we can send you business-initiated WhatsApp messages.
                  Consent is recorded with a timestamp, and you can opt out at any time (e.g. by replying STOP).
                </p>
              </div>

              <Button type="submit" size="lg" className="h-12 w-full text-base">
                Submit application
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading application…
      </div>
    }>
      <ApplyForm />
    </React.Suspense>
  );
}
