import { Router } from 'express';
import { z } from 'zod';
import { listApplicationsForAdmin, getApplicationById, reviewApplication } from '../services/applicationService.js';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const reviewSchema = z.object({ decision: z.enum(['approved', 'rejected']) });

export const adminApplicationsRouter = Router();
adminApplicationsRouter.use(requireAuth, requireRole('admin'));

adminApplicationsRouter.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    res.json(await listApplicationsForAdmin(status && ['pending', 'approved', 'rejected'].includes(status) ? { status: status as 'pending' | 'approved' | 'rejected' } : {}));
  } catch (e) { next(e); }
});

adminApplicationsRouter.get('/:id', async (req, res, next) => {
  try {
    res.json(await getApplicationById(req.params.id));
  } catch (e) { next(e); }
});

adminApplicationsRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = reviewSchema.parse(req.body);
    res.json(await reviewApplication(req.params.id, body.decision, req.userId!));
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});
