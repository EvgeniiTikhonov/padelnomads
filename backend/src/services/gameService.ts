import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { GameStatus } from '@prisma/client';

export async function listGames(filters: { dateFrom?: Date; dateTo?: Date; level?: string; status?: GameStatus; minPrice?: number; maxPrice?: number }) {
  const where: Record<string, unknown> = {};
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) (where.date as Record<string, Date>).gte = filters.dateFrom;
    if (filters.dateTo) (where.date as Record<string, Date>).lte = filters.dateTo;
  }
  if (filters.level) where.level = filters.level;
  if (filters.status) where.status = filters.status;
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) (where.price as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice != null) (where.price as Record<string, number>).lte = filters.maxPrice;
  }
  return prisma.game.findMany({
    where,
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    include: { _count: { select: { registrations: { where: { status: 'registered' } } } } },
  });
}

export async function getGameById(id: string) {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      registrations: { where: { status: 'registered' }, include: { user: { select: { id: true, name: true } } } },
      _count: { select: { registrations: { where: { status: 'registered' } } } },
    },
  });
  if (!game) throw new AppError(404, 'Game not found', 'NOT_FOUND');
  return game;
}

export async function registerForGame(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, 'Game not found', 'NOT_FOUND');
  if (game.status !== 'open') throw new AppError(400, 'Game is not open for registration', 'CONFLICT');
  const count = await prisma.gameRegistration.count({ where: { gameId, status: 'registered' } });
  if (count >= game.capacity) throw new AppError(400, 'Game is full', 'CONFLICT');
  const existing = await prisma.gameRegistration.findUnique({ where: { gameId_userId: { gameId, userId } } });
  if (existing) {
    if (existing.status === 'registered') throw new AppError(400, 'Already registered', 'CONFLICT');
    await prisma.gameRegistration.update({ where: { id: existing.id }, data: { status: 'registered', cancelledAt: null } });
  } else {
    await prisma.gameRegistration.create({ data: { gameId, userId, status: 'registered' } });
  }
  return getGameById(gameId);
}

export async function cancelRegistration(gameId: string, userId: string) {
  const reg = await prisma.gameRegistration.findUnique({ where: { gameId_userId: { gameId, userId } } });
  if (!reg || reg.status !== 'registered') throw new AppError(404, 'Registration not found or already cancelled', 'NOT_FOUND');
  await prisma.gameRegistration.update({ where: { id: reg.id }, data: { status: 'cancelled', cancelledAt: new Date() } });
  return { message: 'Registration cancelled' };
}
