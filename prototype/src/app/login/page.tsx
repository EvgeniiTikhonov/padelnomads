'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogIn, UserRound, Clock, XCircle, Ban, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import { useMockData } from '@/data/provider';
import type { MockSession } from '@/types';

const OUTCOMES: {
  key: string; label: string; description: string; icon: React.ElementType;
  role: 'player' | 'admin'; appStatus: MockSession['applicationStatus']; href: string;
}[] = [
  { key: 'approved', label: 'Approved player', description: 'Full member area', icon: UserRound, role: 'player', appStatus: 'approved', href: '/app' },
  { key: 'pending', label: 'Pending applicant', description: 'Application status screen', icon: Clock, role: 'player', appStatus: 'pending', href: '/status' },
  { key: 'rejected', label: 'Rejected applicant', description: 'Access denied', icon: XCircle, role: 'player', appStatus: 'rejected', href: '/status' },
  { key: 'banned', label: 'Banned user', description: 'Login denied', icon: Ban, role: 'player', appStatus: 'banned', href: '/status' },
  { key: 'admin', label: 'Admin', description: 'Admin dashboard', icon: ShieldCheck, role: 'admin', appStatus: 'approved', href: '/admin' },
];

export default function LoginPage() {
  const { setViewRole, setApplicationStatus } = useMockData();
  const router = useRouter();
  const [phone, setPhone] = React.useState('');

  const loginAs = (o: (typeof OUTCOMES)[number]) => {
    setViewRole(o.role);
    setApplicationStatus(o.appStatus);
    router.push(o.href);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/"><Logo /></Link>
          <RoleSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-10">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to home
        </Link>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Log in</CardTitle>
            <CardDescription>
              In the real product this is a phone OTP flow (verified via WhatsApp).
              For this prototype, pick a login outcome below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone" type="tel" placeholder="+971 50 123 4567" className="h-11"
                value={phone} onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-12 w-full text-base" onClick={() => loginAs(OUTCOMES[0])}>
              <LogIn className="size-4" /> Continue with WhatsApp OTP
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">prototype: log in as…</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.key}
                  onClick={() => loginAs(o)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <o.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">{o.description}</span>
                  </span>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              New here? <Link href="/apply" className="font-medium text-primary hover:underline">Apply to join</Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
