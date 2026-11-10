import { randomUUID } from 'node:crypto';
export const sandboxSmsAdapter = Object.freeze({ name: 'sandbox', async send({ to, message }) { return { providerMessageId: `SMS-${randomUUID()}`, to, accepted: true, messageLength: message.length }; } });
