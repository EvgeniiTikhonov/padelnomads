'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, CalendarDays, Trophy, Sparkles, Tag, User, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import { PlayerAvatar } from '@/components/player-avatar';
import { useMockData } from '@/data/provider';

const NAV = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/games', label: 'Games', icon: CalendarDays },
  { href: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/app/benefits', label: 'Benefits', icon: Sparkles },
  { href: '/app/offers', label: 'Offers', icon: Tag },
  { href: '/app/profile', label: 'Profile', icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, notifications } = useMockData();
  const unread = notifications.filter((n) => n.userId === currentUser.id && !n.isRead).length;
  const notificationsActive = pathname.startsWith('/app/notifications');

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/app" aria-label="Padel Nomads home">
            <Logo markClassName="h-6" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <RoleSwitcher tone="dark" />
            <Link
              href="/app/notifications"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              className={cn(
                'relative flex size-9 items-center justify-center rounded-full transition-colors',
                notificationsActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/5 hover:text-white',
              )}
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <Link href="/app/profile" aria-label="Profile">
              <PlayerAvatar
                user={currentUser}
                className="size-8 ring-1 ring-white/15"
                fallbackClassName="bg-primary/15 text-xs"
              />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        <nav className="hidden w-52 shrink-0 md:block">
          <ul className="sticky top-20 space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0d0d0d]/95 backdrop-blur md:hidden">
        <ul className="flex items-stretch justify-around">
          {NAV.map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium',
                  isActive(item.href) ? 'text-primary' : 'text-white/40',
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
