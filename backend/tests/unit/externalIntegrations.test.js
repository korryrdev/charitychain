import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createBankReconciliationAdapter } from '../../src/integrations/bank/bankReconciliation.adapter.js';
import { createBankWebhookController } from '../../src/integrations/bank/bankWebhook.controller.js';
import { createChainlinkClient } from '../../src/integrations/chainlink/chainlink.client.js';
import { createOracleRequestAdapter } from '../../src/integrations/chainlink/oracleRequest.adapter.js';
import { validateOracleResult } from '../../src/integrations/chainlink/oracleResult.validator.js';
import { createMpesaCallbackController } from '../../src/integrations/mpesa/callback.controller.js';
import { mapStkCallback } from '../../src/integrations/mpesa/callback.validation.js';
import { createMpesaConfig } from '../../src/integrations/mpesa/mpesa.config.js';
import { classifyMpesaResult } from '../../src/integrations/mpesa/mpesaResultCodes.js';
import { createB2bAdapter } from '../../src/integrations/mpesa/b2b.adapter.js';
import { createB2cAdapter } from '../../src/integrations/mpesa/b2c.adapter.js';
import { createMpesaReconciliationAdapter } from '../../src/integrations/mpesa/reconciliation.adapter.js';
import { createStkPushQueryAdapter } from '../../src/integrations/mpesa/stkPushQuery.adapter.js';
import { createTransactionStatusAdapter } from '../../src/integrations/mpesa/transactionStatus.adapter.js';
import { createIpfsUploader } from '../../src/integrations/ipfs/ipfsUploader.js';
import { createSmsProvider } from '../../src/integrations/sms/smsProviderFactory.js';
import { createWeb3Client } from '../../src/integrations/blockchain/web3.client.js';

describe('Section 32 external integrations', () => {
  it('handles M-Pesa status, reconciliation and safe callback ingestion', async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ ResponseCode: '0', OriginatorConversationID: 'REQ-1' })
    };
    const config = {
      initiatorName: 'init',
      securityCredential: 'credential',
      shortcode: '123',
      transactionStatusPath: '/status',
      disbursementResultUrl: 'https://x/result',
      disbursementTimeoutUrl: 'https://x/timeout'
    };
    const status = createTransactionStatusAdapter({ client, config });
    await expect(
      status.query({ transactionId: 'TX-1', reference: 'REF-1' })
    ).resolves.toMatchObject({ status: 'PENDING', providerRequestId: 'REQ-1' });
    await expect(
      createMpesaReconciliationAdapter({ statusAdapter: status }).reconcile({
        providerTransactionId: 'TX-1',
        reference: 'REF-1'
      })
    ).resolves.toMatchObject({ provider: 'MPESA' });
    const events = [];
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await createMpesaCallbackController({ onEvent: async (event) => events.push(event) }).c2b(
      {
        body: {
          TransID: 'TX-2',
          BillRefNumber: 'REF-2',
          TransAmount: '100',
          TransTime: '20261110000000'
        }
      },
      response,
      vi.fn()
    );
    expect(events[0]).toMatchObject({ providerTransactionId: 'TX-2', status: 'SUCCEEDED' });
  });

  it('configures Daraja STK callbacks and verifies checkout results with STK Push Query', async () => {
    const config = createMpesaConfig({
      environment: 'sandbox',
      callbackBaseUrl: 'https://callbacks.example.test/'
    });
    expect(config.callbackUrl).toBe(
      'https://callbacks.example.test/api/v1/webhooks/payments/mpesa/stk'
    );
    const client = { post: vi.fn().mockResolvedValue({ ResponseCode: '0', ResultCode: 0 }) };
    const adapter = createStkPushQueryAdapter({
      client,
      config: { shortcode: '174379', passkey: 'passkey', stkPushQueryPath: '/stk-query' },
      now: () => new Date('2026-11-16T13:00:00.000Z')
    });
    await expect(adapter.query({ checkoutRequestId: 'ws_CO_123' })).resolves.toEqual({
      resultCode: '0',
      resultMessage: null
    });
    expect(client.post).toHaveBeenCalledWith('/stk-query', {
      BusinessShortCode: '174379',
      Password: Buffer.from('174379passkey20261116160000').toString('base64'),
      Timestamp: '20261116160000',
      CheckoutRequestID: 'ws_CO_123'
    });
    const pendingAdapter = createStkPushQueryAdapter({
      client: {
        post: vi.fn().mockResolvedValue({
          ResponseCode: '0',
          ResponseDescription: 'Request is still being processed.'
        })
      },
      config: { shortcode: '174379', passkey: 'passkey', stkPushQueryPath: '/stk-query' }
    });
    await expect(pendingAdapter.query({ checkoutRequestId: 'ws_CO_PENDING' })).resolves.toEqual({
      resultCode: null,
      resultMessage: 'Request is still being processed.'
    });
    expect(
      mapStkCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-1',
            CheckoutRequestID: 'ws_CO_CANCELLED',
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user.'
          }
        }
      })
    ).toMatchObject({ status: 'CANCELLED', resultCode: '1032' });

    const pending4999Adapter = createStkPushQueryAdapter({
      client: {
        post: vi.fn().mockResolvedValue({
          ResponseCode: '0',
          ResultCode: 4999,
          ResultDesc: 'The transaction is still under processing'
        })
      },
      config: { shortcode: '174379', passkey: 'passkey', stkPushQueryPath: '/stk-query' }
    });
    await expect(pending4999Adapter.query({ checkoutRequestId: 'ws_CO_4999' })).resolves.toEqual({
      resultCode: null,
      resultMessage: 'The transaction is still under processing'
    });

    const pendingHttpErrorAdapter = createStkPushQueryAdapter({
      client: {
        post: vi.fn().mockRejectedValue({
          message: 'The transaction is being processed',
          retryable: true,
          details: { providerStatus: 500, providerErrorCode: '500.001.1001' }
        })
      },
      config: { shortcode: '174379', passkey: 'passkey', stkPushQueryPath: '/stk-query' }
    });
    await expect(
      pendingHttpErrorAdapter.query({ checkoutRequestId: 'ws_CO_500_PENDING' })
    ).resolves.toEqual({
      resultCode: null,
      resultMessage: 'The transaction is still under processing.'
    });

    expect(classifyMpesaResult('1', 'The balance is insufficient for the transaction')).toMatchObject(
      { status: 'FAILED', category: 'INSUFFICIENT_FUNDS', title: 'Insufficient M-Pesa balance' }
    );
    expect(classifyMpesaResult('2001', 'The initiator information is invalid.')).toMatchObject({
      status: 'FAILED',
      category: 'WRONG_PIN',
      title: 'Wrong M-Pesa PIN'
    });
    expect(classifyMpesaResult('1032', 'Request cancelled by user.')).toMatchObject({
      status: 'CANCELLED',
      category: 'USER_CANCELLED'
    });
    expect(classifyMpesaResult('1037', 'DS timeout user cannot be reached')).toMatchObject({
      status: 'FAILED',
      category: 'STK_TIMEOUT'
    });
    expect(classifyMpesaResult('4999', 'The transaction is still under processing')).toMatchObject({
      status: 'PENDING',
      category: 'PROCESSING'
    });
    expect(
      mapStkCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-2',
            CheckoutRequestID: 'ws_CO_WRONG_PIN',
            ResultCode: 2001,
            ResultDesc: 'The initiator information is invalid.'
          }
        }
      })
    ).toMatchObject({
      status: 'FAILED',
      resultCode: '2001',
      resultMessage: expect.stringContaining('incorrect M-Pesa PIN')
    });
  });

  it('fails closed when optional M-Pesa disbursement credentials are missing', async () => {
    const client = { post: vi.fn() };
    await expect(
      createB2cAdapter({ client, config: {} }).send({
        amount: 100,
        phone: '254712345678',
        reference: 'upkeep-ref',
        remarks: 'Upkeep'
      })
    ).rejects.toMatchObject({ code: 'INTEGRATION_UNAVAILABLE' });
    await expect(
      createB2bAdapter({ client, config: {} }).send({
        amount: 100,
        accountReference: 'tuition-ref',
        remarks: 'Tuition'
      })
    ).rejects.toMatchObject({ code: 'INTEGRATION_UNAVAILABLE' });
    expect(client.post).not.toHaveBeenCalled();
  });

  it('supports bank reconciliation and normalized webhook ingestion', async () => {
    await expect(
      createBankReconciliationAdapter({
        provider: { reconcile: async () => ({ status: 'SUCCEEDED' }) }
      }).reconcile({ providerTransactionId: 'BANK-1' })
    ).resolves.toMatchObject({ status: 'SUCCEEDED' });
    const received = [];
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await createBankWebhookController({ onEvent: async (event) => received.push(event) }).receive(
      {
        body: {
          eventId: 'event-1',
          reference: 'ref-1',
          transactionId: 'tx-1',
          status: 'SUCCEEDED',
          amount: 50
        }
      },
      response,
      vi.fn()
    );
    expect(received[0]).toMatchObject({ eventType: 'BANK_CREDIT', providerTransactionId: 'tx-1' });
  });

  it('uses the SMS sandbox, IPFS adapter contracts and Blockchain fail-closed configuration', async () => {
    await expect(
      createSmsProvider({ enabled: true, provider: 'sandbox' }).send({
        to: '254700000000',
        message: 'Test'
      })
    ).resolves.toMatchObject({ accepted: true });
    const ipfs = {
      config: { maximumBytes: 100 },
      request: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ Hash: `bafy${'a'.repeat(56)}`, Size: '4' }), {
          status: 200
        })
      )
    };
    await expect(createIpfsUploader(ipfs)('test')).resolves.toMatchObject({ size: 4 });
    expect(() => createWeb3Client({ enabled: false, rpcUrl: null })).toThrow(
      'disabled or unconfigured'
    );
  });

  it('keeps optional Chainlink disabled by default, sends configured requests, and validates signed results', async () => {
    await expect(
      createChainlinkClient({ config: { enabled: false } }).request({})
    ).rejects.toMatchObject({ code: 'INTEGRATION_UNAVAILABLE' });
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ requestId: 'oracle-1' }), { status: 200 }));
    const client = createChainlinkClient({
      config: {
        enabled: true,
        oracleUrl: 'https://oracle.test',
        webhookSecret: 'chainlink-test-secret',
        requestTimeoutMs: 1000
      },
      fetchImpl
    });
    await expect(
      createOracleRequestAdapter({ client }).request({
        job: 'verify',
        data: { amount: 1 },
        callbackUrl: 'https://callback.test'
      })
    ).resolves.toMatchObject({ requestId: 'oracle-1' });
    const rawBody = '{"requestId":"oracle-1"}';
    const signature = createHmac('sha256', 'chainlink-test-secret').update(rawBody).digest('hex');
    expect(validateOracleResult({ rawBody, signature, secret: 'chainlink-test-secret' })).toBe(
      true
    );
    expect(
      validateOracleResult({ rawBody, signature: 'bad', secret: 'chainlink-test-secret' })
    ).toBe(false);
  });
});
