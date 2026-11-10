import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STATUSES } from '../../src/constants/statuses.js';
import { accountVerificationService } from '../../src/modules/auth/accountVerification.service.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { assertAdministratorRemains } from '../../src/modules/roles/roles.policy.js';
import { sessionsService } from '../../src/modules/sessions/sessions.service.js';
import { usersService } from '../../src/modules/users/users.service.js';

const email = `section7-${Date.now()}@example.test`;
const password = 'Section7-Strong-Password-42!';
let userId;

beforeAll(async () => {
  await prisma.permission.upsert({
    where: { code: 'donation:create' },
    update: {},
    create: { code: 'donation:create' }
  });
  const role = await prisma.role.upsert({
    where: { code: 'DONOR' },
    update: {},
    create: { code: 'DONOR', name: 'Donor' }
  });
  const permission = await prisma.permission.findUniqueOrThrow({
    where: { code: 'donation:create' }
  });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    update: {},
    create: { roleId: role.id, permissionId: permission.id }
  });
});

afterAll(async () => {
  if (userId) await prisma.user.deleteMany({ where: { id: userId } });
});

describe('Section 7 authentication and access control integration', () => {
  it('registers through Better Auth and assigns the default donor role', async () => {
    const result = await authService.register({ name: 'Section Seven User', email, password });
    userId = result.user.id;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });
    expect(user).toMatchObject({
      email,
      status: STATUSES.USER.PENDING_VERIFICATION,
      emailVerified: false
    });
    expect(user.roles.map((item) => item.role.code)).toContain('DONOR');
    expect(await prisma.account.count({ where: { userId, providerId: 'credential' } })).toBe(1);
  }, 30_000);

  it('blocks login before verification and activates only with a one-use token', async () => {
    await expect(authService.login({ email, password }, new Headers())).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_VERIFIED'
    });
    const token = await accountVerificationService.issue(email);
    await accountVerificationService.verify(email, token);
    await expect(accountVerificationService.verify(email, token)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED'
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user).toMatchObject({ status: STATUSES.USER.ACTIVE, emailVerified: true });
  });

  it('creates a database session and resolves roles and permissions', async () => {
    const result = await authService.login({ email, password }, new Headers());
    expect(result.headers).toBeInstanceOf(Headers);
    const session = await prisma.session.findFirstOrThrow({ where: { userId } });
    const resolved = await authService.resolveSession(session.token);
    expect(resolved.roles).toContain('DONOR');
    expect(resolved.permissions).toContain('donation:create');
    const auth = {
      user: resolved.user,
      session,
      roles: resolved.roles,
      permissions: resolved.permissions
    };
    const sessions = await sessionsService.list(auth);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).not.toHaveProperty('token');
    expect(sessions[0].current).toBe(true);
  }, 30_000);

  it('updates a user profile without exposing credential data', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const auth = { user, permissions: [] };
    const updated = await usersService.updateProfile(auth, userId, { name: 'Updated User' });
    expect(updated.name).toBe('Updated User');
    expect(updated).not.toHaveProperty('password');
  });

  it('revokes a user-owned session and removes it from the database', async () => {
    const session = await prisma.session.findFirstOrThrow({ where: { userId } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const auth = { user, session, permissions: [] };
    await sessionsService.revoke(auth, session.id);
    expect(await prisma.session.count({ where: { id: session.id } })).toBe(0);
  });

  it('prevents removal of the final administrator', () => {
    expect(() => assertAdministratorRemains('ADMINISTRATOR', 1)).toThrow(
      'The final administrator role assignment cannot be removed.'
    );
    expect(() => assertAdministratorRemains('ADMINISTRATOR', 2)).not.toThrow();
  });
});
