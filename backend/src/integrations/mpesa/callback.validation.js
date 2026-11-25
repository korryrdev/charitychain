import { z } from 'zod';
export const stkCallbackSchema = z.object({ Body: z.object({ stkCallback: z.object({ MerchantRequestID: z.string(), CheckoutRequestID: z.string(), ResultCode: z.number(), ResultDesc: z.string(), CallbackMetadata: z.object({ Item: z.array(z.object({ Name: z.string(), Value: z.union([z.string(), z.number()]).optional() })) }).optional() }) }) });
export function mapStkCallback(input) {
  const callback = stkCallbackSchema.parse(input).Body.stkCallback;
  const values = Object.fromEntries(
    (callback.CallbackMetadata?.Item ?? []).map((item) => [item.Name, item.Value])
  );
  const resultCode = String(callback.ResultCode);
  return {
    eventId: `${callback.CheckoutRequestID}:${resultCode}`,
    eventType: 'STK_RESULT',
    providerRequestId: callback.CheckoutRequestID,
    providerTransactionId: values.MpesaReceiptNumber
      ? String(values.MpesaReceiptNumber)
      : undefined,
    status: resultCode === '0' ? 'SUCCEEDED' : resultCode === '1032' ? 'CANCELLED' : 'FAILED',
    amount: values.Amount ? Number(values.Amount) : undefined,
    currency: 'KES',
    resultCode,
    resultMessage: callback.ResultDesc
  };
}
