export const EVENT_NAMES = Object.freeze({
  DONATION_RECONCILED: 'donation.reconciled',
  PAYMENT_STATUS_CHANGED: 'payment.status.changed',
  PHYSICAL_DONATION_CONFIRMED: 'physicalDonation.confirmed',
  APPLICATION_VETTED: 'application.vetted',
  APPROVAL_THRESHOLD_REACHED: 'approval.threshold.reached',
  DISBURSEMENT_COMPLETED: 'disbursement.completed',
  GOODS_COLLECTION_CONFIRMED: 'goodsCollection.confirmed',
  NOTIFICATION_REQUESTED: 'notification.requested'
});

export function assertEventName(eventName) {
  if (!Object.values(EVENT_NAMES).includes(eventName)) {
    throw new TypeError(`Unsupported domain event: ${eventName}`);
  }
  return eventName;
}
