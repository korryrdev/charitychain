import { prisma } from '@charitychain/database';
import { afterAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { createNotificationDeliveryService } from '../../src/modules/notifications/notificationDelivery.service.js';
import { createNotificationsService } from '../../src/modules/notifications/notifications.service.js';
import { notificationsRepository } from '../../src/modules/notifications/notifications.repository.js';

const run = Date.now();
const address = '254700123456';
const createdIds = [];
let shouldFail = false;
let sends = 0;
const smsProviderFactory = () => ({ name: 'test-sms', async send({ to, message }) { sends += 1; if (shouldFail) throw new Error('simulated delivery failure'); return { providerMessageId: `notification-${run}-${sends}`, to, message }; } });
const delivery = createNotificationDeliveryService({ repository: notificationsRepository, smsProviderFactory });
const service = createNotificationsService({ repository: notificationsRepository, delivery });
const administrator = { user: { id: '00000000-0000-0000-0000-000000000001' }, permissions: [PERMISSIONS.SYSTEM_ADMINISTER] };
const recipient = { user: { id: '00000000-0000-0000-0000-000000000002' }, permissions: [] };
let successful;
let failed;

afterAll(async () => {
  await prisma.notificationDelivery.deleteMany({ where: { notificationId: { in: createdIds } } });
  await prisma.notification.deleteMany({ where: { id: { in: createdIds } } });
}, 60_000);

describe('Section 27 notifications', () => {
  it('renders and delivers idempotent SMS notifications without persisting the raw recipient address', async () => {
    await expect(service.create({ user: {}, permissions: [] }, { recipientAddress: address, channel: 'SMS', templateCode: 'DONATION_STATUS', variables: { reference: 'MAL-TEST', status: 'CONFIRMED' }, idempotencyKey: `notify-${run}-success` })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    successful = await service.create(administrator, { recipientUserId: recipient.user.id, recipientAddress: address, channel: 'SMS', templateCode: 'DONATION_STATUS', variables: { reference: 'MAL-TEST', status: 'CONFIRMED' }, idempotencyKey: `notify-${run}-success`, maximumAttempts: 3 });
    createdIds.push(successful.id);
    expect(successful).toMatchObject({ status: 'DELIVERED', recipientAddressLast4: '3456', attemptCount: 1 });
    expect(successful.body).toContain('MAL-TEST');
    expect(JSON.stringify(successful)).not.toContain(address);
    expect((await service.create(administrator, { recipientUserId: recipient.user.id, recipientAddress: address, channel: 'SMS', templateCode: 'DONATION_STATUS', variables: { reference: 'MAL-TEST', status: 'CONFIRMED' }, idempotencyKey: `notify-${run}-success`, maximumAttempts: 3 })).id).toBe(successful.id);
    expect(sends).toBe(1);
  });

  it('records provider failures, verifies address ownership on retry and respects recipient visibility', async () => {
    shouldFail = true;
    failed = await service.create(administrator, { recipientUserId: recipient.user.id, recipientAddress: address, channel: 'SMS', templateCode: 'SECURITY_ALERT', variables: { message: 'Please review your account.' }, idempotencyKey: `notify-${run}-failure`, maximumAttempts: 2 });
    createdIds.push(failed.id);
    expect(failed).toMatchObject({ status: 'FAILED', attemptCount: 1 });
    expect(failed.deliveries.at(-1)).toMatchObject({ status: 'FAILED' });
    await expect(service.get({ user: { id: '00000000-0000-0000-0000-000000000003' }, permissions: [] }, failed.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await service.get(recipient, failed.id)).id).toBe(failed.id);
    await expect(service.retry(administrator, failed.id, '254799999999')).rejects.toMatchObject({ code: 'CONFLICT' });
    shouldFail = false;
    const retried = await service.retry(administrator, failed.id, address);
    expect(retried).toMatchObject({ status: 'DELIVERED', attemptCount: 2 });
  });

  it('delivers in-app notifications without an SMS provider call', async () => {
    const inApp = await service.create(administrator, { recipientUserId: recipient.user.id, recipientAddress: 'in-app-recipient', channel: 'IN_APP', templateCode: 'APPLICATION_STATUS', variables: { reference: 'APP-1', status: 'VERIFIED' }, idempotencyKey: `notify-${run}-inapp` });
    createdIds.push(inApp.id);
    expect(inApp.status).toBe('DELIVERED');
    expect((await service.mine(recipient)).map(({ id }) => id)).toEqual(expect.arrayContaining([successful.id, failed.id, inApp.id]));
  });
});
