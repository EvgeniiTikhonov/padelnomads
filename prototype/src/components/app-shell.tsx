'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, CalendarDays, Trophy, Sparkles, Tag, User, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMockData } from '@/data/provider';
import { initials } from '@/lib/format';

// PRD §7.1 — the seven player navigation items
const NAV = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/games', label: 'Games', icon: CalendarDays },
  { href: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/app/benefits', label: 'Benefits', icon: Sparkles },
  { href: '/app/offers', label: 'Offers', icon: Tag },
  { href: '/app/profile', label: 'Profile', icon: User },
  { href: '/app/notifications', label: 'Alerts', icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, notifications } = useMockData();
  const unread = notifications.filter((n) => n.userId === currentUser.id && !n.isRead).length;

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/app"><Logo /></Link>
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <Link href="/app/profile">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        {/* Desktop sidebar */}
        <nav className="hidden w-52 shrink-0 md:block">
          <ul className="sticky top-20 space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label === 'Alerts' ? 'Notifications' : item.label}
                  {item.label === 'Alerts' && unread > 0 && (
                    <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
        <ul className="flex items-stretch justify-around">
          {NAV.map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium',
                  isActive(item.href) ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="size-5" />
                {item.label}
                {item.label === 'Alerts' && unread > 0 && (
                  <span className="absolute top-1 right-1/2 -mr-4 size-2 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
