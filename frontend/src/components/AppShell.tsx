import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';

const NAV = [
  { to: '/app', label: 'Home', end: true },
  { to: '/app/games', label: 'Games' },
  { to: '/app/leaderboard', label: 'Leaderboard' },
  { to: '/app/benefits', label: 'Benefits' },
  { to: '/app/offers', label: 'Offers' },
  { to: '/app/profile', label: 'Profile' },
  { to: '/app/notifications', label: 'Alerts' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unread = useStore((s) =>
    s.notifications.filter((n) => n.userId === user?.id && !n.isRead).length,
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-brand-white pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-brand-black/10 bg-brand-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/app" size="sm" />
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Member">
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
                {item.label === 'Alerts' && unread > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center bg-brand-black px-1 font-body text-[0.6rem] font-semibold text-brand-white">
                    {unread}
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-7 border-t border-brand-black/10 bg-brand-white lg:hidden"
        aria-label="Member"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 py-2.5 font-heading text-[0.55rem] font-semibold uppercase tracking-wide transition-colors ${
                isActive ? 'text-brand-black' : 'text-brand-black/45'
              }`
            }
          >
            {item.label}
            {item.label === 'Alerts' && unread > 0 && (
              <span className="absolute right-2 top-1 h-1.5 w-1.5 rounded-full bg-brand-black" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
