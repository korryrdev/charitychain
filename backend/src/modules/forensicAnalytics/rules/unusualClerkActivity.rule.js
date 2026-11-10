'use strict';

export function unusualClerkActivityRule({ clerks = [] }, { countThreshold = 10 } = {}) {
  return clerks.filter((item) => item._count.id >= countThreshold).map((item) => ({ ruleCode: 'UNUSUAL_CLERK_ACTIVITY', severity: 'MEDIUM', sourceType: 'CLERK_ACTIVITY', sourceId: item.clerkUserId, title: 'Unusual clerk intake volume', summary: 'A clerk recorded physical donation intake above the configured daily threshold.', evidence: { intakeCount: item._count.id } }));
}
