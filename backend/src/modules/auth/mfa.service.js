import { authEngine } from './betterAuth.js';

export function createMfaService(engine = authEngine) {
  return {
    enable(password, headers) {
      return engine.api.enableTwoFactor({ body: { password, method: 'totp' }, headers });
    },
    verify(code, trustDevice, headers) {
      return engine.api.verifyTOTP({ body: { code, trustDevice }, headers });
    },
    disable(password, headers) {
      return engine.api.disableTwoFactor({ body: { password }, headers });
    },
    generateBackupCodes(password, headers) {
      return engine.api.generateBackupCodes({ body: { password }, headers });
    }
  };
}

export const mfaService = createMfaService();
