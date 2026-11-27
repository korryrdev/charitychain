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
