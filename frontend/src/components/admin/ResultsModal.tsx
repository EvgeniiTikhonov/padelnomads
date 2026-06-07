import { useState } from 'react';
import { actions, getState, userById, type Game, type GameResultEntry } from '@/lib/store';
import { Modal } from '@/components/ui';

export default function ResultsModal({
  game,
  onClose,
}: {
  game: Game | null;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<GameResultEntry[]>(() => {
    if (!game) return [];
    if (game.results) return [...game.results].sort((a, b) => a.position - b.position);
    return game.players.map((userId, i) => ({ userId, position: i + 1, points: 0 }));
  });

  if (!game) return null;

  const update = (userId: string, patch: Partial<GameResultEntry>) =>
    setRows((prev) => prev.map((r) => (r.userId === userId ? { ...r, ...patch } : r)));

  const save = () => {
    actions.publishResults(game.id, rows);
    onClose();
  };

  return (
    <Modal open={!!game} onClose={onClose} title={`Results · ${game.title}`} wide>
      {game.players.length === 0 ? (
        <p className="font-body text-sm text-brand-black/50">
          Add players to this game before entering results.
        </p>
      ) : (
        <>
          <p className="mb-4 font-body text-sm text-brand-black/60">
            Enter final position and points for each player. Publishing results moves the game to Past
            and updates the leaderboard.
          </p>
          <div className="border border-brand-black/10">
            <div className="grid grid-cols-[1fr_6rem_6rem] gap-2 border-b border-brand-black/10 px-4 py-2 font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
              <span>Player</span>
              <span>Position</span>
              <span>Points</span>
            </div>
            <div className="divide-y divide-brand-black/10">
              {rows.map((r) => {
                const u = userById(getState(), r.userId);
                return (
                  <div key={r.userId} className="grid grid-cols-[1fr_6rem_6rem] items-center gap-2 px-4 py-2.5">
                    <span className="font-body text-sm">{u?.name ?? 'Unknown'}</span>
                    <input
                      type="number"
                      min={1}
                      className="form-control !py-2"
                      value={r.position}
                      onChange={(e) => update(r.userId, { position: Number(e.target.value) })}
                    />
                    <input
                      type="number"
                      min={0}
                      className="form-control !py-2"
                      value={r.points}
                      onChange={(e) => update(r.userId, { points: Number(e.target.value) })}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={onClose} className="btn-secondary !px-6 !py-3 !text-xs">
              Cancel
            </button>
            <button onClick={save} className="btn-primary !px-6 !py-3 !text-xs">
              Publish results
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
