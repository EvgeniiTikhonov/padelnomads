'use client';

import Link from 'next/link';
import {
  ArrowRight, CalendarDays, Trophy, Tag, Users, ShieldCheck, MapPin,
} from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Curated games, every week',
    text: 'Americanos, King of the Court, socials and mini-tournaments — matched to your level, organized end to end.',
  },
  {
    icon: Trophy,
    title: 'A real leaderboard',
    text: 'Every game feeds the community ranking. Track your points, rank, and progress across formats.',
  },
  {
    icon: Tag,
    title: 'Member-only offers',
    text: 'Court discounts, gear deals, physio and recovery perks from partners across the city.',
  },
  {
    icon: Users,
    title: 'A community that shows up',
    text: 'Curated membership and a karma system that rewards reliability keep every game full and friendly.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/apply">
              <Button size="sm">Apply to Join</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:py-28">
          <Badge variant="secondary" className="mb-5 h-6 gap-1.5 px-3">
            <MapPin className="size-3" /> Dubai&apos;s curated padel community
          </Badge>
          <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Play better padel with people who <span className="text-primary">show up</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Padel Nomads is a members-only community. Curated games for your level,
            a live leaderboard, and partner perks — all organized for you.
          </p>
          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Link href="/apply" className="w-full sm:w-auto">
              <Button size="lg" className="h-12 w-full px-8 text-base">
                Apply to Join <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-12 w-full px-8 text-base">
                Log In
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <span><strong className="text-foreground">300+</strong> members</span>
            <span><strong className="text-foreground">12+</strong> games weekly</span>
            <span><strong className="text-foreground">5</strong> partner venues</span>
          </div>
        </div>
      </section>

      {/* About / features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">What membership gets you</h2>
          <p className="mt-2 text-muted-foreground">Games, benefits and community — built around reliability.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.title} className="rounded-2xl shadow-sm">
              <CardContent className="flex gap-4 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-heading text-2xl font-bold sm:text-3xl">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: 'Apply', text: 'Tell us your level, preferred side, and how to reach you on WhatsApp.' },
              { step: '2', title: 'Get approved', text: 'We curate the community so games stay balanced and reliable.' },
              { step: '3', title: 'Play & climb', text: 'Confirm games in one tap, earn points, and climb the leaderboard.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {s.step}
                </div>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/apply">
              <Button size="lg" className="h-12 px-8 text-base">
                Apply to Join <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center">
        <Logo />
        <p className="max-w-md text-sm text-muted-foreground">
          A closed, curated padel community. Membership by application.
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <InstagramIcon className="size-4" /> @padelnomads
          </a>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" /> Clickable prototype v0.1
          </span>
        </div>
      </footer>
    </div>
  );
}
