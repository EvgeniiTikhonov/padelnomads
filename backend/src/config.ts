import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? '/api',
  databaseUrl: process.env.DATABASE_URL!,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  otp: { expiryMinutes: 10, length: 6 },
  smtp: { host: 'localhost', port: 587, secure: false, user: undefined, pass: undefined, from: 'Padel Nomads <noreply@padelnomads.com>' },
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
};

if (!config.databaseUrl) throw new Error('DATABASE_URL is required');
if (!config.jwt.accessSecret || config.jwt.accessSecret.length < 32) throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32) throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
