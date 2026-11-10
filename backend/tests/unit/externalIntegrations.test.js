import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createBankReconciliationAdapter } from '../../src/integrations/bank/bankReconciliation.adapter.js';
import { createBankWebhookController } from '../../src/integrations/bank/bankWebhook.controller.js';
import { createChainlinkClient } from '../../src/integrations/chainlink/chainlink.client.js';
import { createOracleRequestAdapter } from '../../src/integrations/chainlink/oracleRequest.adapter.js';
import { validateOracleResult } from '../../src/integrations/chainlink/oracleResult.validator.js';
import { createMpesaCallbackController } from '../../src/integrations/mpesa/callback.controller.js';
import { createMpesaReconciliationAdapter } from '../../src/integrations/mpesa/reconciliation.adapter.js';
import { createTransactionStatusAdapter } from '../../src/integrations/mpesa/transactionStatus.adapter.js';
import { createIpfsUploader } from '../../src/integrations/ipfs/ipfsUploader.js';
import { createSmsProvider } from '../../src/integrations/sms/smsProviderFactory.js';
import { createWeb3Client } from '../../src/integrations/blockchain/web3.client.js';

describe('Section 32 external integrations', () => {
  it('handles M-Pesa status, reconciliation and safe callback ingestion', async () => {
    const client = { post: vi.fn().mockResolvedValue({ ResponseCode: '0', OriginatorConversationID: 'REQ-1' }) };
    const config = { initiatorName: 'init', securityCredential: 'credential', shortcode: '123', transactionStatusPath: '/status', disbursementResultUrl: 'https://x/result', disbursementTimeoutUrl: 'https://x/timeout' };
    const status = createTransactionStatusAdapter({ client, config });
    await expect(status.query({ transactionId: 'TX-1', reference: 'REF-1' })).resolves.toMatchObject({ status: 'PENDING', providerRequestId: 'REQ-1' });
    await expect(createMpesaReconciliationAdapter({ statusAdapter: status }).reconcile({ providerTransactionId: 'TX-1', reference: 'REF-1' })).resolves.toMatchObject({ provider: 'MPESA' });
    const events = []; const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await createMpesaCallbackController({ onEvent: async (event) => events.push(event) }).c2b({ body: { TransID: 'TX-2', BillRefNumber: 'REF-2', TransAmount: '100', TransTime: '20261110000000' } }, response, vi.fn());
    expect(events[0]).toMatchObject({ providerTransactionId: 'TX-2', status: 'SUCCEEDED' });
  });

  it('supports bank reconciliation and normalized webhook ingestion', async () => {
    await expect(createBankReconciliationAdapter({ provider: { reconcile: async () => ({ status: 'SUCCEEDED' }) } }).reconcile({ providerTransactionId: 'BANK-1' })).resolves.toMatchObject({ status: 'SUCCEEDED' });
    const received = []; const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await createBankWebhookController({ onEvent: async (event) => received.push(event) }).receive({ body: { eventId: 'event-1', reference: 'ref-1', transactionId: 'tx-1', status: 'SUCCEEDED', amount: 50 } }, response, vi.fn());
    expect(received[0]).toMatchObject({ eventType: 'BANK_CREDIT', providerTransactionId: 'tx-1' });
  });

  it('uses the SMS sandbox, IPFS adapter contracts and Blockchain fail-closed configuration', async () => {
    await expect(createSmsProvider({ enabled: true, provider: 'sandbox' }).send({ to: '254700000000', message: 'Test' })).resolves.toMatchObject({ accepted: true });
    const ipfs = { config: { maximumBytes: 100 }, request: vi.fn().mockResolvedValue(new Response(JSON.stringify({ Hash: `bafy${'a'.repeat(56)}`, Size: '4' }), { status: 200 })) };
    await expect(createIpfsUploader(ipfs)('test')).resolves.toMatchObject({ size: 4 });
    expect(() => createWeb3Client({ enabled: false, rpcUrl: null })).toThrow('disabled or unconfigured');
  });

  it('keeps optional Chainlink disabled by default, sends configured requests, and validates signed results', async () => {
    await expect(createChainlinkClient({ config: { enabled: false } }).request({})).rejects.toMatchObject({ code: 'INTEGRATION_UNAVAILABLE' });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ requestId: 'oracle-1' }), { status: 200 }));
    const client = createChainlinkClient({ config: { enabled: true, oracleUrl: 'https://oracle.test', webhookSecret: 'chainlink-test-secret', requestTimeoutMs: 1000 }, fetchImpl });
    await expect(createOracleRequestAdapter({ client }).request({ job: 'verify', data: { amount: 1 }, callbackUrl: 'https://callback.test' })).resolves.toMatchObject({ requestId: 'oracle-1' });
    const rawBody = '{"requestId":"oracle-1"}'; const signature = createHmac('sha256', 'chainlink-test-secret').update(rawBody).digest('hex');
    expect(validateOracleResult({ rawBody, signature, secret: 'chainlink-test-secret' })).toBe(true);
    expect(validateOracleResult({ rawBody, signature: 'bad', secret: 'chainlink-test-secret' })).toBe(false);
  });
});
