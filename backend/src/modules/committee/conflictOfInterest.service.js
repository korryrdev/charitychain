'use strict';

import { ConflictError } from '../../errors/ConflictError.js';
import { assertCanDeclareConflict, assertCanManageCommittee, assertCanReadCommittee } from './committee.policy.js';
import { committeeRepository } from './committee.repository.js';

export function createConflictOfInterestService(repository = committeeRepository) { return {
  async list(auth, applicationId) { assertCanReadCommittee(auth); return repository.listConflicts(applicationId); },
  async declare(auth, applicationId, input) { const [membership, application] = await Promise.all([repository.findMembership(input.membershipId), repository.findApplication(applicationId)]); if (!membership) throw new ConflictError('Committee membership not found.'); assertCanDeclareConflict(auth, membership); if (!['ACTIVE','SUSPENDED'].includes(membership.status) || membership.termEndsAt <= new Date()) throw new ConflictError('Only a current committee member can declare a new application conflict.'); if (!application || !['VERIFIED','MANUAL_REVIEW','AWAITING_APPROVALS'].includes(application.status)) throw new ConflictError('Conflicts can be declared only for applications under committee consideration.'); try { return await repository.declareConflict({ membershipId: membership.id, applicationId, type: input.type, description: input.description, declaredByUserId: auth.user.id }); } catch (error) { if (error.code === 'P2002') throw new ConflictError('This member already has a conflict declaration for the application.'); throw error; } },
  async resolve(auth, conflictId, input) { assertCanManageCommittee(auth); const conflict = await repository.findConflict(conflictId); if (!conflict) throw new ConflictError('Conflict declaration not found.'); if (conflict.status !== 'DECLARED') throw new ConflictError('The conflict declaration has already been resolved.'); if (conflict.membership.userId === auth.user.id) throw new ConflictError('A committee member cannot resolve their own conflict declaration.'); return repository.resolveConflict(conflictId, { status: input.status, resolutionNote: input.resolutionNote, resolvedByUserId: auth.user.id, resolvedAt: new Date() }); }
}; }
export const conflictOfInterestService = createConflictOfInterestService();
