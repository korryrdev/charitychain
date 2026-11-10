'use strict';
import { mapC2bCredit } from './c2b.adapter.js';
import { mapStkCallback } from './callback.validation.js';
export function createMpesaCallbackController({ onEvent }) { if (typeof onEvent !== 'function') throw new TypeError('M-Pesa callback handler is required.'); const handle = (mapper) => async (request, response, next) => { try { await onEvent(mapper(request.body)); response.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' }); } catch (error) { next(error); } }; return { stk: handle(mapStkCallback), c2b: handle(mapC2bCredit) }; }
