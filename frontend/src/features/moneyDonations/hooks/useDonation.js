import { useCallback, useState } from 'react';
import { moneyDonationsApi } from '../services/moneyDonations.api.js';
import { paymentsApi } from '../services/payments.api.js';

export function useDonation(api = moneyDonationsApi, payments = paymentsApi) {
  const [state, setState] = useState({
    pending: false,
    donation: null,
    trackingSecret: null,
    payment: null,
    checkingStatus: false,
    statusError: null,
    error: null
  });
  const create = useCallback(
    async (input) => {
      setState({
        pending: true,
        donation: null,
        trackingSecret: null,
        payment: null,
        checkingStatus: false,
        statusError: null,
        error: null
      });
      let response;
      try {
        const { phoneNumber, ...donationInput } = input;
        response = await api.create(donationInput);
        setState({
          pending: donationInput.channel === 'MPESA_STK',
          donation: response.donation,
          trackingSecret: response.verificationSecret,
          payment: null,
          checkingStatus: false,
          statusError: null,
          error: null
        });
        const payment =
          donationInput.channel === 'MPESA_STK'
            ? (await payments.initiate({ donationId: response.donation.id, phoneNumber })).payment
            : null;
        const result = { ...response, payment };
        setState({
          pending: false,
          donation: response.donation,
          trackingSecret: response.verificationSecret,
          payment,
          checkingStatus: false,
          statusError: null,
          error: null
        });
        return result;
      } catch (error) {
        setState({
          pending: false,
          donation: response?.donation ?? null,
          trackingSecret: response?.verificationSecret ?? null,
          payment: null,
          checkingStatus: false,
          statusError: null,
          error: error.message
        });
        throw error;
      }
    },
    [api, payments]
  );
  const paymentId = state.payment?.id;
  const donationId = state.donation?.id;
  const refreshStatus = useCallback(async () => {
    if (!paymentId || !donationId) return;
    setState((current) =>
      current.payment?.id === paymentId
        ? { ...current, checkingStatus: true, statusError: null }
        : current
    );
    try {
      const { payment } = await payments.refresh(paymentId);
      const { donation } = await api.get(donationId);
      setState((current) =>
        current.payment?.id === paymentId
          ? {
              ...current,
              payment,
              donation,
              checkingStatus: false,
              statusError: null
            }
          : current
      );
    } catch (error) {
      setState((current) =>
        current.payment?.id === paymentId
          ? { ...current, checkingStatus: false, statusError: error.message }
          : current
      );
    }
  }, [api, donationId, paymentId, payments]);
  return { ...state, create, refreshStatus };
}
