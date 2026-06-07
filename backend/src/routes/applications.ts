import { Router } from 'express';
import { z } from 'zod';
import { submitApplication, getMyApplications } from '../services/applicationService.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { applicationSubmitSchema } from '../schemas/application.js';

export const applicationsRouter = Router();

applicationsRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = applicationSubmitSchema.parse(req.body);
    const app = await submitApplication(req.userId ?? null, body);
    res.status(201).json(app);
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

applicationsRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    res.json(await getMyApplications(req.userId!));
  } catch (e) { next(e); }
});
