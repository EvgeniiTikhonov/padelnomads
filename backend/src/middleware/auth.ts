import express, { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';
import type { Role } from '@prisma/client';

export interface JwtPayload { sub: string; role: Role; type: 'access' | 'refresh'; }
export interface AuthRequest extends express.Request { userId?: string; userRole?: Role; }

export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    if (decoded.type !== 'access') return next(new AppError(401, 'Invalid token', 'UNAUTHORIZED'));
    const user = await prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, role: true } });
    if (!user) return next(new AppError(401, 'User not found', 'UNAUTHORIZED'));
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId || !req.userRole) return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    if (!roles.includes(req.userRole)) return next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
    next();
  };
}
