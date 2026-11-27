import { z } from 'zod';

export const STUDENT_EMAIL_REGEX = /^[a-zA-Z]+\d{6}@students\.must\.ac\.ke$/i;
export const STUDENT_REG_NO_REGEX = /^[A-Z]{2}\d{3}\/\d{6}\/\d{2}$/;
const portalRole = z.enum(['STUDENT', 'DONOR', 'ADMIN', 'SECRETARIAT']).optional();

const email = z.string().trim().toLowerCase().pipe(z.email());
const rawEmail = z.string().trim().toLowerCase();
const password = z.string().min(12).max(128);

function refinePortalEmail(data, ctx) {
  const isStudentEmail = data.email.endsWith('@students.must.ac.ke');
  if (data.role === 'STUDENT' || isStudentEmail) {
    if (!STUDENT_EMAIL_REGEX.test(data.email)) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Incorrect email'
      });
    }
    return;
  }

  const emailCheck = z.email().safeParse(data.email);
  if (!emailCheck.success) {
    for (const issue of emailCheck.error.issues) {
      ctx.addIssue({
        ...issue,
        path: ['email']
      });
    }
  }
}

const registerFields = {
  name: z.string().trim().min(2).max(100),
  email: rawEmail,
  password,
  role: portalRole
};

export const registerSchema = z.object(registerFields).superRefine(refinePortalEmail);
export const studentRegisterSchema = z
  .object({
    ...registerFields,
    registrationNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        STUDENT_REG_NO_REGEX,
        'Use a valid university registration number (e.g. CT206/204483/24 or CT201/000001/23).'
      )
  })
  .superRefine((data, ctx) => refinePortalEmail({ ...data, role: 'STUDENT' }, ctx));

export const loginSchema = z
  .object({
    email: rawEmail,
    password,
    role: portalRole
  })
  .superRefine(refinePortalEmail);

export const emailSchema = z.object({ email });
export const tokenSchema = z.object({ token: z.string().min(32).max(512) });
export const verifyAccountSchema = tokenSchema.extend({ email });
export const resetPasswordSchema = tokenSchema.extend({ userId: z.uuid(), password });
export const passwordSchema = z.object({ password });
export const mfaCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  trustDevice: z.boolean().default(false)
});
