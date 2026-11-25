import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { prisma } from '../client/prismaClient.js';

describe('database immutability constraints and append-only triggers', () => {
  it('defines PostgreSQL append-only mutation triggers in migrations', async () => {
    const sql = await readFile(
      new URL(
        '../prisma/migrations/20261110230000_prd_entities_and_triggers/migration.sql',
        import.meta.url
      ),
      'utf8'
    );
    expect(sql).toContain('CREATE TRIGGER case_events_append_only');
    expect(sql).toContain('CREATE TRIGGER allocations_append_only');
    expect(sql).toContain('CREATE TRIGGER donation_raw_callbacks_append_only');
  });

  it('installs all three append-only triggers in the active PostgreSQL database', async () => {
    const rows = await prisma.$queryRaw`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name IN (
          'case_events_append_only',
          'allocations_append_only',
          'donation_raw_callbacks_append_only'
        )
      ORDER BY trigger_name
    `;
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });
});
