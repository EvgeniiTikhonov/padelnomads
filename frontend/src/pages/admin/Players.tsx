import { useMemo, useState } from 'react';
import { computeLeaderboard, computePlayerStats, useStore, type User } from '@/lib/store';
import { PageHeader, Card, Badge, EmptyState, Modal } from '@/components/ui';
import { formatLongDate } from '@/lib/format';

export default function AdminPlayers() {
  const players = useStore((s) => s.users.filter((u) => u.role === 'player' && u.status === 'approved'));
  const board = useStore((s) => computeLeaderboard(s));
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<User | null>(null);

  const rows = useMemo(
    () =>
      players
        .filter((p) =>
          query
            ? `${p.name} ${p.phoneNumber} ${p.level ?? ''}`.toLowerCase().includes(query.toLowerCase())
            : true,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [players, query],
  );

  const rankOf = (id: string) => board.find((r) => r.userId === id)?.rank;

  return (
    <div>
      <PageHeader title="Players" subtitle="Approved members of the community." />

      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="font-body text-sm text-brand-black/60">{players.length} players</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players…"
          className="form-control sm:max-w-xs"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No players found" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-brand-black/10 text-left font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Side</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Member since</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-black/10">
              {rows.map((p) => (
                <tr key={p.id} className="font-body text-sm">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-black">{p.name}</p>
                    <p className="text-xs text-brand-black/50">{p.phoneNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-black/80">{p.level ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-black/80">{p.preferredSide ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-black/80">
                    {rankOf(p.id) ? `#${rankOf(p.id)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-brand-black/60">{formatLongDate(p.memberSince)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(p)}
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

      <PlayerModal player={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PlayerModal({ player, onClose }: { player: User | null; onClose: () => void }) {
  const stats = useStore((s) => (player ? computePlayerStats(s, player.id) : null));
  if (!player || !stats) return null;
  return (
    <Modal open={!!player} onClose={onClose} title={player.name}>
      <div className="flex items-center gap-2">
        <Badge tone="success">Approved</Badge>
        {player.level && <Badge tone="muted">{player.level}</Badge>}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 font-body text-sm">
        <Row label="Phone" value={player.phoneNumber} />
        <Row label="Email" value={player.email ?? '—'} />
        <Row label="Preferred side" value={player.preferredSide ?? '—'} />
        <Row label="Gender" value={player.gender ?? '—'} />
        <Row label="Rank" value={stats.rank ? `#${stats.rank}` : '—'} />
        <Row label="Points" value={String(stats.totalPoints)} />
        <Row label="Games played" value={String(stats.totalGames)} />
        <Row label="Member since" value={formatLongDate(player.memberSince)} />
      </dl>
    </Modal>
  );
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
