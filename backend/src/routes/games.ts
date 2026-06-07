import { Router } from 'express';
import { z } from 'zod';
import { listGames, getGameById, registerForGame, cancelRegistration } from '../services/gameService.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const querySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  level: z.string().optional(),
  status: z.enum(['open', 'ongoing', 'completed', 'cancelled']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

export const gamesRouter = Router();

gamesRouter.get('/', async (req, res, next) => {
  try {
    const q = querySchema.safeParse(req.query);
    const filters = q.success ? {
      dateFrom: q.data.dateFrom ? new Date(q.data.dateFrom + 'T00:00:00Z') : undefined,
      dateTo: q.data.dateTo ? new Date(q.data.dateTo + 'T23:59:59Z') : undefined,
      level: q.data.level,
      status: q.data.status,
      minPrice: q.data.minPrice,
      maxPrice: q.data.maxPrice,
    } : {};
    res.json(await listGames(filters));
  } catch (e) { next(e); }
});

gamesRouter.get('/:id', async (req, res, next) => {
  try {
    res.json(await getGameById(req.params.id));
  } catch (e) { next(e); }
});

gamesRouter.post('/:id/register', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    res.json(await registerForGame(req.params.id, req.userId!));
  } catch (e) { next(e); }
});

gamesRouter.delete('/:id/register', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    res.json(await cancelRegistration(req.params.id, req.userId!));
  } catch (e) { next(e); }
});
