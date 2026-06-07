import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { Badge, Card } from '@/components/ui';
import Logo from '@/components/Logo';
import { formatLongDate } from '@/lib/format';

export default function Status() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const application = useStore((s) =>
    s.applications.find((a) => a.userId === user?.id) ?? null,
  );

  if (!user) return <NavigateToLogin />;
  if (user.status === 'approved') {
    navigate('/app', { replace: true });
    return null;
  }

  const status = user.status;

  return (
    <div className="min-h-screen bg-brand-white">
      <header className="border-b border-brand-black/10">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Logo href="/" size="sm" />
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 hover:text-brand-black"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
          Application status
        </p>
        <h1 className="heading-section mt-2">Hi {user.name.split(' ')[0]}</h1>

        <Card className="mt-8 p-8">
          <div className="flex items-center justify-between">
            <span className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-black/60">
              Status
            </span>
            {status === 'pending' && <Badge tone="warning">Pending review</Badge>}
            {status === 'rejected' && <Badge tone="danger">Not approved</Badge>}
          </div>

          <p className="body-lg mt-6">
            {status === 'pending'
              ? 'Your application is being reviewed by our admins. You will get access to the member area as soon as it is approved.'
              : 'Thank you for your interest. Your application was not approved at this time. Feel free to reach out to the community team for feedback.'}
          </p>

          {application && (
            <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-brand-black/10 pt-6 font-body text-sm">
              <Row label="Skill level" value={application.level} />
              <Row label="Preferred side" value={application.preferredSide} />
              <Row label="Phone" value={application.phoneNumber} />
              <Row label="Submitted" value={formatLongDate(application.createdAt)} />
            </dl>
          )}
        </Card>

        <div className="mt-8">
          <Link to="/" className="btn-secondary">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
        {label}
      </dt>
      <dd className="mt-0.5 text-brand-black/90">{value}</dd>
    </div>
  );
}

function NavigateToLogin() {
  const navigate = useNavigate();
  navigate('/login', { replace: true });
  return null;
}
