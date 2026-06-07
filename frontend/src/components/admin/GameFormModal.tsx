import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import {
  actions,
  GAME_FORMATS,
  type Game,
  type GameFormat,
  type GameStatus,
} from '@/lib/store';
import { Modal, Field } from '@/components/ui';

type Props = {
  open: boolean;
  onClose: () => void;
  game?: Game | null;
};

const STATUSES: GameStatus[] = ['upcoming', 'live', 'past', 'cancelled'];

export default function GameFormModal({ open, onClose, game }: Props) {
  const { user } = useAuth();
  const editing = !!game;

  const [form, setForm] = useState(() => ({
    title: game?.title ?? '',
    format: (game?.format ?? GAME_FORMATS[0]) as GameFormat,
    venue: game?.venue ?? '',
    date: game?.date ?? new Date().toISOString().slice(0, 10),
    startTime: game?.startTime ?? '19:00',
    endTime: game?.endTime ?? '21:00',
    courts: game?.courts ?? 2,
    capacity: game?.capacity ?? 8,
    level: game?.level ?? 'Intermediate',
    price: game?.price?.toString() ?? '',
    genderRestriction: game?.genderRestriction ?? '',
    description: game?.description ?? '',
    status: (game?.status ?? 'upcoming') as GameStatus,
  }));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.venue || !form.date) {
      setError('Title, venue and date are required.');
      return;
    }
    const payload = {
      title: form.title,
      format: form.format,
      venue: form.venue,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      courts: Number(form.courts) || 1,
      capacity: Number(form.capacity) || 1,
      level: form.level,
      price: form.price ? Number(form.price) : undefined,
      genderRestriction: form.genderRestriction || undefined,
      description: form.description || undefined,
      status: form.status,
    };

    if (editing && game) {
      actions.updateGame(game.id, payload);
    } else {
      actions.createGame({ ...payload, createdBy: user!.id });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit game' : 'Create game'} wide>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Game name" required>
            <input className="form-control" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Format" required>
            <select
              className="form-control"
              value={form.format}
              onChange={(e) => set('format', e.target.value as GameFormat)}
            >
              {GAME_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Venue" required>
            <input className="form-control" value={form.venue} onChange={(e) => set('venue', e.target.value)} />
          </Field>
          <Field label="Date" required>
            <input
              type="date"
              className="form-control"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>
          <Field label="Start time">
            <input
              type="time"
              className="form-control"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
            />
          </Field>
          <Field label="End time">
            <input
              type="time"
              className="form-control"
              value={form.endTime}
              onChange={(e) => set('endTime', e.target.value)}
            />
          </Field>
          <Field label="Courts">
            <input
              type="number"
              min={1}
              className="form-control"
              value={form.courts}
              onChange={(e) => set('courts', Number(e.target.value))}
            />
          </Field>
          <Field label="Capacity">
            <input
              type="number"
              min={1}
              className="form-control"
              value={form.capacity}
              onChange={(e) => set('capacity', Number(e.target.value))}
            />
          </Field>
          <Field label="Level">
            <input className="form-control" value={form.level} onChange={(e) => set('level', e.target.value)} />
          </Field>
          <Field label="Price (AED)">
            <input
              type="number"
              min={0}
              className="form-control"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="Gender restriction">
            <input
              className="form-control"
              value={form.genderRestriction}
              onChange={(e) => set('genderRestriction', e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="Status">
            <select
              className="form-control"
              value={form.status}
              onChange={(e) => set('status', e.target.value as GameStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            className="form-control min-h-24"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional"
          />
        </Field>

        {error && <p className="font-body text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary !px-6 !py-3 !text-xs">
            Cancel
          </button>
          <button type="submit" className="btn-primary !px-6 !py-3 !text-xs">
            {editing ? 'Save changes' : 'Create game'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
