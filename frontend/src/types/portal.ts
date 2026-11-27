import type { ReactNode } from 'react';

export interface PortalUser {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  twoFactorEnabled?: boolean;
  status?: string;
  registrationNumber?: string;
  /** Staff invited with a temporary password must change it before using the app. */
  mustChangePassword?: boolean;
  /** Admin and committee accounts must enrol MFA before using the app. */
  mfaEnrollmentRequired?: boolean;
}

export interface PortalSession {
  user?: PortalUser | null;
  session?: Record<string, unknown> | null;
  token?: string;
  roles?: string[];
  permissions?: string[];
  mfaVerified?: boolean;
  mfaRequired?: boolean;
}

export interface DataTableColumn<Row = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AsyncState<T> {
  pending: boolean;
  error: Error | null;
  data: T | null;
}

/** Body returned by login / MFA verification / password change. */
export interface AuthResponse {
  user?: PortalUser | null;
  session?: Record<string, unknown> | null;
  roles?: string[];
  permissions?: string[];
  role?: string;
  requiresMfa?: boolean;
  twoFactorRedirect?: boolean;
  mfaVerified?: boolean;
  mustChangePassword?: boolean;
  mfaEnrollmentRequired?: boolean;
}
