import { Router } from 'express';
import { getLeaderboard } from '../services/statsService.js';
import { requireAuth } from '../middleware/auth.js';

export const leaderboardRouter = Router();
leaderboardRouter.use(requireAuth);

leaderboardRouter.get('/', async (req, res, next) => {
  try {
    const level = req.query.level as string | undefined;
    const timeframe = (req.query.timeframe as 'season' | 'overall') ?? 'overall';
    res.json(await getLeaderboard({ level, timeframe }));
  } catch (e) { next(e); }
});
