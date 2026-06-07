import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { GameStatus } from '@prisma/client';
import { updateStatsFromResult } from './statsService.js';

export async function createGame(createdById: string, data: { date: Date; time: string; venue: string; price: number; level: string; format: string; capacity: number }) {
  return prisma.game.create({
    data: { ...data, price: new Decimal(data.price), createdById, status: 'open' },
  });
}

export async function updateGame(id: string, data: Partial<{ date: Date; time: string; venue: string; price: number; level: string; format: string; capacity: number; status: GameStatus }>) {
  const payload: Record<string, unknown> = { ...data };
  if (data.price != null) payload.price = new Decimal(data.price);
  return prisma.game.update({ where: { id }, data: payload as never });
}

export async function addPlayerToGame(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, 'Game not found', 'NOT_FOUND');
  if (game.status !== 'open') throw new AppError(400, 'Can only add players to open games', 'CONFLICT');
  const count = await prisma.gameRegistration.count({ where: { gameId, status: 'registered' } });
  if (count >= game.capacity) throw new AppError(400, 'Game is full', 'CONFLICT');
  await prisma.gameRegistration.upsert({
    where: { gameId_userId: { gameId, userId } },
    create: { gameId, userId, status: 'registered' },
    update: { status: 'registered', cancelledAt: null },
  });
  return prisma.game.findUnique({
    where: { id: gameId },
    include: { registrations: { where: { status: 'registered' }, include: { user: { select: { id: true, name: true } } } } },
  });
}

export async function removePlayerFromGame(gameId: string, userId: string) {
  const reg = await prisma.gameRegistration.findUnique({ where: { gameId_userId: { gameId, userId } } });
  if (!reg) throw new AppError(404, 'Registration not found', 'NOT_FOUND');
  await prisma.gameRegistration.update({ where: { id: reg.id }, data: { status: 'cancelled', cancelledAt: new Date() } });
  return { message: 'Player removed' };
}

export async function recordResult(gameId: string, recordedById: string, data: { scores: Record<string, unknown>; players: Array<{ userId: string; isWinner: boolean; pointsScored: number }> }) {
  const game = await prisma.game.findUnique({ where: { id: gameId }, include: { result: true } });
  if (!game) throw new AppError(404, 'Game not found', 'NOT_FOUND');
  if (game.result) throw new AppError(400, 'Result already recorded', 'CONFLICT');
  const result = await prisma.gameResult.create({
    data: {
      gameId,
      recordedById,
      scores: data.scores,
      players: { create: data.players.map((p) => ({ userId: p.userId, isWinner: p.isWinner, pointsScored: p.pointsScored })) },
    },
    include: { players: true },
  });
  await prisma.game.update({ where: { id: gameId }, data: { status: 'completed' } });
  await updateStatsFromResult(result.id);
  return result;
}
