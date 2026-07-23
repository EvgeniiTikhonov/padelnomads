import type { Game, GameMatch, GameTeam } from '@/types';
import { formatConfig, courtBoostPoints } from './gameFormats';

// Derived scoring for round-based, team-vs-team formats. Admins enter raw match
// scores per round; everything below (win/loss, boosted points, streak bonus,
// totals, ranking) is computed from those matches per the game-format spec.

export interface RoundResult {
  round: number;
  court: number;
  opponentId?: string;
  scored: number;
  conceded: number;
  won: boolean;
  decided: boolean;
  bye: boolean;
  base: number;      // base points before bonus
  bonus: number;     // streak bonus
  points: number;    // base + bonus (0 if lost / bye)
}

export interface TeamStanding {
  team: GameTeam;
  rounds: RoundResult[];
  total: number;
  wins: number;
  finalCourt: number;
  rank: number;
}

export function matchDecided(m: GameMatch): boolean {
  return m.scoreA != null && m.scoreB != null && m.scoreA !== m.scoreB;
}

export function matchWinnerId(m: GameMatch): string | null {
  if (!matchDecided(m)) return null;
  return (m.scoreA as number) > (m.scoreB as number) ? m.teamAId : m.teamBId;
}

function matchForTeam(matches: GameMatch[], gameId: string, round: number, teamId: string): GameMatch | undefined {
  return matches.find(
    (m) => m.gameId === gameId && m.round === round && (m.teamAId === teamId || m.teamBId === teamId),
  );
}

export function computeStandings(game: Game, teams: GameTeam[], matches: GameMatch[]): TeamStanding[] {
  const cfg = formatConfig(game.format);
  const totalRounds = cfg.rounds.length;

  const standings: TeamStanding[] = teams.map((team) => {
    const rounds: RoundResult[] = [];
    let wonPrev = false;
    let finalCourt = team.court;

    for (let r = 0; r < totalRounds; r++) {
      const m = matchForTeam(matches, game.id, r, team.id);
      if (!m) {
        rounds.push({ round: r, court: finalCourt, scored: 0, conceded: 0, won: false, decided: false, bye: true, base: 0, bonus: 0, points: 0 });
        wonPrev = false;
        continue;
      }
      const isA = m.teamAId === team.id;
      const scored = (isA ? m.scoreA : m.scoreB) ?? 0;
      const conceded = (isA ? m.scoreB : m.scoreA) ?? 0;
      const opponentId = isA ? m.teamBId : m.teamAId;
      const decided = matchDecided(m);
      const won = decided && scored > conceded;
      finalCourt = m.court;

      let base = 0;
      let bonus = 0;
      if (won) {
        base = cfg.rounds[r].boosted ? courtBoostPoints(m.court) : 1;
        if (cfg.streakBonusFromRound != null && r + 1 >= cfg.streakBonusFromRound && wonPrev) bonus = 1;
      }
      rounds.push({ round: r, court: m.court, opponentId, scored, conceded, won, decided, bye: false, base, bonus, points: base + bonus });
      wonPrev = won;
    }

    const total = rounds.reduce((s, x) => s + x.points, 0);
    const wins = rounds.filter((x) => x.won).length;
    return { team, rounds, total, wins, finalCourt, rank: 0 };
  });

  // Rank: total points, then higher final court (lower number), then more wins.
  standings.sort((a, b) => b.total - a.total || a.finalCourt - b.finalCourt || b.wins - a.wins);
  standings.forEach((s, i) => { s.rank = i + 1; });
  return standings;
}

/**
 * King-of-the-Court ladder movement: winners move up a court, losers move down.
 * Returns the next round's matches, or null if the given round isn't fully
 * decided yet. Assumes 2 teams per court (the standard allocation).
 */
export function generateNextRoundMatches(
  game: Game,
  matches: GameMatch[],
  fromRound: number,
  mkId: () => string,
): GameMatch[] | null {
  const roundMatches = matches
    .filter((m) => m.gameId === game.id && m.round === fromRound)
    .sort((a, b) => a.court - b.court);
  if (roundMatches.length === 0 || !roundMatches.every(matchDecided)) return null;

  const courts = roundMatches.map((m) => m.court);
  const winnerAt: Record<number, string> = {};
  const loserAt: Record<number, string> = {};
  roundMatches.forEach((m) => {
    const w = matchWinnerId(m)!;
    winnerAt[m.court] = w;
    loserAt[m.court] = w === m.teamAId ? m.teamBId : m.teamAId;
  });

  const N = courts.length;
  const next: GameMatch[] = [];
  for (let i = 0; i < N; i++) {
    const court = courts[i];
    let a: string;
    let b: string;
    if (N === 1) {
      a = winnerAt[court]; b = loserAt[court];
    } else if (i === 0) {
      a = winnerAt[courts[0]]; b = winnerAt[courts[1]];
    } else if (i === N - 1) {
      a = loserAt[courts[N - 2]]; b = loserAt[courts[N - 1]];
    } else {
      a = loserAt[courts[i - 1]]; b = winnerAt[courts[i + 1]];
    }
    next.push({ id: mkId(), gameId: game.id, round: fromRound + 1, court, teamAId: a, teamBId: b, scoreA: null, scoreB: null });
  }
  return next;
}
