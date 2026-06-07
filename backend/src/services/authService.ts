import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Role } from '@prisma/client';
import type { JwtPayload } from '../middleware/auth.js';

const SALT_ROUNDS = 10;

function generateOtp(): string {
  let code = '';
  for (let i = 0; i < config.otp.length; i++) code += Math.floor(Math.random() * 10);
  return code;
}

export async function signUp(data: { email?: string; phone?: string; password: string; name: string }) {
  if (!data.email && !data.phone) throw new AppError(400, 'Email or phone is required', 'VALIDATION_ERROR');
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Email already registered', 'CONFLICT');
  }
  if (data.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) throw new AppError(409, 'Phone already registered', 'CONFLICT');
  }
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  return prisma.user.create({
    data: { email: data.email ?? null, phone: data.phone ?? null, passwordHash, name: data.name, role: 'player' },
    select: { id: true, email: true, phone: true, name: true, role: true },
  });
}

export async function requestOtp(data: { email?: string; phone?: string }) {
  if (!data.email && !data.phone) throw new AppError(400, 'Email or phone is required', 'VALIDATION_ERROR');
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);
  await prisma.otpCode.create({ data: { email: data.email ?? null, phone: data.phone ?? null, code, expiresAt } });
  if (config.nodeEnv === 'development') console.log('[OTP]', data.email ?? data.phone, code);
  return { message: 'OTP sent', expiresIn: config.otp.expiryMinutes * 60 };
}

export async function verifyOtp(data: { email?: string; phone?: string; code: string }) {
  if (!data.email && !data.phone) throw new AppError(400, 'Email or phone is required', 'VALIDATION_ERROR');
  const where = data.email ? { email: data.email, code: data.code } : { phone: data.phone!, code: data.code };
  const otp = await prisma.otpCode.findFirst({ where: { ...where, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
  if (!otp) throw new AppError(400, 'Invalid or expired OTP', 'INVALID_OTP');
  await prisma.otpCode.deleteMany({ where: { email: otp.email, phone: otp.phone } });
  const user = data.email ? await prisma.user.findUnique({ where: { email: data.email } }) : await prisma.user.findUnique({ where: { phone: data.phone } });
  if (user) await prisma.user.update({ where: { id: user.id }, data: data.email ? { emailVerified: true } : { phoneVerified: true } });
  return { verified: true };
}

export async function login(data: { email?: string; phone?: string; password: string }) {
  if (!data.email && !data.phone) throw new AppError(400, 'Email or phone is required', 'VALIDATION_ERROR');
  const user = data.email ? await prisma.user.findUnique({ where: { email: data.email } }) : await prisma.user.findUnique({ where: { phone: data.phone } });
  if (!user) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  const tokens = issueTokens(user.id, user.role);
  await prisma.refreshToken.create({ data: { userId: user.id, token: tokens.refreshToken, expiresAt: tokens.expiresAt } });
  return tokens;
}

function issueTokens(userId: string, role: Role) {
  const accessToken = jwt.sign({ sub: userId, role, type: 'access' } as JwtPayload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
  const refreshToken = jwt.sign({ sub: userId, role, type: 'refresh' } as JwtPayload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
  const decoded = jwt.decode(refreshToken) as { exp: number };
  return { accessToken, refreshToken, expiresAt: new Date(decoded.exp * 1000) };
}

export async function refreshTokens(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
    if (decoded.type !== 'refresh') throw new AppError(401, 'Invalid token', 'UNAUTHORIZED');
    const stored = await prisma.refreshToken.findFirst({ where: { token: refreshToken, userId: decoded.sub, expiresAt: { gt: new Date() } } });
    if (!stored) throw new AppError(401, 'Refresh token invalid or expired', 'UNAUTHORIZED');
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const user = await prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, role: true } });
    if (!user) throw new AppError(401, 'User not found', 'UNAUTHORIZED');
    const tokens = issueTokens(user.id, user.role);
    await prisma.refreshToken.create({ data: { userId: user.id, token: tokens.refreshToken, expiresAt: tokens.expiresAt } });
    return tokens;
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(401, 'Invalid refresh token', 'UNAUTHORIZED');
  }
}

export async function logout(refreshToken: string | undefined) {
  if (refreshToken) await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  return { message: 'Logged out' };
}
