import { z } from 'zod';

const email = z.email().transform((value) => value.trim().toLowerCase());
const password = z.string().min(12).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password
});
export const loginSchema = z.object({ email, password });
export const emailSchema = z.object({ email });
export const tokenSchema = z.object({ token: z.string().min(32).max(512) });
export const verifyAccountSchema = tokenSchema.extend({ email });
export const resetPasswordSchema = tokenSchema.extend({ userId: z.uuid(), password });
export const passwordSchema = z.object({ password });
export const mfaCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  trustDevice: z.boolean().default(false)
});
