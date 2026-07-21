import { z } from 'zod';
import { PADEL_LEVELS } from '../lib/levels.js';

export const applicationSubmitSchema = z.object({
  level: z.enum(PADEL_LEVELS),
  preferredSide: z.string().min(1),
  proofOfSkillFileUrl: z.string().url().optional(),
  gender: z.string().optional(),
  referralSource: z.string().optional(),
});

export type ApplicationSubmitInput = z.infer<typeof applicationSubmitSchema>;
