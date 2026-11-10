import { prisma } from '@charitychain/database';
import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { auditLogsService } from '../../src/modules/auditLogs/auditLogs.service.js';

const run = Date.now();
const writer = { user: {}, permissions: [PERMISSIONS.SYSTEM_ADMINISTER] };
const reader = { user: {}, permissions: [PERMISSIONS.AUDIT_READ] };
let first;
let second;

describe('Section 24 append-only audit logs', () => {
  it('requires governance permission and records a sanitized, commitment-linked event', async () => {
    await expect(auditLogsService.record({ user: {}, permissions: [] }, {
      action: `TEST_AUDIT_${run}`, entityType: 'TEST', entityId: 'one'
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });

    first = await auditLogsService.record(writer, {
      action: `TEST_AUDIT_CREATE_${run}`, outcome: 'SUCCESS', entityType: 'TEST_AUDIT', entityId: `entity-${run}`,
      requestId: `request-${run}`, requestMethod: 'POST', requestPath: '/test/audit', ipAddress: '127.0.0.1',
      userAgent: 'vitest', reason: 'audit lifecycle test', before: { status: 'DRAFT' }, after: { status: 'CONFIRMED' },
      metadata: { safe: 'visible', password: 'never-store', nested: { token: 'never-store', value: 1 } }
    });
    expect(first).toMatchObject({ action: `TEST_AUDIT_CREATE_${run}`, outcome: 'SUCCESS' });
    expect(first.eventHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.beforeCommitment).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.afterCommitment).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.ipAddressHash).not.toContain('127.0.0.1');
    expect(first.metadata).toEqual({ safe: 'visible', nested: { value: 1 } });
  });

  it('creates a hash chain, supports authorized search/export, and verifies the entire ledger', async () => {
    second = await auditLogsService.record(writer, {
      action: `TEST_AUDIT_UPDATE_${run}`, outcome: 'FAILURE', entityType: 'TEST_AUDIT', entityId: `entity-${run}`,
      requestId: `request-${run}`, reason: 'expected test failure'
    });
    expect(second.previousHash).toBe(first.eventHash);
    await expect(auditLogsService.search({ user: {}, permissions: [] }, { entityType: 'TEST_AUDIT' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const search = await auditLogsService.search(reader, { entityType: 'TEST_AUDIT', requestId: `request-${run}` });
    expect(search.items.map(({ id }) => id)).toEqual([second.id, first.id]);
    expect((await auditLogsService.export(reader, { entityType: 'TEST_AUDIT' })).events.length).toBeGreaterThanOrEqual(2);
    expect(await auditLogsService.verify(reader)).toMatchObject({ valid: true });
  });

  it('rejects database updates and deletes, preserving append-only evidence', async () => {
    await expect(prisma.auditEvent.update({ where: { id: first.id }, data: { action: 'TAMPERED' } })).rejects.toThrow('append-only');
    await expect(prisma.auditEvent.delete({ where: { id: second.id } })).rejects.toThrow('append-only');
    expect((await prisma.auditEvent.findUniqueOrThrow({ where: { id: first.id } })).eventHash).toBe(first.eventHash);
  });
});
