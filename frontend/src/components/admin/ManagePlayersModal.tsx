import { useMemo, useState } from 'react';
import { actions, useStore, type Game } from '@/lib/store';
import { Modal, Badge } from '@/components/ui';

export default function ManagePlayersModal({
  game,
  onClose,
}: {
  game: Game | null;
  onClose: () => void;
}) {
  const liveGame = useStore((s) => s.games.find((g) => g.id === game?.id) ?? null);
  const players = useStore((s) => s.users.filter((u) => u.role === 'player' && u.status === 'approved'));
  const [query, setQuery] = useState('');

  const registered = useMemo(
    () => players.filter((p) => liveGame?.players.includes(p.id)),
    [players, liveGame],
  );
  const available = useMemo(
    () =>
      players
        .filter((p) => !liveGame?.players.includes(p.id))
        .filter((p) =>
          query
            ? `${p.name} ${p.phoneNumber} ${p.level ?? ''}`.toLowerCase().includes(query.toLowerCase())
            : true,
        ),
    [players, liveGame, query],
  );

  if (!liveGame) return null;
  const full = liveGame.players.length >= liveGame.capacity;

  return (
    <Modal open={!!game} onClose={onClose} title={`Manage players · ${liveGame.title}`} wide>
      <div className="mb-6 flex items-center justify-between">
        <span className="font-body text-sm text-brand-black/60">
          {liveGame.players.length}/{liveGame.capacity} registered
        </span>
        {full && <Badge tone="warning">At capacity</Badge>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
            Registered
          </h3>
          <div className="border border-brand-black/10 divide-y divide-brand-black/10">
            {registered.length === 0 ? (
              <p className="px-4 py-3 font-body text-sm text-brand-black/40">No players yet.</p>
            ) : (
              registered.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-body text-sm">
                    {p.name}
                    <span className="text-brand-black/40"> · {p.level}</span>
                  </span>
                  <button
                    onClick={() => actions.removePlayerFromGame(liveGame.id, p.id)}
                    className="font-heading text-xs font-semibold uppercase tracking-wide text-red-700 hover:text-red-900"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
            Add players
          </h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, level…"
            className="form-control mb-3"
          />
          <div className="max-h-72 overflow-y-auto border border-brand-black/10 divide-y divide-brand-black/10">
            {available.length === 0 ? (
              <p className="px-4 py-3 font-body text-sm text-brand-black/40">No players found.</p>
            ) : (
              available.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-body text-sm">
                    {p.name}
                    <span className="text-brand-black/40"> · {p.level}</span>
                  </span>
                  <button
                    onClick={() => actions.addPlayerToGame(liveGame.id, p.id)}
                    disabled={full}
                    className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black hover:text-brand-black/60 disabled:cursor-not-allowed disabled:text-brand-black/25"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={onClose} className="btn-primary !px-6 !py-3 !text-xs">
          Done
        </button>
      </div>
    </Modal>
  );
}
