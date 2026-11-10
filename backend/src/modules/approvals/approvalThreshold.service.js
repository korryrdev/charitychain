'use strict';

export const APPROVAL_THRESHOLD = 2;
export function evaluateThreshold(decisions) { const approvals = decisions.filter(({ decision }) => decision === 'APPROVE').length; const declines = decisions.filter(({ decision }) => decision === 'DECLINE').length; return { approvals, declines, outcome: approvals >= APPROVAL_THRESHOLD ? 'APPROVED' : declines >= APPROVAL_THRESHOLD ? 'DECLINED' : 'OPEN' }; }
