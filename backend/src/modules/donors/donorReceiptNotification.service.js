'use strict';

import { smsClient } from '../../integrations/sms/sms.client.js';
import { formatMoney } from '../../utils/money.js';
import { logger } from '../../observability/logger.js';

export function createDonorReceiptNotificationService({ sms = smsClient } = {}) {
  return {
    async sendReceiptNotification({ phone, receiptCode, amountMinor, currency = 'KES', appUrl = 'https://charitychain.org' }) {
      if (!phone) return { sent: false, reason: 'NO_PHONE_NUMBER' };

      const formatted = formatMoney(amountMinor, currency);
      const traceUrl = `${appUrl}/trace/${receiptCode}`;
      const message = `Thank you for your donation of ${formatted} to Malkia! Receipt code: ${receiptCode}. Trace impact: ${traceUrl}`;

      try {
        const result = await sms.send({ to: phone, message });
        logger.info({ phone, receiptCode }, 'Donor receipt notification dispatched.');
        return { sent: true, result };
      } catch (error) {
        logger.error({ error, phone, receiptCode }, 'Failed to deliver donor receipt SMS.');
        return { sent: false, error: error.message };
      }
    }
  };
}

export const donorReceiptNotificationService = createDonorReceiptNotificationService();

