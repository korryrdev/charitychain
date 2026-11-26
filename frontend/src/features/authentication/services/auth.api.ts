import { httpClient, type HttpClient } from '../../../services/httpClient';

type AuthCredentials = Record<string, unknown> & { email: string };

function credentials<T extends AuthCredentials>(input: T): T {
  return { ...input, email: input.email.trim().toLowerCase() };
}

const publicAuthPath = (path: string): string => `/public/auth${path}`;

export function createAuthApi(client: Pick<HttpClient, 'post'> = httpClient) {
  return Object.freeze({
    register: (input: AuthCredentials) => client.post(publicAuthPath('/register'), credentials(input)),
    verifyAccount: (input: AuthCredentials) => client.post(publicAuthPath('/verify-account'), credentials(input)),
    login: (input: AuthCredentials) => client.post(publicAuthPath('/login'), credentials(input)),
    logout: () => client.post(publicAuthPath('/logout')),
    requestPasswordReset: (email: string) =>
      client.post(publicAuthPath('/password-reset/request'), { email: email.trim().toLowerCase() }),
    resetPassword: (input: Record<string, unknown>) =>
      client.post(publicAuthPath('/password-reset/complete'), input),
    enableMfa: (password: string) => client.post(publicAuthPath('/mfa/enable'), { password }),
    verifyMfa: (input: Record<string, unknown>) => client.post(publicAuthPath('/mfa/verify'), input),
  });
}

export const authApi = createAuthApi();
