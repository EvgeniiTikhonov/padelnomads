'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, FileText, Link2, AlertTriangle, Check, X, MessageCircle, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useMockData } from '@/data/provider';
import { LEVEL_LABELS, SIDE_LABELS, GENDER_LABELS, formatDateTime } from '@/lib/format';
import type { Application, ApplicationStatus } from '@/types';

const STATUS_TONE: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  approved: 'bg-primary/15 text-primary',
  rejected: 'bg-white/10 text-white/60',
};

function ApplicationsPageContent() {
  const { applications, users, approveApplication, rejectApplication, setApplicationStatusAdmin } = useMockData();
  const searchParams = useSearchParams();
  const focusApplicationId = searchParams.get('application');
  const [tab, setTab] = React.useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(focusApplicationId);
  const [overrideOpen, setOverrideOpen] = React.useState(false);
  const [overrideReason, setOverrideReason] = React.useState('');
  const [proofOpen, setProofOpen] = React.useState(false);

  React.useEffect(() => {
    if (!focusApplicationId) return;
    const app = applications.find((a) => a.id === focusApplicationId);
    if (!app) return;
    setSelectedId(focusApplicationId);
    if (app.status === 'pending' || app.status === 'approved' || app.status === 'rejected') {
      setTab(app.status);
    }
  }, [focusApplicationId, applications]);

  const selected = applications.find((a) => a.id === selectedId) ?? null;
  const matchedUser = selected?.matchedExistingUserId
    ? users.find((u) => u.id === selected.matchedExistingUserId)
    : undefined;
  const referredBy = selected?.referredByUserId
    ? users.find((u) => u.id === selected.referredByUserId)
    : undefined;

  const filtered = applications
    .filter((a) => tab === 'all' || a.status === tab)
    .filter((a) => {
      const q = query.toLowerCase();
      return !q || a.name?.toLowerCase().includes(q) || a.phoneNumber.includes(q) || a.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleApprove = (app: Application) => {
    if (app.blacklistFlag) {
      setOverrideOpen(true);
      return;
    }
    approveApplication(app.id);
    setSelectedId(null);
  };

  const confirmOverride = () => {
    if (!selected || !overrideReason.trim()) return;
    approveApplication(selected.id, overrideReason.trim());
    setOverrideOpen(false);
    setOverrideReason('');
    setSelectedId(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Applications</h1>
        <p className="text-sm text-muted-foreground">Review and approve new members. Identity-match and blacklist checks run automatically.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({applications.filter((a) => a.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, phone, email…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
      </div>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardContent className="divide-y p-0">
          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">No applications match.</p>
          )}
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {a.name ?? 'Unnamed applicant'}
                  {a.referredByUserId && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="size-3" />
                      Referral
                      {(() => {
                        const who = users.find((u) => u.id === a.referredByUserId);
                        return who ? ` · ${who.name}` : '';
                      })()}
                    </Badge>
                  )}
                  {a.matchedExistingUserId && (
                    <Badge variant="secondary" className="gap-1"><Link2 className="size-3" /> Identity match</Badge>
                  )}
                  {a.blacklistFlag && (
                    <Badge variant="destructive" className="gap-1"><AlertTriangle className="size-3" /> Blacklist</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.phoneNumber}{a.email ? ` · ${a.email}` : ''} · {LEVEL_LABELS[a.level]} · {SIDE_LABELS[a.preferredSide]}
                  {a.proofOfSkillFileUrl ? ' · 📎 proof' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
                <Badge className={`border-none capitalize ${STATUS_TONE[a.status]}`}>{a.status}</Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="p-0">
                <SheetTitle className="font-heading text-lg">{selected.name ?? 'Unnamed applicant'}</SheetTitle>
                <SheetDescription>Submitted {formatDateTime(selected.createdAt)}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                {selected.blacklistFlag && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      <strong>Blacklist match.</strong> This phone/email matches a ban record. Approval requires an explicit override with a logged reason.
                    </span>
                  </div>
                )}
                {matchedUser && (
                  <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <Link2 className="mt-0.5 size-4 shrink-0" />
                    <span>
                      <strong>Identity match:</strong> phone matches existing profile <strong>{matchedUser.name}</strong> ({matchedUser.status}).
                      Approving links/claims that profile with history intact.
                    </span>
                  </div>
                )}
                {referredBy && (
                  <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/[0.08] p-3 text-sm">
                    <Users className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <strong>Player referral</strong> from{' '}
                      <strong>{referredBy.name}</strong>
                      {selected.referrerPhoneNumber ? (
                        <> · <span className="font-mono text-xs">{selected.referrerPhoneNumber}</span></>
                      ) : null}
                      . Preferential review — friend of a Nomad (higher approval priority).
                      Approving awards the referrer +20 karma.
                    </span>
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="font-mono">{selected.phoneNumber}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Email</dt><dd>{selected.email ?? '—'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Skill level</dt><dd>{LEVEL_LABELS[selected.level]}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Preferred side</dt><dd>{SIDE_LABELS[selected.preferredSide]}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Gender</dt><dd>{selected.gender ? GENDER_LABELS[selected.gender] : '—'}</dd></div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Referral</dt>
                    <dd className="capitalize">
                      {referredBy
                        ? `Friend · ${referredBy.name}`
                        : (selected.referralSource ?? '—')}
                    </dd>
                  </div>
                  {selected.referralSource === 'friend' && !referredBy && (
                    <div><dt className="text-xs text-muted-foreground">Friend&apos;s phone</dt><dd className="font-mono">{selected.referrerPhoneNumber ?? '—'}</dd></div>
                  )}
                  {referredBy && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Referred by</dt>
                      <dd>{referredBy.name}</dd>
                    </div>
                  )}
                  <div><dt className="text-xs text-muted-foreground">Terms &amp; Privacy</dt><dd>{selected.termsAndPrivacyAcceptedAt ? `✅ ${selected.termsAndPrivacyVersion ?? 'accepted'}` : '❌ No'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Service consent</dt><dd>{selected.whatsappOptIn ? '✅ Yes' : '❌ No'}</dd></div>
                  {selected.reviewedAt && (
                    <div className="col-span-2"><dt className="text-xs text-muted-foreground">Reviewed</dt><dd>{formatDateTime(selected.reviewedAt)} by admin</dd></div>
                  )}
                </dl>

                {selected.proofOfSkillFileUrl && (
                  <Button variant="outline" className="w-full" onClick={() => setProofOpen(true)}>
                    <FileText className="size-4" /> View proof of skill · {selected.proofOfSkillFileUrl}
                  </Button>
                )}

                {selected.status === 'pending' ? (
                  <div className="space-y-2 border-t pt-4">
                    <Button className="h-11 w-full" onClick={() => handleApprove(selected)}>
                      <Check className="size-4" /> Approve
                      <MessageCircle className="size-3.5 opacity-60" />
                    </Button>
                    <Button variant="outline" className="h-11 w-full" onClick={() => { rejectApplication(selected.id); setSelectedId(null); }}>
                      <X className="size-4" /> Reject
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">Approval sends a WhatsApp welcome (simulated).</p>
                  </div>
                ) : (
                  <div className="space-y-2 border-t pt-4">
                    <Label>Change status</Label>
                    <Select
                      value={selected.status}
                      onValueChange={(v) => { if (v) setApplicationStatusAdmin(selected.id, v as ApplicationStatus); }}
                    >
                      <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {matchedUser && selected.status === 'pending' && (
                  <Button variant="ghost" className="w-full text-primary" onClick={() => toast.success('Application linked to existing profile', { description: `${matchedUser.name} will claim this profile on approval.` })}>
                    <Link2 className="size-4" /> Link to existing profile
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Blacklist override dialog (PRD §9.3) */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" /> Blacklist override required
            </DialogTitle>
            <DialogDescription>
              This application matches the blacklist. Approving it requires an explicit override with a
              reason, which is written to the ban audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="override">Override reason (logged)</Label>
            <Textarea id="override" placeholder="e.g. Ban expired; spoke with player; second chance approved by committee" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={!overrideReason.trim()} onClick={confirmOverride}>
              Override &amp; approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof placeholder */}
      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proof of skill</DialogTitle>
            <DialogDescription>{selected?.proofOfSkillFileUrl}</DialogDescription>
          </DialogHeader>
          <div className="flex h-56 items-center justify-center rounded-xl border border-dashed bg-muted/50 text-sm text-muted-foreground">
            <span className="flex flex-col items-center gap-2">
              <FileText className="size-8" />
              File preview placeholder (prototype)
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading applications…</div>}>
      <ApplicationsPageContent />
    </React.Suspense>
  );
}
