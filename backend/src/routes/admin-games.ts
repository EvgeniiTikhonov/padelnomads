import { Router } from 'express';
import { z } from 'zod';
import { createGame, updateGame, addPlayerToGame, removePlayerFromGame, recordResult } from '../services/adminGameService.js';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { GAME_LEVELS } from '../lib/levels.js';

const createGameSchema = z.object({
  date: z.string().transform((s) => new Date(s)),
  time: z.string().min(1),
  venue: z.string().min(1),
  price: z.number().min(0),
  level: z.enum(GAME_LEVELS),
  format: z.string().min(1),
  capacity: z.number().int().min(1),
});
const updateGameSchema = createGameSchema.partial().extend({ status: z.enum(['open', 'ongoing', 'completed', 'cancelled']).optional() });
const recordResultSchema = z.object({
  scores: z.record(z.unknown()),
  players: z.array(z.object({ userId: z.string(), isWinner: z.boolean(), pointsScored: z.number().int().min(0) })),
});

export const adminGamesRouter = Router();
adminGamesRouter.use(requireAuth, requireRole('admin'));

adminGamesRouter.get('/', async (_req, res, next) => {
  try {
    const games = await prisma.game.findMany({
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
      include: { _count: { select: { registrations: { where: { status: 'registered' } } } } },
    });
    res.json(games);
  } catch (e) { next(e); }
});

adminGamesRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = createGameSchema.parse(req.body);
    res.status(201).json(await createGame(req.userId!, body));
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

adminGamesRouter.get('/:id', async (req, res, next) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      include: {
        registrations: { where: { status: 'registered' }, include: { user: { select: { id: true, name: true, email: true } } } },
        result: { include: { players: { include: { user: { select: { id: true, name: true } } } } } },
      },
    });
    if (!game) return next(new AppError(404, 'Game not found', 'NOT_FOUND'));
    res.json(game);
  } catch (e) { next(e); }
});

adminGamesRouter.patch('/:id', async (req, res, next) => {
  try {
    const body = updateGameSchema.parse(req.body);
    res.json(await updateGame(req.params.id, body));
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

adminGamesRouter.post('/:id/players', async (req, res, next) => {
  try {
    const userId = z.object({ userId: z.string() }).parse(req.body).userId;
    res.json(await addPlayerToGame(req.params.id, userId));
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

adminGamesRouter.delete('/:id/players/:userId', async (req, res, next) => {
  try {
    res.json(await removePlayerFromGame(req.params.id, req.params.userId));
  } catch (e) { next(e); }
});

adminGamesRouter.post('/:id/result', async (req: AuthRequest, res, next) => {
  try {
    const body = recordResultSchema.parse(req.body);
    res.status(201).json(await recordResult(req.params.id, req.userId!, body));
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});
