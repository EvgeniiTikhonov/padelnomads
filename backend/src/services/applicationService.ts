import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApplicationStatus } from '@prisma/client';
import type { ApplicationSubmitInput } from '../schemas/application.js';

export async function submitApplication(userId: string | null, data: ApplicationSubmitInput) {
  return prisma.application.create({
    data: { userId, level: data.level, preferredSide: data.preferredSide, proofOfSkillFileUrl: data.proofOfSkillFileUrl ?? null, gender: data.gender ?? null, referralSource: data.referralSource ?? null, status: 'pending' },
  });
}

export async function getMyApplications(userId: string) {
  return prisma.application.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function listApplicationsForAdmin(filters: { status?: ApplicationStatus } = {}) {
  return prisma.application.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
}

export async function getApplicationById(id: string) {
  const app = await prisma.application.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true, phone: true } } } });
  if (!app) throw new AppError(404, 'Application not found', 'NOT_FOUND');
  return app;
}

export async function reviewApplication(applicationId: string, decision: ApplicationStatus, reviewedBy: string) {
  if (decision !== 'approved' && decision !== 'rejected') throw new AppError(400, 'Decision must be approved or rejected', 'VALIDATION_ERROR');
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) throw new AppError(404, 'Application not found', 'NOT_FOUND');
  if (app.status !== 'pending') throw new AppError(400, 'Application already reviewed', 'CONFLICT');
  return prisma.application.update({
    where: { id: applicationId },
    data: { status: decision, reviewedAt: new Date(), reviewedBy },
    include: { user: true },
  });
}
