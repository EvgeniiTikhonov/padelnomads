import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

try {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  fs.mkdirSync(path.join(config.uploadDir, 'proofs'), { recursive: true });
} catch {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(config.uploadDir, 'proofs')),
  filename: (_req, file, cb) => cb(null, `proof-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || '.bin'}`),
});

export const uploadProof = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) return cb(new AppError(400, 'Invalid file type', 'VALIDATION_ERROR') as unknown as Error);
    cb(null, true);
  },
});

export function getProofUrl(filename: string): string {
  return `/uploads/proofs/${filename}`;
}
