import { STATUSES } from '../../constants/statuses.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

export function assertUserCanSignIn(user) {
  if (!user)
    throw new AuthenticationError('The email or password is incorrect.', {
      code: ERROR_CODES.INVALID_CREDENTIALS
    });
  if (user.status === STATUSES.USER.LOCKED) {
    throw new AuthenticationError('The account is temporarily locked.', {
      code: ERROR_CODES.ACCOUNT_LOCKED
    });
  }
  if (user.status !== STATUSES.USER.ACTIVE) {
    throw new AuthenticationError('The account must be verified before sign-in.', {
      code: ERROR_CODES.ACCOUNT_NOT_VERIFIED
    });
  }
}
