import { randomUUID } from 'node:crypto';

const validRequestId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export function requestContext(request, response, next) {
  const suppliedRequestId = request.get('x-request-id');
  request.id =
    suppliedRequestId && validRequestId.test(suppliedRequestId) ? suppliedRequestId : randomUUID();
  response.set('x-request-id', request.id);
  next();
}
