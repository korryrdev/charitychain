import { readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { prisma } from '../client/prismaClient.js';

describe('database migrations', () => {
  it('includes both aldo PRD trigger migrations and kip student appeals migration', async () => {
    const entries = await readdir(new URL('../prisma/migrations', import.meta.url), {
      withFileTypes: true
    });
    const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    expect(dirs).toContain('20261110230000_prd_entities_and_triggers');
    expect(dirs).toContain('20261111010000_student_appeals');
  });

  it('has applied all migrations without failed records', async () => {
    const rows = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL
    `;
    const names = rows.map((row) => row.migration_name);
    expect(names).toContain('20261110230000_prd_entities_and_triggers');
    expect(names).toContain('20261111010000_student_appeals');
    expect(rows.every((row) => row.finished_at !== null)).toBe(true);
  });
});
