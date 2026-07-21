'use client';

import Link from 'next/link';
import { Clock, XCircle, Ban, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import { useMockData } from '@/data/provider';

export default function StatusPage() {
  const { session } = useMockData();
  const status = session.applicationStatus;

  const content = {
    pending: {
      icon: Clock, tone: 'bg-amber-100 text-amber-700',
      title: 'Your application is pending',
      badge: 'Pending review',
      text: 'Thanks for applying to Padel Nomads! Our team reviews every application to keep the community curated. You will get a WhatsApp message as soon as a decision is made — usually within a couple of days.',
    },
    approved: {
      icon: CheckCircle2, tone: 'bg-green-100 text-green-700',
      title: 'You are approved!',
      badge: 'Approved',
      text: 'Welcome to Padel Nomads. Your member area is ready — browse upcoming games and confirm your first spot.',
    },
    rejected: {
      icon: XCircle, tone: 'bg-slate-200 text-slate-600',
      title: 'Application not approved',
      badge: 'Rejected',
      text: 'Unfortunately your application was not approved this time. The community is curated by level and capacity — you are welcome to reapply in the future.',
    },
    banned: {
      icon: Ban, tone: 'bg-red-100 text-red-700',
      title: 'Access denied',
      badge: 'Banned',
      text: 'This account has been banned from the Padel Nomads community and cannot access the platform or reapply. If you believe this is a mistake, contact the admins.',
    },
  }[status];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/"><Logo /></Link>
          <RoleSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-16">
        <Card className="rounded-2xl text-center shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className={`flex size-16 items-center justify-center rounded-full ${content.tone}`}>
              <content.icon className="size-8" />
            </div>
            <Badge className={`border-none ${content.tone}`}>{content.badge}</Badge>
            <h1 className="font-heading text-xl font-bold">{content.title}</h1>
            <p className="text-sm text-muted-foreground">{content.text}</p>
            {status === 'approved' ? (
              <Link href="/app" className="w-full">
                <Button size="lg" className="h-12 w-full">Enter member area</Button>
              </Link>
            ) : (
              <Link href="/" className="w-full">
                <Button variant="outline" size="lg" className="h-12 w-full">Back to home</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
