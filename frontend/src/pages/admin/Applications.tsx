import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { actions, useStore, type Application, type ApplicationStatus } from '@/lib/store';
import { PageHeader, Card, Badge, EmptyState, Modal } from '@/components/ui';
import { formatLongDate } from '@/lib/format';

type Tab = 'pending' | 'approved' | 'rejected';

export default function AdminApplications() {
  const { user } = useAuth();
  const apps = useStore((s) => s.applications);
  const [tab, setTab] = useState<Tab>('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Application | null>(null);

  const filtered = useMemo(() => {
    return apps
      .filter((a) => a.status === tab)
      .filter((a) =>
        query
          ? `${a.name} ${a.phoneNumber} ${a.email ?? ''} ${a.level}`
              .toLowerCase()
              .includes(query.toLowerCase())
          : true,
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [apps, tab, query]);

  const counts: Record<Tab, number> = {
    pending: apps.filter((a) => a.status === 'pending').length,
    approved: apps.filter((a) => a.status === 'approved').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
  };

  const approve = (id: string) => {
    actions.approveApplication(id, user!.id);
    setSelected(null);
  };
  const reject = (id: string) => {
    actions.rejectApplication(id, user!.id);
    setSelected(null);
  };

  return (
    <div>
      <PageHeader title="Applications" subtitle="Review and manage requests to join the community." />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 border-b border-brand-black/10">
          {(['pending', 'approved', 'rejected'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wide capitalize transition-colors ${
                tab === t
                  ? 'border-brand-black text-brand-black'
                  : 'border-transparent text-brand-black/45 hover:text-brand-black'
              }`}
            >
              {t} ({counts[t]})
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, level…"
          className="form-control sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={`No ${tab} applications`} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-brand-black/10 text-left font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
                <Th>Applicant</Th>
                <Th>Level</Th>
                <Th>Side</Th>
                <Th>Source</Th>
                <Th>Submitted</Th>
                <Th>Proof</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-black/10">
              {filtered.map((a) => (
                <tr key={a.id} className="font-body text-sm">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-black">{a.name}</p>
                    <p className="text-xs text-brand-black/50">{a.phoneNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-black/80">{a.level}</td>
                  <td className="px-4 py-3 text-brand-black/80">{a.preferredSide}</td>
                  <td className="px-4 py-3 text-brand-black/60">{a.referralSource ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-black/60">{formatLongDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    {a.proofOfSkillFileUrl ? <Badge tone="muted">File</Badge> : <span className="text-brand-black/30">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(a)}
                      className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/70 hover:text-brand-black"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ApplicationModal
        application={selected}
        onClose={() => setSelected(null)}
        onApprove={approve}
        onReject={reject}
      />
    </div>
  );
}

function ApplicationModal({
  application,
  onClose,
  onApprove,
  onReject,
}: {
  application: Application | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (!application) return null;
  const a = application;
  const statusTone: Record<ApplicationStatus, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return (
    <Modal open={!!application} onClose={onClose} title={a.name}>
      <div className="flex items-center justify-between">
        <span className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
          Application
        </span>
        <Badge tone={statusTone[a.status]}>{a.status}</Badge>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 font-body text-sm">
        <Row label="Phone" value={a.phoneNumber} />
        <Row label="Email" value={a.email ?? '—'} />
        <Row label="Skill level" value={a.level} />
        <Row label="Preferred side" value={a.preferredSide} />
        <Row label="Gender" value={a.gender ?? '—'} />
        <Row label="Referral" value={a.referralSource ?? '—'} />
        <Row label="Submitted" value={formatLongDate(a.createdAt)} />
        <Row label="Proof of skill" value={a.proofOfSkillFileUrl ?? 'Not provided'} />
      </dl>

      {a.proofOfSkillFileUrl && (
        <div className="mt-4">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black underline"
          >
            View proof file ({a.proofOfSkillFileUrl})
          </a>
        </div>
      )}

      {a.status === 'pending' && (
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={() => onReject(a.id)} className="btn-secondary !px-6 !py-3 !text-xs">
            Reject
          </button>
          <button onClick={() => onApprove(a.id)} className="btn-primary !px-6 !py-3 !text-xs">
            Approve
          </button>
        </div>
      )}
    </Modal>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-brand-black/90">{value}</dd>
    </div>
  );
}
