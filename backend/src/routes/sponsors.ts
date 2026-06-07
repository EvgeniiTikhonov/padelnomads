import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const sponsorsRouter = Router();
sponsorsRouter.use(requireAuth);

sponsorsRouter.get('/', async (_req, res, next) => {
  try {
    const sponsors = await prisma.sponsor.findMany({
      include: {
        promotions: {
          where: { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
        },
      },
    });
    res.json(sponsors);
  } catch (e) { next(e); }
});

sponsorsRouter.get('/:id/promotions', async (req, res, next) => {
  try {
    const promotions = await prisma.sponsorPromotion.findMany({
      where: {
        sponsorId: req.params.id,
        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(promotions);
  } catch (e) { next(e); }
});
