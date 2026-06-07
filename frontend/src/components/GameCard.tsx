import type { Game } from '@/lib/store';
import { formatDate, GAME_STATUS_LABEL } from '@/lib/format';
import { Badge, Card } from './ui';

export function GameStatusBadge({ status }: { status: Game['status'] }) {
  const tone =
    status === 'live'
      ? 'live'
      : status === 'cancelled'
        ? 'danger'
        : status === 'past'
          ? 'muted'
          : 'neutral';
  return <Badge tone={tone as never}>{GAME_STATUS_LABEL[status]}</Badge>;
}

export function GameCard({
  game,
  registered,
  footer,
  onClick,
}: {
  game: Game;
  registered?: boolean;
  footer?: React.ReactNode;
  onClick?: () => void;
}) {
  const spotsLeft = Math.max(0, game.capacity - game.players.length);
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Card className={`flex flex-col p-5 ${onClick ? 'cursor-pointer text-left transition-colors hover:border-brand-black/40' : ''}`}>
      <Wrapper onClick={onClick} className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
              {game.format}
            </p>
            <h3 className="mt-1 font-heading text-lg font-semibold leading-tight text-brand-black">
              {game.title}
            </h3>
          </div>
          <GameStatusBadge status={game.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-body text-sm">
          <Detail label="Date" value={formatDate(game.date)} />
          <Detail label="Time" value={`${game.startTime}–${game.endTime}`} />
          <Detail label="Venue" value={game.venue} />
          <Detail label="Level" value={game.level} />
        </dl>

        <div className="mt-4 flex items-center justify-between border-t border-brand-black/10 pt-3">
          <span className="font-body text-sm text-brand-black/60">
            {game.players.length}/{game.capacity} players
            {game.status === 'upcoming' && (
              <span className="text-brand-black/40"> · {spotsLeft} spots left</span>
            )}
          </span>
          {registered && <Badge tone="success">Registered</Badge>}
        </div>
      </Wrapper>
      {footer && <div className="mt-4">{footer}</div>}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-brand-black/40">
        {label}
      </dt>
      <dd className="text-brand-black/90">{value}</dd>
    </div>
  );
}
