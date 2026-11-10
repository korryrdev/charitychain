import { describe, expect, it, vi } from 'vitest';
import { createJobRegistry } from '../../src/jobs/jobRegistry.js';
import { createJobRunner } from '../../src/jobs/jobRunner.js';
import { createScheduledJob } from '../../src/jobs/jobFactory.js';

describe('Section 34 background jobs', () => {
  it('rejects duplicate or malformed jobs before scheduling them', () => {
    expect(() => createJobRegistry([{ name: 'bad', intervalMs: 500, run: async () => {} }])).toThrow('at least 1000ms');
    const job = createScheduledJob({ name: 'ok', intervalMs: 1000, execute: async () => {} });
    expect(() => createJobRegistry([job, job])).toThrow('Duplicate job name');
  });

  it('runs registered jobs and records a successful status', async () => {
    const run = vi.fn(async () => ({ reconciled: 3 }));
    const registry = createJobRegistry([createScheduledJob({ name: 'sync', intervalMs: 1000, execute: run })]);
    const runner = createJobRunner({ registry, logger: { error: vi.fn() }, clock: () => new Date('2026-11-10T12:00:00Z') });
    await expect(runner.runNow('sync')).resolves.toEqual({ skipped: false, result: { reconciled: 3 } });
    expect(run).toHaveBeenCalledOnce();
    expect(runner.status()).toEqual([expect.objectContaining({ name: 'sync', status: 'SUCCEEDED', lastError: null })]);
  });

  it('contains job failures and exposes a safe error status', async () => {
    const logger = { error: vi.fn() };
    const registry = createJobRegistry([createScheduledJob({ name: 'failing', intervalMs: 1000, execute: async () => { throw new Error('provider unavailable'); } })]);
    const runner = createJobRunner({ registry, logger });
    await expect(runner.runNow('failing')).resolves.toMatchObject({ skipped: false, error: expect.any(Error) });
    expect(runner.status()).toEqual([expect.objectContaining({ status: 'FAILED', lastError: 'provider unavailable' })]);
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
