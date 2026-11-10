'use strict';

import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { env } from '../../config/environment.js';
export function assertPublicTransparencyEnabled() { if (!env.FEATURE_PUBLIC_TRANSPARENCY_ENABLED) throw new AppError({ message: 'Public transparency is disabled.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 }); }
