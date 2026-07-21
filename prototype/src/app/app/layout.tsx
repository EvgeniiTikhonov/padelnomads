'use client';

import { RequireRole } from '@/components/require-role';
import { AppShell } from '@/components/app-shell';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole scope="player">
      <AppShell>{children}</AppShell>
    </RequireRole>
  );
}
