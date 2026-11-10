'use strict';

import { assertCanReadCommittee } from './committee.policy.js';
import { committeeRepository } from './committee.repository.js';

export function createCommitteeService(repository = committeeRepository) { return {
  async list(auth) { assertCanReadCommittee(auth); return repository.list(); },
  async get(auth, id) { assertCanReadCommittee(auth); return repository.findMembership(id); },
  async mine(auth) { return repository.findCurrentByUser(auth.user.id); }
}; }
export const committeeService = createCommitteeService();
