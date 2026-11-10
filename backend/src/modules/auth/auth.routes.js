import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authController } from './auth.controller.js';
import {
  emailSchema,
  loginSchema,
  mfaCodeSchema,
  passwordSchema,
  registerSchema,
  resetPasswordSchema,
  verifyAccountSchema
} from './auth.validation.js';

export function createAuthRouter(controller = authController) {
  const router = Router();
  router.post('/register', validateRequest({ body: registerSchema }), controller.register);
  router.post(
    '/verify-account',
    validateRequest({ body: verifyAccountSchema }),
    controller.verifyAccount
  );
  router.post('/login', validateRequest({ body: loginSchema }), controller.login);
  router.post('/logout', controller.logout);
  router.post(
    '/password-reset/request',
    validateRequest({ body: emailSchema }),
    controller.requestPasswordReset
  );
  router.post(
    '/password-reset/complete',
    validateRequest({ body: resetPasswordSchema }),
    controller.resetPassword
  );
  router.post('/mfa/enable', validateRequest({ body: passwordSchema }), controller.enableMfa);
  router.post('/mfa/verify', validateRequest({ body: mfaCodeSchema }), controller.verifyMfa);
  return router;
}

export const authRouter = createAuthRouter();
