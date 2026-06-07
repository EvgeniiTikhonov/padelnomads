import { prisma } from '../lib/prisma.js';

export async function getPlayerStats(userId: string) {
  const stats = await prisma.playerStats.findUnique({ where: { userId } });
  return stats ?? { totalGames: 0, wins: 0, losses: 0, pointsScored: 0, pointsConceded: 0 };
}

export async function updateStatsFromResult(gameResultId: string) {
  const result = await prisma.gameResult.findUnique({ where: { id: gameResultId }, include: { players: true } });
  if (!result) return;
  for (const p of result.players) {
    await prisma.playerStats.upsert({
      where: { userId: p.userId },
      create: { userId: p.userId, totalGames: 1, wins: p.isWinner ? 1 : 0, losses: p.isWinner ? 0 : 1, pointsScored: p.pointsScored, pointsConceded: 0 },
      update: { totalGames: { increment: 1 }, wins: p.isWinner ? { increment: 1 } : undefined, losses: p.isWinner ? undefined : { increment: 1 }, pointsScored: { increment: p.pointsScored }, updatedAt: new Date() },
    });
  }
}

export async function getLeaderboard(filters: { level?: string; timeframe?: 'season' | 'overall' }) {
  const stats = await prisma.playerStats.findMany({
    orderBy: [{ wins: 'desc' }, { pointsScored: 'desc' }],
    include: { user: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } } },
    take: 100,
  });
  return stats.map((s, index) => ({
    rank: index + 1,
    userId: s.userId,
    name: s.user.name,
    photoUrl: s.user.profile?.photoUrl,
    totalGames: s.totalGames,
    wins: s.wins,
    losses: s.losses,
    pointsScored: s.pointsScored,
  }));
}

export async function getLeaderboardPosition(userId: string) {
  const stats = await prisma.playerStats.findUnique({ where: { userId } });
  if (!stats) return null;
  const above = await prisma.playerStats.count({
    where: { OR: [{ wins: { gt: stats.wins } }, { wins: stats.wins, pointsScored: { gt: stats.pointsScored } }] },
  });
  return { rank: above + 1, totalPlayers: above + (await prisma.playerStats.count()), ...stats };
}
