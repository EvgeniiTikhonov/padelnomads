import { Outlet, Link } from 'react-router-dom';
import Logo from './Logo';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-white">
      <header className="border-b border-black/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo href="/" size="md" />
          <nav className="flex items-center gap-8" aria-label="Main">
            <Link
              to="/join"
              className="font-body text-body text-brand-black/80 hover:text-brand-black transition-colors"
            >
              Join Community
            </Link>
            <Link to="/login" className="btn-primary">
              Log In
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-black/10 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <Logo href="/" size="sm" />
            <p className="font-body text-body text-brand-black/60">
              Members only community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
