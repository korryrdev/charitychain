'use strict';

import { ValidationError } from '../errors/ValidationError.js';
import { AuthorizationError } from '../errors/AuthorizationError.js';
import { ConflictError } from '../errors/ConflictError.js';

/**
 * Asserts a truthy condition or throws a ValidationError.
 *
 * @param {unknown} condition
 * @param {string} [message='Assertion failed.']
 * @param {typeof Error} [ErrorClass=ValidationError]
 */
export function assert(condition, message = 'Assertion failed.', ErrorClass = ValidationError) {
  if (!condition) {
    throw new ErrorClass(message);
  }
}

/**
 * Enforces segregation of duties in code (PRD Section 4.2).
 * e.g., Submitter cannot approve their own case, bank deposit entrant cannot verify it,
 * and a signatory cannot be the sole approver of their own disbursement.
 *
 * @param {string} actorId - ID of user attempting the action
 * @param {string} restrictedId - ID of user who created/submitted the record
 * @param {string} [message='Segregation of duties violation: cannot approve or verify own submission.']
 */
export function assertSegregation(
  actorId,
  restrictedId,
  message = 'Segregation of duties violation: cannot approve or verify own submission.'
) {
  if (actorId && restrictedId && String(actorId).trim() === String(restrictedId).trim()) {
    throw new AuthorizationError(message, {
      details: { actorId, restrictedId, rule: 'SEGREGATION_OF_DUTIES' }
    });
  }
}

/**
 * Asserts that the current resource state is one of the allowed states.
 * Throws ConflictError (409) if the transition is illegal.
 *
 * @param {string} currentState
 * @param {string|string[]} allowedStates
 * @param {string} [entityName='Resource']
 */
export function assertState(currentState, allowedStates, entityName = 'Resource') {
  const allowed = Array.isArray(allowedStates) ? allowedStates : [allowedStates];
  if (!allowed.includes(currentState)) {
    throw new ConflictError(
      `${entityName} in state "${currentState}" cannot perform this action. Expected: ${allowed.join(', ')}.`
    );
  }
}

/**
 * Asserts that the actor possesses at least one of the required roles.
 *
 * @param {string[]|string} userRoles
 * @param {string[]|string} requiredRoles
 * @param {string} [message='Insufficient role permissions for this operation.']
 */
export function assertRole(
  userRoles,
  requiredRoles,
  message = 'Insufficient role permissions for this operation.'
) {
  const uRoles = Array.isArray(userRoles) ? userRoles : [userRoles];
  const reqRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  const hasRole = reqRoles.some((role) => uRoles.includes(role));
  if (!hasRole) {
    throw new AuthorizationError(message, {
      details: { userRoles: uRoles, requiredRoles: reqRoles }
    });
  }
}

export default {
  assert,
  assertSegregation,
  assertState,
  assertRole
};
