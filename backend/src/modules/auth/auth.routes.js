import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authController } from './auth.controller.js';
import { authService } from './auth.service.js';
import {
  emailSchema,
  loginSchema,
  mfaCodeSchema,
  passwordSchema,
  registerSchema,
  studentRegisterSchema,
  resetPasswordSchema,
  verifyAccountSchema
} from './auth.validation.js';

export function createAuthRouter(controller = authController) {
  const router = Router();
  router.post('/register', validateRequest({ body: registerSchema }), controller.register);
  router.post('/register-student', validateRequest({ body: studentRegisterSchema }), controller.registerStudent);
  router.post(
    '/verify-account',
    validateRequest({ body: verifyAccountSchema }),
    controller.verifyAccount
  );
  router.post('/login', validateRequest({ body: loginSchema }), controller.login);
  router.post('/demo-login', async (req, res, next) => {
    try {
      const { email, role } = req.body || {};
      const result = await authService.demoLogin({ email, role });
      res.cookie('charitychain_session', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 730 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });
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
