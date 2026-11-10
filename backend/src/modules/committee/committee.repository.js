'use strict';

import { prisma } from '@charitychain/database';

const include = { user: { select: { id: true, name: true, email: true, status: true, emailVerified: true, twoFactorEnabled: true } }, history: { orderBy: { version: 'asc' } } };
const conflictInclude = { membership: { include: { user: { select: { id: true, name: true, email: true } } } }, application: { select: { id: true, reference: true, status: true } } };

export function createCommitteeRepository(database = prisma) { return {
  findUser(id) { return database.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, status: true, emailVerified: true, twoFactorEnabled: true } }); },
  findMembership(id) { return database.committeeMembership.findUnique({ where: { id }, include }); },
  findCurrentByUser(userId) { return database.committeeMembership.findFirst({ where: { userId, status: { in: ['ACTIVE','SUSPENDED'] } }, include }); },
  list() { return database.committeeMembership.findMany({ include, orderBy: [{ status: 'asc' }, { seat: 'asc' }, { appointedAt: 'desc' }] }); },
  async appoint(data, actorUserId, reason) { return database.$transaction(async (tx) => { const membership = await tx.committeeMembership.create({ data }); await tx.committeeMembershipHistory.create({ data: { membershipId: membership.id, fromStatus: null, toStatus: 'ACTIVE', actorUserId, reason, version: 1 } }); return tx.committeeMembership.findUniqueOrThrow({ where: { id: membership.id }, include }); }); },
  async transition(membership, status, actorUserId, reason, extra = {}) { return database.$transaction(async (tx) => { const version = membership.version + 1; const changed = await tx.committeeMembership.updateMany({ where: { id: membership.id, version: membership.version, status: membership.status }, data: { status, version, ...extra } }); if (!changed.count) return null; await tx.committeeMembershipHistory.create({ data: { membershipId: membership.id, fromStatus: membership.status, toStatus: status, actorUserId, reason, version } }); return tx.committeeMembership.findUniqueOrThrow({ where: { id: membership.id }, include }); }); },
  findApplication(id) { return database.assistanceApplication.findUnique({ where: { id }, select: { id: true, reference: true, status: true } }); },
  findConflict(id) { return database.committeeConflict.findUnique({ where: { id }, include: conflictInclude }); },
  listConflicts(applicationId) { return database.committeeConflict.findMany({ where: { applicationId }, include: conflictInclude, orderBy: { declaredAt: 'asc' } }); },
  declareConflict(data) { return database.committeeConflict.create({ data, include: conflictInclude }); },
  resolveConflict(id, data) { return database.committeeConflict.update({ where: { id }, data, include: conflictInclude }); }
}; }
export const committeeRepository = createCommitteeRepository();
