import { Router } from 'express';
import { z } from 'zod';
import { signUp, requestOtp, verifyOtp, login, refreshTokens, logout } from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';

const signUpSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8),
  name: z.string().min(1).max(200),
}).refine((d) => d.email || d.phone, { message: 'Email or phone required' });

const otpSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  code: z.string().length(6).optional(),
}).refine((d) => d.email || d.phone, { message: 'Email or phone required' });

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(1),
}).refine((d) => d.email || d.phone, { message: 'Email or phone required' });

export const authRouter = Router();

authRouter.post('/signup', async (req, res, next) => {
  try {
    const body = signUpSchema.parse(req.body);
    const user = await signUp(body);
    res.status(201).json(user);
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

authRouter.post('/request-otp', async (req, res, next) => {
  try {
    const body = otpSchema.pick({ email: true, phone: true }).parse(req.body);
    res.json(await requestOtp(body));
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const body = otpSchema.parse(req.body);
    res.json(await verifyOtp({ email: body.email, phone: body.phone, code: body.code! }));
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const tokens = await login(body);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken: tokens.accessToken, expiresAt: tokens.expiresAt });
  } catch (e) {
    if (e instanceof z.ZodError) return next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
    next(e);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
    if (!token) return next(new AppError(401, 'Refresh token required', 'UNAUTHORIZED'));
    const tokens = await refreshTokens(token);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken: tokens.accessToken, expiresAt: tokens.expiresAt });
  } catch (e) { next(e); }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    await logout(req.cookies?.refreshToken ?? req.body?.refreshToken);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (e) { next(e); }
});
