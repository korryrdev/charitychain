export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const studentEmailPattern = /^[a-zA-Z]+\d{6}@students\.must\.ac\.ke$/i;
export const PORTAL_ROLES = Object.freeze(['STUDENT', 'DONOR', 'ADMIN', 'SECRETARIAT'] as const);
export type PortalRoleCode = (typeof PORTAL_ROLES)[number];

export interface PortalRoleOption {
  id: PortalRoleCode;
  label: string;
  description: string;
  staff: boolean;
}

export const PORTAL_ROLE_OPTIONS: readonly PortalRoleOption[] = Object.freeze([
  { id: 'STUDENT', label: 'Student', description: 'Apply for support', staff: false },
  { id: 'DONOR', label: 'Donor', description: 'Give money or goods', staff: false },
  { id: 'ADMIN', label: 'Admin', description: 'Platform administration', staff: true },
  { id: 'SECRETARIAT', label: 'Secretariat', description: 'Records and committee office', staff: true }
]);

type AuthFormValues = Record<string, any>;
type ValidationRule = (value: any, values: AuthFormValues) => string | null;

function errorsFor(values: AuthFormValues, rules: Record<string, ValidationRule>): Record<string, string> {
  return Object.entries(rules).reduce<Record<string, string>>((errors, [field, rule]) => {
    const message = rule(values[field], values);
    if (message) errors[field] = message;
    return errors;
  }, {});
}

export function validatePortalEmail(value: unknown, role: string = 'STUDENT'): string | null {
  const trimmed = String(value ?? '').trim();
  if (role === 'STUDENT') {
    return studentEmailPattern.test(trimmed) ? null : 'Incorrect email';
  }
  return emailPattern.test(trimmed) ? null : 'Enter a valid email address.';
}

export function validateRegistration(values: AuthFormValues, options: { role?: string } = {}): Record<string, string> {
  const role = options.role ?? values?.role ?? 'STUDENT';
  return errorsFor(values, {
    name: (value) => (String(value ?? '').trim().length >= 2 ? null : 'Enter your full name.'),
    email: (value) => validatePortalEmail(value, role),
    password: (value) =>
      String(value ?? '').length >= 12 ? null : 'Use at least 12 characters for your password.',
    confirmPassword: (value, input) => (value === input.password ? null : 'Passwords do not match.')
  });
}

export function validateLogin(values: AuthFormValues, options: { role?: string } = {}): Record<string, string> {
  const role = options.role ?? values?.role ?? 'STUDENT';
  return errorsFor(values, {
    email: (value) => validatePortalEmail(value, role),
    password: (value) => (String(value ?? '').length > 0 ? null : 'Enter your password.')
  });
}

export function validateEmail(values: AuthFormValues): Record<string, string> {
  return errorsFor(values, {
    email: (value) => (emailPattern.test(String(value ?? '').trim()) ? null : 'Enter a valid email address.')
  });
}

export function validatePasswordReset(values: AuthFormValues): Record<string, string> {
  return {
    ...validateEmail(values),
    ...errorsFor(values, {
      token: (value) =>
        String(value ?? '').length >= 32 ? null : 'Use the complete password-reset token.',
      userId: (value) => (String(value ?? '').length > 0 ? null : 'A user identifier is required.'),
      password: (value) =>
        String(value ?? '').length >= 12 ? null : 'Use at least 12 characters for your password.',
      confirmPassword: (value, input) => (value === input.password ? null : 'Passwords do not match.')
    })
  };
}

export function validateMfa(values: AuthFormValues): Record<string, string> {
  return errorsFor(values, {
    code: (value) => (/^\d{6}$/.test(String(value ?? '')) ? null : 'Enter the six-digit code.')
  });
}
