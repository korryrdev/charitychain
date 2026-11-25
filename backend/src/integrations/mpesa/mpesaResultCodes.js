const TERMINAL_RESULT_DETAILS = Object.freeze({
  '1': {
    status: 'FAILED',
    category: 'INSUFFICIENT_FUNDS',
    title: 'Insufficient M-Pesa balance',
    message:
      'Insufficient M-Pesa balance to complete this contribution. Top up your M-Pesa wallet and try again.'
  },
  '2001': {
    status: 'FAILED',
    category: 'WRONG_PIN',
    title: 'Wrong M-Pesa PIN',
    message:
      'An incorrect M-Pesa PIN was entered on your phone. Start a new payment and enter your valid M-Pesa PIN.'
  },
  '1037': {
    status: 'FAILED',
    category: 'STK_TIMEOUT',
    title: 'M-Pesa prompt timed out',
    message:
      'The M-Pesa prompt timed out or your phone could not be reached. Keep your screen unlocked and try again.'
  },
  '1019': {
    status: 'FAILED',
    category: 'TRANSACTION_EXPIRED',
    title: 'M-Pesa prompt expired',
    message: 'The M-Pesa transaction expired before it was completed.'
  },
  '1001': {
    status: 'FAILED',
    category: 'SUBSCRIBER_BUSY',
    title: 'Another M-Pesa prompt is active',
    message:
      'Another M-Pesa transaction is already in progress on this phone number. Complete or cancel it first.'
  }
});

const PROVIDER_ERROR_CODES = new Set(['1025', '9999', '17', '26']);
const PENDING_MESSAGE_PATTERN = /still under processing|being processed/i;

/**
 * Returns true when an M-Pesa HTTP error indicates an in-progress STK Push.
 */
export function isPendingMpesaError(error) {
  return (
    error?.details?.providerErrorCode === '500.001.1001' ||
    PENDING_MESSAGE_PATTERN.test(error?.message ?? '')
  );
}

/**
 * Normalizes Safaricom Daraja STK result codes into payment states and donor-facing messages.
 */
export function classifyMpesaResult(resultCode, rawMessage) {
  const code =
    resultCode === undefined || resultCode === null || String(resultCode).trim() === ''
      ? null
      : String(resultCode).trim();
  const messageText = typeof rawMessage === 'string' && rawMessage.trim() ? rawMessage.trim() : null;

  if (code === null || code === '4999' || PENDING_MESSAGE_PATTERN.test(messageText ?? '')) {
    return {
      code,
      status: 'PENDING',
      category: 'PROCESSING',
      title: 'Waiting for M-Pesa confirmation',
      message: messageText || 'The transaction is still under processing.'
    };
  }

  if (code === '0') {
    return {
      code: '0',
      status: 'SUCCEEDED',
      category: 'COMPLETED',
      title: 'Payment confirmed',
      message: messageText || 'The service request is processed successfully.'
    };
  }

  if (code === '1032') {
    return {
      code: '1032',
      status: 'CANCELLED',
      category: 'USER_CANCELLED',
      title: 'Cancelled on phone',
      message: messageText || 'Request cancelled by user.'
    };
  }

  if (TERMINAL_RESULT_DETAILS[code]) {
    return { code, ...TERMINAL_RESULT_DETAILS[code] };
  }

  if (PROVIDER_ERROR_CODES.has(code)) {
    return {
      code,
      status: 'FAILED',
      category: 'PROVIDER_ERROR',
      title: 'M-Pesa service error',
      message:
        'Safaricom M-Pesa encountered a temporary service error while processing the request. Please try again shortly.'
    };
  }

  return {
    code,
    status: 'FAILED',
    category: 'PAYMENT_DECLINED',
    title: 'Payment failed',
    message: messageText || 'M-Pesa rejected the payment.'
  };
}
