import pino from 'pino';
import { loggingConfig } from '../config/logging.js';

export const logger = pino({
  level: loggingConfig.level,
  redact: {
    paths: loggingConfig.redactPaths,
    censor: '[REDACTED]'
  }
});
