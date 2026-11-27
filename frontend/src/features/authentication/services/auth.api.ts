import { httpClient, type HttpClient } from '../../../services/httpClient';
import type { AuthResponse } from '../../../types/portal';

type AuthCredentials = { email: string };

export type LoginPortalCode = 'student' | 'donor' | 'staff';

export interface LoginInput {
  email: string;
  password: string;
  role?: string;
  /** Always sent from the portal's own page so the server can reject cross-portal sign-ins. */
  portal?: LoginPortalCode;
}

export interface RegistrationAccepted {
  requiresVerification: true;
  email: string;
}

export interface StudentRegistrationInput {
  name: string;
  email: string;
  password: string;
  registrationNumber: string;
  school: string;
  programme: string;
  yearOfStudy: number;
}

export interface MfaSetupResult {
  totpURI?: string;
  backupCodes?: string[];
}

function credentials<T extends AuthCredentials>(input: T): T {
  return { ...input, email: input.email.trim().toLowerCase() };
}

const publicAuthPath = (path: string): string => `/public/auth${path}`;

export function createAuthApi(client: Pick<HttpClient, 'post'> = httpClient) {
  return Object.freeze({
    register: (input: AuthCredentials) =>
      client.post<RegistrationAccepted>(publicAuthPath('/register'), credentials(input)),
    registerStudent: (input: StudentRegistrationInput) =>
      client.post<RegistrationAccepted>(publicAuthPath('/register-student'), credentials(input)),
    verifyAccount: (input: { email: string; token: string }) =>
      client.post(publicAuthPath('/verify-account'), credentials(input)),
    resendVerification: (email: string) =>
      client.post(publicAuthPath('/resend-verification'), { email: email.trim().toLowerCase() }),
    login: (input: LoginInput) => client.post<AuthResponse>(publicAuthPath('/login'), credentials({ ...input })),
    logout: () => client.post(publicAuthPath('/logout')),
    changePassword: (input: { currentPassword: string; newPassword: string }) =>
      client.post<AuthResponse>('/users/me/password', input),
    requestPasswordReset: (email: string) =>
      client.post(publicAuthPath('/password-reset/request'), { email: email.trim().toLowerCase() }),
    resetPassword: (input: Record<string, unknown>) =>
      client.post(publicAuthPath('/password-reset/complete'), input),
    enableMfa: (password: string) => client.post<MfaSetupResult>(publicAuthPath('/mfa/enable'), { password }),
    verifyMfa: (input: Record<string, unknown>) => client.post<AuthResponse>(publicAuthPath('/mfa/verify'), input),
  });
}

export const authApi = createAuthApi();
