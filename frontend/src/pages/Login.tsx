import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { User } from '@/lib/store';

const QUICK = [
  { id: 'u_admin', label: 'Admin', desc: 'Manage the community' },
  { id: 'u_me', label: 'Approved player', desc: 'Full member access' },
  { id: 'u_pending', label: 'Pending applicant', desc: 'Awaiting review' },
];

export default function Login() {
  const { login, loginAs } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);

  const routeFor = (user: User) => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.status === 'approved') navigate('/app');
    else navigate('/status');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = login(identifier);
    if (!user) {
      setError('No account found. Try a demo account below.');
      return;
    }
    routeFor(user);
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="heading-section">Log in</h1>
      <p className="body-lg mt-4">
        Sign in to access games, your profile, and community benefits.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6 border border-brand-black/10 bg-white p-8">
        <div>
          <label className="form-label" htmlFor="identifier">
            Email or phone number
          </label>
          <input
            id="identifier"
            className="form-control mt-2"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {error && (
          <p className="font-body text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full">
          Log in
        </button>
      </form>

      <div className="mt-10">
        <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
          Prototype demo accounts
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {QUICK.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                const user = loginAs(q.id);
                if (user) routeFor(user);
              }}
              className="border border-brand-black/15 bg-white p-4 text-left transition-colors hover:border-brand-black"
            >
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-black">
                {q.label}
              </p>
              <p className="mt-1 font-body text-xs text-brand-black/55">{q.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <Link to="/join" className="btn-secondary">
          Apply to join
        </Link>
      </div>
    </div>
  );
}
