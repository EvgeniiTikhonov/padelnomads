import { Router } from 'express';
import { getPlayerStats, getLeaderboardPosition } from '../services/statsService.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const stats = await getPlayerStats(req.userId!);
    const position = await getLeaderboardPosition(req.userId!);
    res.json({ stats, position });
  } catch (e) { next(e); }
});
