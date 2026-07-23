'use client';

import { useRouter } from 'next/navigation';
import { FlaskConical, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMockData } from '@/data/provider';
import type { MockSession, ViewRole } from '@/types';

interface Preset {
  key: string;
  label: string;
  role: ViewRole;
  appStatus: MockSession['applicationStatus'];
  href: string;
}

const PRESETS: Preset[] = [
  { key: 'visitor', label: 'Visitor (public)', role: 'visitor', appStatus: 'approved', href: '/' },
  { key: 'player', label: 'Player — Approved', role: 'player', appStatus: 'approved', href: '/app' },
  { key: 'pending', label: 'Player — Pending', role: 'player', appStatus: 'pending', href: '/status' },
  { key: 'rejected', label: 'Player — Rejected', role: 'player', appStatus: 'rejected', href: '/status' },
  { key: 'banned', label: 'Player — Banned', role: 'player', appStatus: 'banned', href: '/status' },
  { key: 'admin', label: 'Admin', role: 'admin', appStatus: 'approved', href: '/admin' },
];

/** Demo players useful for pair-invite / multi-account flows. */
const DEMO_PLAYERS = [
  { id: 'u1', label: 'Alex Ivanov' },
  { id: 'u6', label: 'Laura Sanchez' },
  { id: 'u10', label: 'Anna Kowalska' },
  { id: 'u2', label: 'Sofia Petrova' },
];

export function RoleSwitcher({ tone = 'dark' }: { tone?: 'light' | 'dark' }) {
  const { session, setViewRole, setApplicationStatus, setCurrentUserId, currentUser, users } = useMockData();
  const router = useRouter();

  const active = PRESETS.find(
    (p) => p.role === session.viewRole && (p.role !== 'player' || p.appStatus === session.applicationStatus),
  ) ?? PRESETS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={
              tone === 'dark'
                ? 'gap-1.5 border-white/20 bg-white/5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white'
                : 'gap-1.5 border-dashed text-xs font-medium'
            }
          />
        }
      >
        <FlaskConical className={tone === 'dark' ? 'size-3.5 text-[#c6e03a]' : 'size-3.5 text-primary'} />
        <span className="hidden lg:inline">View as</span>
        <span className="font-semibold">{active.label.split('—')[0].trim()}</span>
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Prototype role switcher</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {PRESETS.map((p) => (
          <DropdownMenuItem
            key={p.key}
            onClick={() => {
              setViewRole(p.role);
              setApplicationStatus(p.appStatus);
              if (p.role === 'admin') setCurrentUserId('admin1');
              else if (p.role === 'player' && p.appStatus === 'approved') setCurrentUserId('u1');
              router.push(p.href);
            }}
            className={p.key === active.key ? 'bg-accent' : undefined}
          >
            {p.label}
            {p.key === 'player' && (
              <span className="ml-auto text-xs text-muted-foreground">{currentUser.name.split(' ')[0]}</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Impersonate player</DropdownMenuLabel>
        </DropdownMenuGroup>
        {DEMO_PLAYERS.map((p) => {
          const u = users.find((x) => x.id === p.id);
          if (!u) return null;
          return (
            <DropdownMenuItem
              key={p.id}
              onClick={() => {
                setCurrentUserId(p.id);
                setViewRole('player');
                setApplicationStatus('approved');
              }}
              className={session.currentUserId === p.id ? 'bg-accent' : undefined}
            >
              {p.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Replaces real auth for this clickable demo.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
