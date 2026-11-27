import { z } from 'zod';
import {
  findMustProgramme,
  findMustProgrammeAnywhere,
  findMustSchool,
  maxYearsForSelection
} from '@charitychain/shared';

export const STUDENT_EMAIL_REGEX = /^[a-zA-Z]+\d{6}@students\.must\.ac\.ke$/i;
export const STUDENT_REG_NO_REGEX = /^[A-Z]{2}\d{3}\/\d{6}\/\d{2}$/;
const portalRole = z.enum(['STUDENT', 'DONOR', 'ADMIN', 'SECRETARIAT']).optional();
const portal = z.enum(['student', 'donor', 'staff']).optional();

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
        'Use a valid university registration number (format: CTxxx/xxxxxx/yy).'
      ),
    school: z.string().trim().min(2, 'Select your school.').max(120),
    programme: z.string().trim().min(2, 'Select or enter your programme.').max(150),
    yearOfStudy: z.coerce.number().int().min(1).max(5)
  })
  .superRefine((data, ctx) => {
    refinePortalEmail({ ...data, role: 'STUDENT' }, ctx);
    const school = findMustSchool(data.school);
    if (!school) {
      ctx.addIssue({
        code: 'custom',
        path: ['school'],
        message: 'Select a valid MUST school.'
      });
      return;
    }
    const matchedInSchool = findMustProgramme(school.code, data.programme);
    if (!matchedInSchool) {
      const elsewhere = findMustProgrammeAnywhere(data.programme);
      if (elsewhere) {
        ctx.addIssue({
          code: 'custom',
          path: ['programme'],
          message: `That programme belongs to ${elsewhere.school.name}.`
        });
        return;
      }
    }
    const maxYears = maxYearsForSelection(school.code, data.programme);
    if (data.yearOfStudy > maxYears) {
      ctx.addIssue({
        code: 'custom',
        path: ['yearOfStudy'],
        message: `Year of study cannot exceed ${maxYears} for the selected programme.`
      });
    }
  });

export const loginSchema = z
  .object({
    email: rawEmail,
    password,
    role: portalRole,
    portal
  })
  .superRefine(refinePortalEmail);

export const emailSchema = z.object({ email });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password
});
export const tokenSchema = z.object({ token: z.string().min(32).max(512) });
export const verifyAccountSchema = tokenSchema.extend({ email });
export const resetPasswordSchema = tokenSchema.extend({ userId: z.uuid(), password });
export const passwordSchema = z.object({ password });
export const mfaCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  trustDevice: z.boolean().default(false)
});
