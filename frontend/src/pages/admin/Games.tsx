import { useMemo, useState } from 'react';
import { actions, useStore, type Game, type GameStatus } from '@/lib/store';
import { PageHeader, Card, EmptyState, ConfirmDialog } from '@/components/ui';
import { GameStatusBadge } from '@/components/GameCard';
import { formatDate } from '@/lib/format';
import GameFormModal from '@/components/admin/GameFormModal';
import ManagePlayersModal from '@/components/admin/ManagePlayersModal';
import ResultsModal from '@/components/admin/ResultsModal';

type Tab = 'upcoming' | 'live' | 'past' | 'cancelled';

export default function AdminGames() {
  const games = useStore((s) => s.games);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [formOpen, setFormOpen] = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [playersGame, setPlayersGame] = useState<Game | null>(null);
  const [resultsGame, setResultsGame] = useState<Game | null>(null);
  const [deleteGame, setDeleteGame] = useState<Game | null>(null);

  const filtered = useMemo(
    () =>
      games
        .filter((g) => g.status === tab)
        .sort((a, b) => (a.date < b.date ? (tab === 'past' ? 1 : -1) : tab === 'past' ? -1 : 1)),
    [games, tab],
  );

  const counts = (s: GameStatus) => games.filter((g) => g.status === s).length;

  const openCreate = () => {
    setEditGame(null);
    setFormOpen(true);
  };
  const openEdit = (g: Game) => {
    setEditGame(g);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Games"
        subtitle="Create and manage games across their lifecycle."
        action={
          <button onClick={openCreate} className="btn-primary !py-3 !text-xs">
            + Create game
          </button>
        }
      />

      <div className="mb-6 flex gap-2 border-b border-brand-black/10">
        {(['upcoming', 'live', 'past', 'cancelled'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wide capitalize transition-colors ${
              tab === t
                ? 'border-brand-black text-brand-black'
                : 'border-transparent text-brand-black/45 hover:text-brand-black'
            }`}
          >
            {t} ({counts(t)})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={`No ${tab} games`} />
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => (
            <Card key={g.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-base font-semibold text-brand-black">{g.title}</h3>
                    <GameStatusBadge status={g.status} />
                  </div>
                  <p className="mt-1 font-body text-sm text-brand-black/55">
                    {g.format} · {formatDate(g.date)} · {g.startTime}–{g.endTime} · {g.venue} ·{' '}
                    {g.players.length}/{g.capacity} players
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Action onClick={() => setPlayersGame(g)}>Players</Action>
                  {g.status === 'upcoming' && (
                    <Action onClick={() => actions.setGameStatus(g.id, 'live')}>Start (Live)</Action>
                  )}
                  {g.status === 'live' && (
                    <Action onClick={() => setResultsGame(g)} primary>
                      Enter results
                    </Action>
                  )}
                  {g.status === 'past' && (
                    <Action onClick={() => setResultsGame(g)}>Edit results</Action>
                  )}
                  {(g.status === 'upcoming' || g.status === 'live') && (
                    <Action onClick={() => actions.setGameStatus(g.id, 'cancelled')}>Cancel</Action>
                  )}
                  {g.status === 'cancelled' && (
                    <Action onClick={() => actions.setGameStatus(g.id, 'upcoming')}>Restore</Action>
                  )}
                  <Action onClick={() => openEdit(g)}>Edit</Action>
                  <Action onClick={() => setDeleteGame(g)} danger>
                    Delete
                  </Action>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {formOpen && (
        <GameFormModal open={formOpen} game={editGame} onClose={() => setFormOpen(false)} />
      )}
      <ManagePlayersModal game={playersGame} onClose={() => setPlayersGame(null)} />
      <ResultsModal game={resultsGame} onClose={() => setResultsGame(null)} />
      <ConfirmDialog
        open={!!deleteGame}
        title="Delete game"
        message={`Are you sure you want to delete "${deleteGame?.title}"? This cannot be undone and registered players will be notified.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteGame(null)}
        onConfirm={() => {
          if (deleteGame) actions.deleteGame(deleteGame.id);
          setDeleteGame(null);
        }}
      />
    </div>
  );
}

function Action({
  children,
  onClick,
  danger,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-heading text-xs font-semibold uppercase tracking-wide transition-colors ${
        danger
          ? 'text-red-700 hover:text-red-900'
          : primary
            ? 'text-brand-black underline underline-offset-4 hover:text-brand-black/60'
            : 'text-brand-black/70 hover:text-brand-black'
      }`}
    >
      {children}
    </button>
  );
}
