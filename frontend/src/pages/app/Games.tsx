import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useStore, userById, type Game, getState } from '@/lib/store';
import { GameCard, GameStatusBadge } from '@/components/GameCard';
import { PageHeader, EmptyState, Modal, Badge } from '@/components/ui';
import { formatLongDate } from '@/lib/format';

type Tab = 'upcoming' | 'live' | 'past';

export default function Games() {
  const { user } = useAuth();
  const games = useStore((s) => s.games);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [selected, setSelected] = useState<Game | null>(null);

  const filtered = useMemo(() => {
    const list = games
      .filter((g) => (tab === 'upcoming' ? g.status === 'upcoming' : g.status === tab))
      .sort((a, b) => (a.date < b.date ? (tab === 'past' ? 1 : -1) : tab === 'past' ? -1 : 1));
    return list;
  }, [games, tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'live', label: 'Live' },
    { id: 'past', label: 'Past' },
  ];

  return (
    <div>
      <PageHeader title="Games" subtitle="Browse upcoming, live, and past community games." />

      <div className="mb-6 flex gap-2 border-b border-brand-black/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === t.id
                ? 'border-brand-black text-brand-black'
                : 'border-transparent text-brand-black/45 hover:text-brand-black'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={`No ${tab} games`} message="Nothing here right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              registered={g.players.includes(user!.id)}
              onClick={() => setSelected(g)}
            />
          ))}
        </div>
      )}

      <GameDetailModal
        game={selected}
        currentUserId={user!.id}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

export function GameDetailModal({
  game,
  currentUserId,
  onClose,
}: {
  game: Game | null;
  currentUserId?: string;
  onClose: () => void;
}) {
  if (!game) return null;
  const players = game.players
    .map((id) => userById(getState(), id))
    .filter(Boolean) as NonNullable<ReturnType<typeof userById>>[];
  const ranked = game.results
    ? [...game.results].sort((a, b) => a.position - b.position)
    : null;

  return (
    <Modal open={!!game} onClose={onClose} title={game.title} wide>
      <div className="flex flex-wrap items-center gap-3">
        <GameStatusBadge status={game.status} />
        <Badge>{game.format}</Badge>
        {game.genderRestriction && <Badge tone="muted">{game.genderRestriction}</Badge>}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 font-body text-sm sm:grid-cols-3">
        <Detail label="Date" value={formatLongDate(game.date)} />
        <Detail label="Time" value={`${game.startTime}–${game.endTime}`} />
        <Detail label="Venue" value={game.venue} />
        <Detail label="Level" value={game.level} />
        <Detail label="Courts" value={String(game.courts)} />
        <Detail label="Capacity" value={`${game.players.length}/${game.capacity}`} />
        {game.price != null && <Detail label="Price" value={`AED ${game.price}`} />}
      </dl>

      {game.description && (
        <p className="mt-6 font-body text-sm text-brand-black/70">{game.description}</p>
      )}

      {ranked ? (
        <div className="mt-8">
          <h3 className="heading-sub mb-3">Results</h3>
          <div className="border border-brand-black/10 divide-y divide-brand-black/10">
            {ranked.map((r) => {
              const u = userById(getState(), r.userId);
              return (
                <div key={r.userId} className="flex items-center justify-between px-4 py-2.5">
                  <span className="flex items-center gap-3">
                    <span className="w-6 font-heading text-sm font-semibold text-brand-black/50">
                      {r.position}
                    </span>
                    <span className="font-body text-sm">
                      {u?.name ?? 'Unknown'}
                      {r.userId === currentUserId && (
                        <span className="text-brand-black/40"> · you</span>
                      )}
                    </span>
                  </span>
                  <span className="font-heading text-sm font-semibold">{r.points} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h3 className="heading-sub mb-3">Players ({players.length})</h3>
          {players.length === 0 ? (
            <p className="font-body text-sm text-brand-black/50">No players registered yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <span
                  key={p.id}
                  className={`border px-3 py-1 font-body text-sm ${
                    p.id === currentUserId
                      ? 'border-brand-black bg-brand-black text-brand-white'
                      : 'border-brand-black/15 text-brand-black/80'
                  }`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
        {label}
      </dt>
      <dd className="mt-0.5 text-brand-black/90">{value}</dd>
    </div>
  );
}
