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

export function RoleSwitcher() {
  const { session, setViewRole, setApplicationStatus, currentUser } = useMockData();
  const router = useRouter();

  const active = PRESETS.find(
    (p) => p.role === session.viewRole && (p.role !== 'player' || p.appStatus === session.applicationStatus),
  ) ?? PRESETS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 border-dashed text-xs font-medium" />
        }
      >
        <FlaskConical className="size-3.5 text-primary" />
        <span className="hidden sm:inline">Prototype: view as…</span>
        <span className="font-semibold">{active.label}</span>
        <ChevronDown className="size-3" />
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
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Replaces real auth for this clickable demo.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
