import { useState } from 'react';
import { computeLeaderboard, useStore, type Game } from '@/lib/store';
import { PageHeader, Card, Badge, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/format';
import ResultsModal from '@/components/admin/ResultsModal';

export default function AdminResults() {
  const board = useStore((s) => computeLeaderboard(s));
  const pastGames = useStore((s) =>
    s.games.filter((g) => g.status === 'past').sort((a, b) => (a.date < b.date ? 1 : -1)),
  );
  const liveGames = useStore((s) => s.games.filter((g) => g.status === 'live'));
  const [resultsGame, setResultsGame] = useState<Game | null>(null);

  return (
    <div>
      <PageHeader
        title="Results & Leaderboard"
        subtitle="Published results feed the community leaderboard."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="heading-sub mb-4">Leaderboard</h2>
          <Card>
            <div className="grid grid-cols-[3rem_1fr_4rem_5rem] gap-2 border-b border-brand-black/10 px-4 py-3 font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-right">Games</span>
              <span className="text-right">Points</span>
            </div>
            <div className="divide-y divide-brand-black/10">
              {board.map((row) => (
                <div
                  key={row.userId}
                  className="grid grid-cols-[3rem_1fr_4rem_5rem] items-center gap-2 px-4 py-2.5 font-body text-sm"
                >
                  <span className="font-heading font-semibold text-brand-black/60">{row.rank}</span>
                  <span className="text-brand-black">{row.name}</span>
                  <span className="text-right text-brand-black/70">{row.gamesPlayed}</span>
                  <span className="text-right font-heading font-semibold">{row.points}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          {liveGames.length > 0 && (
            <>
              <h2 className="heading-sub mb-4">Live — enter results</h2>
              <Card className="mb-8 divide-y divide-brand-black/10">
                {liveGames.map((g) => (
                  <div key={g.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-heading text-sm font-semibold text-brand-black">{g.title}</p>
                      <p className="font-body text-xs text-brand-black/50">
                        {formatDate(g.date)} · {g.players.length} players
                      </p>
                    </div>
                    <button
                      onClick={() => setResultsGame(g)}
                      className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black underline underline-offset-4"
                    >
                      Enter results
                    </button>
                  </div>
                ))}
              </Card>
            </>
          )}

          <h2 className="heading-sub mb-4">Past games</h2>
          {pastGames.length === 0 ? (
            <EmptyState title="No completed games yet" />
          ) : (
            <Card className="divide-y divide-brand-black/10">
              {pastGames.map((g) => (
                <div key={g.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-heading text-sm font-semibold text-brand-black">{g.title}</p>
                    <p className="font-body text-xs text-brand-black/50">
                      {formatDate(g.date)} · {g.players.length} players
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {g.results ? <Badge tone="success">Published</Badge> : <Badge tone="warning">No results</Badge>}
                    <button
                      onClick={() => setResultsGame(g)}
                      className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/70 hover:text-brand-black"
                    >
                      {g.results ? 'Edit' : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>

      <ResultsModal game={resultsGame} onClose={() => setResultsGame(null)} />
    </div>
  );
}
