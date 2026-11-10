import { ValidationError } from '../errors/ValidationError.js';

function formatIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }));
}

export function validateRequest(schemas = {}) {
  const supportedSegments = ['params', 'query', 'body'];
  const unknownSegments = Object.keys(schemas).filter((key) => !supportedSegments.includes(key));
  if (unknownSegments.length > 0) {
    throw new TypeError(`Unsupported request schema segments: ${unknownSegments.join(', ')}`);
  }

  return async function requestValidation(request, _response, next) {
    try {
      for (const segment of supportedSegments) {
        const schema = schemas[segment];
        if (!schema) continue;
        const result = await schema.safeParseAsync(request[segment]);
        if (!result.success) {
          throw new ValidationError(
            `Invalid request ${segment}.`,
            formatIssues(result.error.issues)
          );
        }
        Object.defineProperty(request, segment, {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
