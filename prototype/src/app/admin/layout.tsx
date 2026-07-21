'use client';

import { RequireRole } from '@/components/require-role';
import { AdminShell } from '@/components/admin-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole scope="admin">
      <AdminShell>{children}</AdminShell>
    </RequireRole>
  );
}
