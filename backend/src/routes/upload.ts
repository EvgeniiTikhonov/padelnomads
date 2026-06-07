import { Router } from 'express';
import { uploadProof, getProofUrl } from '../lib/upload.js';
import { requireAuth } from '../middleware/auth.js';

export const uploadRouter = Router();

uploadRouter.post('/proof', requireAuth, uploadProof.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = getProofUrl(req.file.filename);
    res.json({ url: `${req.protocol}://${req.get('host')}${url}` });
  } catch (e) { next(e); }
});
