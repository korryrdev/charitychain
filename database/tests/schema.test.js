import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('database foundation', () => {
  it('defines identity, sessions, permissions and audit events', async () => {
    const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
    for (const model of ['User', 'Role', 'Permission', 'Session', 'AuditEvent']) {
      expect(schema).toContain(`model ${model}`);
    }
  });
});
