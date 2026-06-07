import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { applicationsRouter } from './routes/applications.js';
import { adminApplicationsRouter } from './routes/admin-applications.js';
import { gamesRouter } from './routes/games.js';
import { adminGamesRouter } from './routes/admin-games.js';
import { statsRouter } from './routes/stats.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { sponsorsRouter } from './routes/sponsors.js';
import { uploadRouter } from './routes/upload.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(config.apiPrefix, rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));

app.use(`${config.apiPrefix}/auth`, authRouter);
app.use(`${config.apiPrefix}/users`, usersRouter);
app.use(`${config.apiPrefix}/applications`, applicationsRouter);
app.use(`${config.apiPrefix}/admin/applications`, adminApplicationsRouter);
app.use(`${config.apiPrefix}/games`, gamesRouter);
app.use(`${config.apiPrefix}/admin/games`, adminGamesRouter);
app.use(`${config.apiPrefix}/stats`, statsRouter);
app.use(`${config.apiPrefix}/leaderboard`, leaderboardRouter);
app.use(`${config.apiPrefix}/sponsors`, sponsorsRouter);
app.use(`${config.apiPrefix}/upload`, uploadRouter);
app.get(`${config.apiPrefix}/health`, (_req, res) => res.json({ ok: true }));

app.use(errorHandler);
app.listen(config.port, () => console.log(`API at http://localhost:${config.port}${config.apiPrefix}`));
