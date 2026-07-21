'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMockData } from '@/data/provider';

// Route guard implementing PRD §17 access rules on top of the mock session.
export function RequireRole({ scope, children }: { scope: 'player' | 'admin'; children: React.ReactNode }) {
  const { session } = useMockData();
  const router = useRouter();

  const allowed =
    scope === 'admin'
      ? session.viewRole === 'admin'
      : session.viewRole === 'player' && session.applicationStatus === 'approved';

  React.useEffect(() => {
    if (allowed) return;
    // Send the session to the right home for its role so that switching roles
    // from within a guarded area lands on the new area instead of /login.
    if (session.viewRole === 'admin') {
      router.replace('/admin');
    } else if (session.viewRole === 'player') {
      router.replace(session.applicationStatus === 'approved' ? '/app' : '/status');
    } else {
      router.replace('/login');
    }
  }, [allowed, scope, session.viewRole, session.applicationStatus, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Redirecting…
      </div>
    );
  }
  return <>{children}</>;
}
