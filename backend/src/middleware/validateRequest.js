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
        // Express 5 exposes req.query through a getter with no setter. Defining
        // an own property preserves the parsed, type-safe query for downstream
        // controllers instead of throwing a 500 on every validated query route.
        if (segment === 'query') {
          Object.defineProperty(request, 'query', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: result.data
          });
        } else {
          request[segment] = result.data;
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
