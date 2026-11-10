'use strict';

export class IpfsError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message, { cause });
    this.name = 'IpfsError';
    this.status = status;
  }
}
