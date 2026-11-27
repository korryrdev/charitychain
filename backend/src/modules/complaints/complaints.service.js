'use strict';

import { ConflictError } from '../../errors/ConflictError.js';
import { auditLogsService } from '../auditLogs/auditLogs.service.js';
import {
  COMPLAINT_AUDIT_ACTIONS,
  COMPLAINT_RULE_IDS,
} from './complaints.events.js';
import {
  assertCanCreateComplaint,
  assertCanManageComplaints,
} from './complaints.policy.js';
import { complaintsRepository } from './complaints.repository.js';

function extractSubmissionMeta(alert) {
  const events = Array.isArray(alert?.events) ? alert.events : [];
  const originEvent = events.find((e) => e.fromStatus === 'NONE') ?? events[0];
  if (!originEvent?.notes) return {};
  try {
    const parsed = JSON.parse(originEvent.notes);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function toComplaintRecord(alert, { includeContact = false } = {}) {
  const meta = extractSubmissionMeta(alert);
  const isFraud = alert.ruleId === COMPLAINT_RULE_IDS.FRAUD_REPORT;
  const prefix = isFraud ? 'FRD' : 'CMP';
  const events = Array.isArray(alert.events)
    ? alert.events
        .filter((e) => e.fromStatus !== 'NONE')
        .map((e) => ({
          id: e.id,
          fromStatus: e.fromStatus,
          toStatus: e.toStatus,
          notes: e.notes,
          createdAt: e.createdAt,
        }))
    : [];

  return {
    id: alert.id,
    trackingRef: `${prefix}-${String(alert.id).slice(0, 8).toUpperCase()}`,
    kind: isFraud ? 'FRAUD_REPORT' : 'COMPLAINT',
    category: meta.category ?? alert.entityType,
    subject: meta.subject ?? null,
    reference: meta.reference ?? alert.entityId ?? null,
    description: meta.description ?? alert.description,
    status: alert.status,
    severity: alert.severity,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
    events,
    ...(includeContact ? { reporterContact: meta.reporterContact ?? null } : {}),
  };
}

export function createComplaintsService({
  repository = complaintsRepository,
  auditLogs = auditLogsService,
} = {}) {
  async function submitIntake({
    kind,
    ruleId,
    severity,
    riskScore,
    auditAction,
    entityType,
    input,
    actorUserId = null,
    context = {},
  }) {
    const descriptionText = input.subject
      ? `${input.subject.trim()}: ${input.description.trim()}`
      : input.description.trim();

    const metadata = {
      kind,
      category: input.category,
      subject: input.subject?.trim() ?? null,
      description: input.description.trim(),
      reference: input.reference?.trim() || null,
      reporterContact: input.reporterContact?.trim() || null,
      submittedByUserId: actorUserId,
    };

    const created = await repository.createCaseAlert({
      ruleId,
      severity,
      riskScore,
      entityType: input.category,
      entityId: input.reference?.trim() || null,
      description: descriptionText,
      metadata,
      actorUserId,
    });

    await auditLogs.recordFromContext(context, {
      actorId: actorUserId,
      action: auditAction,
      entityType,
      entityId: created.id,
      reason: `${input.category}${metadata.reference ? ` (${metadata.reference})` : ''}`,
      metadata: {
        kind,
        category: input.category,
        reference: metadata.reference,
      },
    });

    return toComplaintRecord(created, { includeContact: Boolean(actorUserId) });
  }

  return {
    async submitComplaint(input, { actorUserId = null, context = {} } = {}) {
      return submitIntake({
        kind: 'COMPLAINT',
        ruleId: COMPLAINT_RULE_IDS.COMPLAINT,
        severity: 'MEDIUM',
        riskScore: 40,
        auditAction: COMPLAINT_AUDIT_ACTIONS.COMPLAINT_SUBMITTED,
        entityType: 'COMPLAINT',
        input,
        actorUserId,
        context,
      });
    },

    async submitFraudReport(input, { actorUserId = null, context = {} } = {}) {
      return submitIntake({
        kind: 'FRAUD_REPORT',
        ruleId: COMPLAINT_RULE_IDS.FRAUD_REPORT,
        severity: 'HIGH',
        riskScore: 80,
        auditAction: COMPLAINT_AUDIT_ACTIONS.FRAUD_REPORT_SUBMITTED,
        entityType: 'FRAUD_REPORT',
        input,
        actorUserId,
        context,
      });
    },

    async listMine(auth) {
      assertCanCreateComplaint(auth);
      const alerts = await repository.listByRuleIds(
        [COMPLAINT_RULE_IDS.COMPLAINT, COMPLAINT_RULE_IDS.FRAUD_REPORT],
        { page: 1, pageSize: 100 }
      );
      return alerts
        .filter((alert) => extractSubmissionMeta(alert).submittedByUserId === auth.user.id)
        .map((alert) => toComplaintRecord(alert, { includeContact: true }));
    },

    async listAll(auth, { kind, status, page = 1, pageSize = 50 } = {}) {
      assertCanManageComplaints(auth);
      const ruleIds =
        kind === 'COMPLAINT'
          ? [COMPLAINT_RULE_IDS.COMPLAINT]
          : kind === 'FRAUD_REPORT'
            ? [COMPLAINT_RULE_IDS.FRAUD_REPORT]
            : [COMPLAINT_RULE_IDS.COMPLAINT, COMPLAINT_RULE_IDS.FRAUD_REPORT];

      const alerts = await repository.listByRuleIds(ruleIds, { status, page, pageSize });
      return alerts.map((alert) => toComplaintRecord(alert, { includeContact: true }));
    },

    async resolve(auth, id, { status, notes }, context = {}) {
      assertCanManageComplaints(auth);
      const existing = await repository.findById(id);
      const validRules = new Set([
        COMPLAINT_RULE_IDS.COMPLAINT,
        COMPLAINT_RULE_IDS.FRAUD_REPORT,
      ]);
      if (!existing || !validRules.has(existing.ruleId)) {
        throw new ConflictError(`Complaint or report "${id}" not found.`);
      }

      const updated = await repository.updateStatusWithEvent(id, {
        fromStatus: existing.status,
        status,
        actorUserId: auth.user.id,
        notes: notes.trim(),
      });

      await auditLogs.recordFromContext(context, {
        actorId: auth.user.id,
        action: COMPLAINT_AUDIT_ACTIONS.COMPLAINT_RESOLVED,
        entityType:
          existing.ruleId === COMPLAINT_RULE_IDS.FRAUD_REPORT ? 'FRAUD_REPORT' : 'COMPLAINT',
        entityId: id,
        reason: notes.trim(),
        metadata: { fromStatus: existing.status, toStatus: status },
      });

      return toComplaintRecord(updated, { includeContact: true });
    },
  };
}

export const complaintsService = createComplaintsService();
