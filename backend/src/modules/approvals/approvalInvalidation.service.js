'use strict';

import { createApprovalDigest } from './approvalDigest.service.js';
export function approvalEvidenceChanged(round, context) { return round.evidenceDigest !== createApprovalDigest(context); }
