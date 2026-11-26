import { useCallback, useState } from 'react';
import { getErrorMessage } from '../../../services/errorMapper';
import { moneyDonationsApi } from '../services/moneyDonations.api';
import { paymentsApi } from '../services/payments.api';

export interface DonationHookState {
  pending: boolean;
  donation: Record<string, any> | null;
  trackingSecret: string | null;
  payment: Record<string, any> | null;
  checkingStatus: boolean;
  statusError: string | null;
  error: string | null;
}

export interface DonationHookApi {
  create: (input: Record<string, unknown>) => Promise<Record<string, any>>;
  get?: (id: string) => Promise<Record<string, any>>;
}

export interface PaymentsHookApi {
  initiate: (input: Record<string, unknown>) => Promise<Record<string, any>>;
  refresh?: (paymentId: string) => Promise<Record<string, any>>;
}

const initialState: DonationHookState = {
  pending: false,
  donation: null,
  trackingSecret: null,
  payment: null,
  checkingStatus: false,
  statusError: null,
  error: null,
};

export function useDonation(
  api: DonationHookApi = moneyDonationsApi,
  payments: PaymentsHookApi = paymentsApi,
) {
  const [state, setState] = useState<DonationHookState>(initialState);
  const create = useCallback(
    async (input: Record<string, any>) => {
      setState({ ...initialState, pending: true });
      let response: Record<string, any> | undefined;
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
      } catch (error: unknown) {
        setState({
          pending: false,
          donation: response?.donation ?? null,
          trackingSecret: response?.verificationSecret ?? null,
          payment: null,
          checkingStatus: false,
          statusError: null,
          error: getErrorMessage(error, 'Unable to start donation.')
        });
        throw error;
      }
    },
    [api, payments]
  );
  const paymentId = state.payment?.id;
  const donationId = state.donation?.id;
  const refreshStatus = useCallback(async () => {
    if (!paymentId || !donationId || !payments.refresh || !api.get) return;
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
    } catch (error: unknown) {
      setState((current) =>
        current.payment?.id === paymentId
          ? {
              ...current,
              checkingStatus: false,
              statusError: getErrorMessage(error, 'Unable to refresh payment status.')
            }
          : current
      );
    }
  }, [api, donationId, paymentId, payments]);
  const reset = useCallback(() => {
    setState(initialState);
  }, []);
  return { ...state, create, refreshStatus, reset };
}
