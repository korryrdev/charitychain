'use strict';
import { mpesaClient } from './mpesa.client.js';
import { mpesaConfig } from './mpesa.config.js';
export function createTransactionStatusAdapter({ client = mpesaClient, config = mpesaConfig } = {}) { return { async query({ transactionId, reference }) { const response = await client.post(config.transactionStatusPath, { Initiator: config.initiatorName, SecurityCredential: config.securityCredential, CommandID: 'TransactionStatusQuery', TransactionID: transactionId, PartyA: config.shortcode, IdentifierType: '4', ResultURL: config.disbursementResultUrl, QueueTimeOutURL: config.disbursementTimeoutUrl, Remarks: reference, Occasion: reference }); return { providerRequestId: response.OriginatorConversationID ?? reference, providerTransactionId: transactionId, status: response.ResponseCode === '0' || response.ResponseCode === 0 ? 'PENDING' : 'FAILED', response }; } }; }
export const transactionStatusAdapter = createTransactionStatusAdapter();
