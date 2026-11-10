import express from 'express';
import { describe, expect, it, vi } from 'vitest';
import { connectDatabase } from '../../src/bootstrap/connectDatabase.js';
import { createGracefulShutdown } from '../../src/bootstrap/gracefulShutdown.js';
import { startWorkers } from '../../src/bootstrap/startWorkers.js';
import { validateEnvironment } from '../../src/bootstrap/validateEnvironment.js';
import { startServer } from '../../src/server.js';

const validEnvironment = Object.freeze({
  NODE_ENV: 'test',
  PORT: 3000,
  APP_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
  SESSION_SECRET: 'a'.repeat(32),
  ENCRYPTION_KEY: 'b'.repeat(32)
});

function createLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn()
  };
}

describe('backend bootstrap', () => {
  it('accepts a complete environment and rejects a missing required value', () => {
    expect(validateEnvironment(validEnvironment)).toBe(validEnvironment);
    expect(() => validateEnvironment({ ...validEnvironment, DATABASE_URL: '' })).toThrow(
      'Missing required environment values: DATABASE_URL'
    );
  });

  it('connects the database and propagates connection failures', async () => {
    const logger = createLogger();
    const database = { $connect: vi.fn().mockResolvedValue(undefined) };

    await expect(connectDatabase({ database, logger })).resolves.toBe(database);
    expect(database.$connect).toHaveBeenCalledOnce();

    const failure = new Error('database unavailable');
    database.$connect.mockRejectedValueOnce(failure);
    await expect(connectDatabase({ database, logger })).rejects.toBe(failure);
    expect(logger.error).toHaveBeenCalled();
  });

  it('rolls back previously started workers when a later worker fails', async () => {
    const firstWorker = { start: vi.fn(), stop: vi.fn() };
    const failure = new Error('worker failed');
    const secondWorker = { start: vi.fn().mockRejectedValue(failure), stop: vi.fn() };

    await expect(
      startWorkers([firstWorker, secondWorker], { logger: createLogger() })
    ).rejects.toBe(failure);
    expect(firstWorker.stop).toHaveBeenCalledOnce();
    expect(secondWorker.stop).not.toHaveBeenCalled();
  });

  it('performs shutdown cleanup once even when called repeatedly', async () => {
    const database = { $disconnect: vi.fn() };
    const worker = { stop: vi.fn() };
    const onComplete = vi.fn();
    const shutdown = createGracefulShutdown({
      database,
      workers: [worker],
      logger: createLogger(),
      onComplete
    });

    await Promise.all([shutdown('test'), shutdown('test-again')]);
    expect(worker.stop).toHaveBeenCalledOnce();
    expect(database.$disconnect).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('starts and gracefully stops an injected HTTP application', async () => {
    const database = {
      $connect: vi.fn(),
      $disconnect: vi.fn()
    };
    const worker = { start: vi.fn(), stop: vi.fn() };
    const app = express().get('/test', (_request, response) => response.sendStatus(204));

    const runtime = await startServer({
      environment: validEnvironment,
      database,
      logger: createLogger(),
      app,
      workers: [worker],
      port: 0,
      host: '127.0.0.1',
      installProcessSignalHandlers: false
    });

    expect(runtime.server.listening).toBe(true);
    expect(database.$connect).toHaveBeenCalledOnce();
    expect(worker.start).toHaveBeenCalledOnce();

    await runtime.shutdown('test');
    expect(runtime.server.listening).toBe(false);
    expect(worker.stop).toHaveBeenCalledOnce();
    expect(database.$disconnect).toHaveBeenCalledOnce();
  });
});
