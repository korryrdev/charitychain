'use strict';

export function approvalConflictRule({ conflicts = [] }) {
  return conflicts.map((item) => ({ ruleCode: 'APPROVAL_CONFLICT', severity: 'HIGH', sourceType: 'COMMITTEE_CONFLICT', sourceId: item.id, title: 'Open committee approval conflict', summary: 'A declared or confirmed signatory conflict requires independent resolution.', evidence: { conflictType: item.type, conflictStatus: item.status, applicationId: item.applicationId } }));
}
