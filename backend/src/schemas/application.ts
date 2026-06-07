import { z } from 'zod';

export const applicationSubmitSchema = z.object({
  level: z.string().min(1),
  preferredSide: z.string().min(1),
  proofOfSkillFileUrl: z.string().url().optional(),
  gender: z.string().optional(),
  referralSource: z.string().optional(),
});

export type ApplicationSubmitInput = z.infer<typeof applicationSubmitSchema>;
