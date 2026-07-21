'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Inbox, CalendarDays, Users, Tag, Trophy,
  MessageCircle, Gauge, BarChart3, Settings, Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useMockData } from '@/data/provider';

// PRD §8.1 admin navigation + stub consoles
const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: Inbox },
  { href: '/admin/games', label: 'Games', icon: CalendarDays },
  { href: '/admin/players', label: 'Players', icon: Users },
  { href: '/admin/offers', label: 'Offers', icon: Tag },
  { href: '/admin/leaderboard', label: 'Leaderboard / Results', icon: Trophy },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle, stub: true },
  { href: '/admin/karma', label: 'Karma', icon: Gauge, stub: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, stub: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { applications } = useMockData();
  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <ul className="space-y-1">
      {NAV.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <item.icon className="size-4" />
            <span className="truncate">{item.label}</span>
            {item.href === '/admin/applications' && pendingCount > 0 && (
              <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingCount}
              </span>
            )}
            {item.stub && (
              <Badge variant="outline" className="ml-auto h-4 px-1 text-[9px] text-muted-foreground">stub</Badge>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-1">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={<Button variant="ghost" size="icon" className="lg:hidden" />}
              >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <SheetHeader className="p-0 pb-4">
                  <SheetTitle><Logo /></SheetTitle>
                </SheetHeader>
                <NavList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link href="/admin" className="flex items-center gap-2">
              <Logo />
              <Badge variant="secondary" className="hidden sm:inline-flex">Admin</Badge>
            </Link>
          </div>
          <RoleSwitcher />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r bg-sidebar lg:block">
          <div className="sticky top-14 p-4">
            <NavList />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
