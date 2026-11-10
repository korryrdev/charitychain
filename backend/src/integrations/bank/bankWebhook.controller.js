'use strict';
import { mapBankWebhook } from './bankWebhook.validation.js';
export function createBankWebhookController({ onEvent }) { if (typeof onEvent !== 'function') throw new TypeError('Bank webhook handler is required.'); return { async receive(request, response, next) { try { await onEvent(mapBankWebhook(request.body)); response.status(202).json({ accepted: true }); } catch (error) { next(error); } } }; }
