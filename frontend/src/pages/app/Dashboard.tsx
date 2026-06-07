import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  computePlayerStats,
  computeLeaderboard,
  upcomingWindowGames,
  useStore,
} from '@/lib/store';
import { Card, StatCard, EmptyState, Badge } from '@/components/ui';
import { GameCard } from '@/components/GameCard';
import { relativeFromNow } from '@/lib/format';

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useStore((s) => computePlayerStats(s, user!.id));
  const games = useStore((s) => upcomingWindowGames(s));
  const myNextGame = useStore((s) =>
    upcomingWindowGames(s).find((g) => g.players.includes(user!.id)),
  );
  const topBoard = useStore((s) => computeLeaderboard(s).slice(0, 5));
  const notifications = useStore((s) =>
    s.notifications.filter((n) => n.userId === user!.id).slice(0, 3),
  );
  const activeOffers = useStore((s) => s.offers.filter((o) => o.status === 'active').slice(0, 3));

  return (
    <div>
      <div className="mb-8">
        <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
          Welcome back
        </p>
        <h1 className="heading-section mt-1">{user!.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Leaderboard" value={stats.rank ? `#${stats.rank}` : '—'} hint="Your rank" />
        <StatCard label="Points" value={stats.totalPoints} />
        <StatCard label="Games" value={stats.totalGames} hint="Played" />
        <StatCard label="Upcoming" value={stats.upcomingCount} hint="Registered" />
      </div>

      {myNextGame && (
        <section className="mt-10">
          <h2 className="heading-sub mb-4">Your next game</h2>
          <GameCard game={myNextGame} registered />
        </section>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-sub">Upcoming games · next 2 weeks</h2>
          <Link
            to="/app/games"
            className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 hover:text-brand-black"
          >
            View all
          </Link>
        </div>
        {games.length === 0 ? (
          <EmptyState title="No upcoming games" message="Check back soon for new sessions." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {games.slice(0, 4).map((g) => (
              <GameCard key={g.id} game={g} registered={g.players.includes(user!.id)} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="heading-sub">Leaderboard</h2>
            <Link
              to="/app/leaderboard"
              className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 hover:text-brand-black"
            >
              Full board
            </Link>
          </div>
          <Card className="divide-y divide-brand-black/10">
            {topBoard.map((row) => (
              <div
                key={row.userId}
                className={`flex items-center justify-between px-5 py-3 ${
                  row.userId === user!.id ? 'bg-brand-black/[0.03]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 font-heading text-sm font-semibold text-brand-black/50">
                    {row.rank}
                  </span>
                  <span className="font-body text-sm text-brand-black">
                    {row.name}
                    {row.userId === user!.id && <span className="text-brand-black/40"> · you</span>}
                  </span>
                </div>
                <span className="font-heading text-sm font-semibold text-brand-black">
                  {row.points}
                </span>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="heading-sub">Recent alerts</h2>
            <Link
              to="/app/notifications"
              className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 hover:text-brand-black"
            >
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <EmptyState title="No notifications yet" />
          ) : (
            <Card className="divide-y divide-brand-black/10">
              {notifications.map((n) => (
                <div key={n.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading text-sm font-semibold text-brand-black">{n.title}</p>
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-brand-black" />}
                  </div>
                  <p className="mt-1 font-body text-xs text-brand-black/55">
                    {relativeFromNow(n.createdAt)}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-sub">Member offers</h2>
          <Link
            to="/app/offers"
            className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/60 hover:text-brand-black"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {activeOffers.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
                  {o.partnerName}
                </p>
                {o.discount && <Badge>{o.discount}</Badge>}
              </div>
              <h3 className="mt-2 font-heading text-base font-semibold text-brand-black">{o.title}</h3>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
