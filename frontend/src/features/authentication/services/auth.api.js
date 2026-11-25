import { httpClient } from '../../../services/httpClient.js';
function credentials(input) { return { ...input, email: input.email.trim().toLowerCase() }; }
const publicAuthPath = (path) => `/public/auth${path}`;

export function createAuthApi(client = httpClient) { return Object.freeze({ register: (input) => client.post(publicAuthPath('/register'), credentials(input)), verifyAccount: (input) => client.post(publicAuthPath('/verify-account'), credentials(input)), login: (input) => client.post(publicAuthPath('/login'), credentials(input)), logout: () => client.post(publicAuthPath('/logout')), requestPasswordReset: (email) => client.post(publicAuthPath('/password-reset/request'), { email: email.trim().toLowerCase() }), resetPassword: (input) => client.post(publicAuthPath('/password-reset/complete'), input), enableMfa: (password) => client.post(publicAuthPath('/mfa/enable'), { password }), verifyMfa: (input) => client.post(publicAuthPath('/mfa/verify'), input) }); }
export const authApi = createAuthApi();
