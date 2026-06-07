import { useAuth } from '@/lib/auth';
import { computePlayerStats, useStore, type Game } from '@/lib/store';
import { PageHeader, Card, StatCard, Badge, EmptyState } from '@/components/ui';
import { formatDate, formatLongDate } from '@/lib/format';

export default function Profile() {
  const { user } = useAuth();
  const stats = useStore((s) => computePlayerStats(s, user!.id));
  const upcoming = useStore((s) =>
    s.games
      .filter((g) => (g.status === 'upcoming' || g.status === 'live') && g.players.includes(user!.id))
      .sort((a, b) => (a.date < b.date ? -1 : 1)),
  );
  const past = useStore((s) =>
    s.games
      .filter((g) => g.status === 'past' && g.players.includes(user!.id))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
  );

  const u = user!;

  return (
    <div>
      <PageHeader title="Profile" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="flex h-16 w-16 items-center justify-center bg-brand-black font-heading text-2xl font-semibold text-brand-white">
              {u.name.charAt(0)}
            </div>
            <h2 className="mt-4 font-heading text-xl font-semibold text-brand-black">{u.name}</h2>
            <p className="mt-1 font-body text-sm text-brand-black/55">
              Member since {formatLongDate(u.memberSince)}
            </p>
            <div className="mt-3">
              <Badge tone="success">Approved</Badge>
            </div>

            <dl className="mt-6 space-y-3 border-t border-brand-black/10 pt-6 font-body text-sm">
              <Row label="Phone" value={u.phoneNumber} />
              {u.email && <Row label="Email" value={u.email} />}
              <Row label="Skill level" value={u.level ?? '—'} />
              <Row label="Preferred side" value={u.preferredSide ?? '—'} />
              {u.gender && <Row label="Gender" value={u.gender} />}
            </dl>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <h3 className="heading-sub mb-4">Quick stats</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Rank" value={stats.rank ? `#${stats.rank}` : '—'} />
            <StatCard label="Points" value={stats.totalPoints} />
            <StatCard label="Games" value={stats.totalGames} />
            <StatCard label="Wins" value={stats.wins} />
          </div>

          <h3 className="heading-sub mb-4 mt-10">Upcoming games</h3>
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming games" />
          ) : (
            <Card className="divide-y divide-brand-black/10">
              {upcoming.map((g) => (
                <GameRow key={g.id} game={g} />
              ))}
            </Card>
          )}

          <h3 className="heading-sub mb-4 mt-10">Game history</h3>
          {past.length === 0 ? (
            <EmptyState title="No past games yet" />
          ) : (
            <Card className="divide-y divide-brand-black/10">
              {past.map((g) => {
                const result = g.results?.find((r) => r.userId === u.id);
                return (
                  <div key={g.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-heading text-sm font-semibold text-brand-black">{g.title}</p>
                      <p className="font-body text-xs text-brand-black/50">
                        {formatDate(g.date)} · {g.venue}
                      </p>
                    </div>
                    {result && (
                      <div className="text-right">
                        <p className="font-heading text-sm font-semibold text-brand-black">
                          {result.points} pts
                        </p>
                        <p className="font-body text-xs text-brand-black/50">
                          {ordinal(result.position)} place
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function GameRow({ game }: { game: Game }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div>
        <p className="font-heading text-sm font-semibold text-brand-black">{game.title}</p>
        <p className="font-body text-xs text-brand-black/50">
          {formatDate(game.date)} · {game.startTime} · {game.venue}
        </p>
      </div>
      {game.status === 'live' ? <Badge tone="live">Live</Badge> : <Badge>Registered</Badge>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
        {label}
      </dt>
      <dd className="text-brand-black/90">{value}</dd>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
