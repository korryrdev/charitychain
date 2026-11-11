'use strict';

import { auditEventBuilder } from './auditEventBuilder.js';

export const auditIntegrityService = Object.freeze({
  verify(events) {
    let expectedPrevious = null;
    for (const event of events) {
      if (event.previousHash !== expectedPrevious || !auditEventBuilder.verify(event)) {
        return { valid: false, failedSequence: event.sequence.toString(), expectedPrevious, observedPrevious: event.previousHash };
      }
      expectedPrevious = event.eventHash;
    }
    return { valid: true, checked: events.length, headHash: expectedPrevious };
  }
});
