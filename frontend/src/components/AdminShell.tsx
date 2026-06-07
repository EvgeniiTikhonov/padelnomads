import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/applications', label: 'Applications' },
  { to: '/admin/games', label: 'Games' },
  { to: '/admin/players', label: 'Players' },
  { to: '/admin/offers', label: 'Offers' },
  { to: '/admin/results', label: 'Results' },
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pending = useStore((s) => s.applications.filter((a) => a.status === 'pending').length);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-brand-white pb-16 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-brand-black/10 bg-brand-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/admin" size="sm" />
            <span className="hidden border border-brand-black/20 px-2 py-0.5 font-heading text-[0.6rem] font-semibold uppercase tracking-wide text-brand-black/70 sm:inline">
              Admin
            </span>
          </div>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Admin">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative font-heading text-xs font-semibold uppercase tracking-wide transition-colors ${
                    isActive ? 'text-brand-black' : 'text-brand-black/50 hover:text-brand-black'
                  }`
                }
              >
                {item.label}
                {item.label === 'Applications' && pending > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center bg-brand-black px-1 font-body text-[0.6rem] font-semibold text-brand-white">
                    {pending}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden font-body text-sm text-brand-black/60 sm:inline">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 transition-colors hover:text-brand-black"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-brand-black/10 bg-brand-white lg:hidden"
        aria-label="Admin"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center py-2.5 font-heading text-[0.55rem] font-semibold uppercase tracking-wide transition-colors ${
                isActive ? 'text-brand-black' : 'text-brand-black/45'
              }`
            }
          >
            {item.label.slice(0, 8)}
            {item.label === 'Applications' && pending > 0 && (
              <span className="absolute right-2 top-1 h-1.5 w-1.5 rounded-full bg-brand-black" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
