import { Link } from 'react-router-dom';
import { useStore, upcomingWindowGames } from '@/lib/store';
import { PageHeader, StatCard, Card, EmptyState } from '@/components/ui';
import { GameStatusBadge } from '@/components/GameCard';
import { formatDate, relativeFromNow } from '@/lib/format';

export default function AdminDashboard() {
  const pendingApps = useStore((s) => s.applications.filter((a) => a.status === 'pending'));
  const players = useStore((s) => s.users.filter((u) => u.role === 'player' && u.status === 'approved').length);
  const liveGames = useStore((s) => s.games.filter((g) => g.status === 'live'));
  const activeOffers = useStore((s) => s.offers.filter((o) => o.status === 'active').length);
  const upcoming = useStore((s) => upcomingWindowGames(s));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Community operations at a glance." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link to="/admin/applications">
          <StatCard label="Pending apps" value={pendingApps.length} hint="Awaiting review" />
        </Link>
        <Link to="/admin/players">
          <StatCard label="Players" value={players} hint="Approved members" />
        </Link>
        <Link to="/admin/games">
          <StatCard label="Live games" value={liveGames.length} />
        </Link>
        <Link to="/admin/offers">
          <StatCard label="Active offers" value={activeOffers} />
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="heading-sub">Pending applications</h2>
            <Link
              to="/admin/applications"
              className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 hover:text-brand-black"
            >
              Review all
            </Link>
          </div>
          {pendingApps.length === 0 ? (
            <EmptyState title="No pending applications" />
          ) : (
            <Card className="divide-y divide-brand-black/10">
              {pendingApps.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-heading text-sm font-semibold text-brand-black">{a.name}</p>
                    <p className="font-body text-xs text-brand-black/50">
                      {a.level} · {relativeFromNow(a.createdAt)}
                    </p>
                  </div>
                  <Link
                    to="/admin/applications"
                    className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 hover:text-brand-black"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </Card>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="heading-sub">Upcoming games</h2>
            <Link
              to="/admin/games"
              className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 hover:text-brand-black"
            >
              Manage
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming games" />
          ) : (
            <Card className="divide-y divide-brand-black/10">
              {upcoming.slice(0, 5).map((g) => (
                <div key={g.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-heading text-sm font-semibold text-brand-black">{g.title}</p>
                    <p className="font-body text-xs text-brand-black/50">
                      {formatDate(g.date)} · {g.players.length}/{g.capacity}
                    </p>
                  </div>
                  <GameStatusBadge status={g.status} />
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
