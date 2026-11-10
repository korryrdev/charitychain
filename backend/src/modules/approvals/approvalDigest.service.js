'use strict';

import { createHash } from 'node:crypto';

function normalize(value) { if (value instanceof Date) return value.toISOString(); if (value && typeof value.toJSON === 'function') return value.toJSON(); if (Array.isArray(value)) return value.map(normalize); if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])])); return value; }
export function approvalEvidence(context) { const latest = context.vettingRuns[0]; return { application: { id: context.id, reference: context.reference, studentId: context.studentId, semesterId: context.semesterId, type: context.type, requestedAmount: context.requestedAmount, currency: context.currency, reason: context.reason, financialRecordId: context.financialRecordId, outstandingBalanceSnapshot: context.outstandingBalanceSnapshot, financialSnapshotAt: context.financialSnapshotAt }, vetting: latest ? { id: latest.id, policyId: latest.policyId, status: latest.status, score: latest.score, inputDigest: latest.inputDigest, completedAt: latest.completedAt, factors: latest.factors.map((factor) => ({ factor: factor.factor, outcome: factor.outcome, points: factor.points, evidence: factor.evidence })) } : null }; }
export function createApprovalDigest(context) { return createHash('sha256').update(JSON.stringify(normalize(approvalEvidence(context)))).digest('hex'); }
