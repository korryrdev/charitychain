'use strict';

export class BlockchainError extends Error {
  constructor(message, { cause, retryable = true } = {}) {
    super(message, { cause });
    this.name = 'BlockchainError';
    this.retryable = retryable;
  }
}
