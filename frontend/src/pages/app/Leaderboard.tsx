import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { computeLeaderboard, useStore, LEVELS } from '@/lib/store';
import { PageHeader, Card, Badge } from '@/components/ui';

export default function Leaderboard() {
  const { user } = useAuth();
  const board = useStore((s) => computeLeaderboard(s));
  const [level, setLevel] = useState<string>('all');

  const rows = useMemo(
    () => (level === 'all' ? board : board.filter((r) => r.level === level)),
    [board, level],
  );
  const me = board.find((r) => r.userId === user!.id);

  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Ranking based on points earned in completed games." />

      {me && (
        <Card className="mb-6 flex items-center justify-between p-5">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
              Your rank
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">#{me.rank}</p>
          </div>
          <div className="text-right">
            <p className="font-body text-sm text-brand-black/60">{me.points} points</p>
            <p className="font-body text-sm text-brand-black/60">{me.gamesPlayed} games</p>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={level === 'all'} onClick={() => setLevel('all')}>
          Overall
        </FilterChip>
        {LEVELS.map((l) => (
          <FilterChip key={l} active={level === l} onClick={() => setLevel(l)}>
            {l}
          </FilterChip>
        ))}
      </div>

      <Card>
        <div className="grid grid-cols-[3rem_1fr_5rem_5rem] gap-2 border-b border-brand-black/10 px-5 py-3 font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Games</span>
          <span className="text-right">Points</span>
        </div>
        <div className="divide-y divide-brand-black/10">
          {rows.map((row) => (
            <div
              key={row.userId}
              className={`grid grid-cols-[3rem_1fr_5rem_5rem] items-center gap-2 px-5 py-3 ${
                row.userId === user!.id ? 'bg-brand-black/[0.03]' : ''
              }`}
            >
              <span className="font-heading text-sm font-semibold text-brand-black/60">
                {row.rank}
              </span>
              <span className="flex items-center gap-2 font-body text-sm text-brand-black">
                {row.name}
                {row.userId === user!.id && <Badge tone="muted">You</Badge>}
                {row.level && (
                  <span className="hidden text-xs text-brand-black/40 sm:inline">{row.level}</span>
                )}
              </span>
              <span className="text-right font-body text-sm text-brand-black/70">
                {row.gamesPlayed}
              </span>
              <span className="text-right font-heading text-sm font-semibold text-brand-black">
                {row.points}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-4 py-1.5 font-heading text-xs font-semibold uppercase tracking-wide transition-colors ${
        active
          ? 'border-brand-black bg-brand-black text-brand-white'
          : 'border-brand-black/15 text-brand-black/60 hover:border-brand-black'
      }`}
    >
      {children}
    </button>
  );
}
