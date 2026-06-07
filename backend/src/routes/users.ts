import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const updateProfileSchema = z.object({ bio: z.string().max(1000).optional(), photoUrl: z.string().url().optional().nullable() });
const updateSettingsSchema = z.object({ name: z.string().min(1).max(200).optional(), notificationPrefs: z.object({ email: z.boolean().optional(), sms: z.boolean().optional(), push: z.boolean().optional() }).optional() });

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, phone: true, name: true, role: true, emailVerified: true, phoneVerified: true, createdAt: true, profile: true },
    });
    if (!user) return next(new AppError(404, 'User not found', 'NOT_FOUND'));
    res.json(user);
  } catch (e) { next(e); }
});

usersRouter.patch('/me', async (req: AuthRequest, res, next) => {
  try {
    const body = updateSettingsSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: body.name ? { name: body.name } : undefined,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    res.json(user);
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

usersRouter.patch('/me/profile', async (req: AuthRequest, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const profile = await prisma.profile.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId!, bio: body.bio ?? null, photoUrl: body.photoUrl ?? null, completedAt: new Date() },
      update: { bio: body.bio, photoUrl: body.photoUrl, ...(body.bio !== undefined || body.photoUrl !== undefined ? { completedAt: new Date() } : {}) },
    });
    res.json(profile);
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

usersRouter.patch('/me/settings', async (req: AuthRequest, res, next) => {
  try {
    const body = updateSettingsSchema.parse(req.body);
    if (body.notificationPrefs) {
      await prisma.profile.upsert({
        where: { userId: req.userId! },
        create: { userId: req.userId!, notificationPrefs: body.notificationPrefs as object },
        update: { notificationPrefs: body.notificationPrefs as object },
      });
    }
    res.json({ message: 'Settings updated' });
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});
