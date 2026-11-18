import { mpesaClient } from './mpesa.client.js';
import { assertDisbursementCredentials, mpesaConfig } from './mpesa.config.js';
export function createB2cAdapter({ client = mpesaClient, config = mpesaConfig } = {}) {
  return {
    async send({ amount, phone, reference, remarks }) {
      assertDisbursementCredentials(config);
      const payload = {
        OriginatorConversationID: reference,
        InitiatorName: config.initiatorName,
        SecurityCredential: config.securityCredential,
        CommandID: 'BusinessPayment',
        Amount: Number(amount),
        PartyA: config.shortcode,
        PartyB: phone,
        Remarks: remarks,
        QueueTimeOutURL: config.disbursementTimeoutUrl,
        ResultURL: config.disbursementResultUrl,
        Occasion: reference
      };
      const response = await client.post(config.b2cPath, payload);
      return {
        providerRequestId: response.ConversationID ?? response.OriginatorConversationID,
        response
      };
    }
  };
}
export const b2cAdapter = createB2cAdapter();
