import { useState, type FormEvent } from 'react';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/forms/FormField';
import { Alert } from '../../components/feedback/Alert';
import { httpClient } from '../../services/httpClient';
import { getErrorMessage } from '../../services/errorMapper';
import { PublicPage } from './PublicPage';

interface TrackDonationState {
  pending: boolean;
  error: string | null;
  donation: Record<string, any> | null;
}

export function TrackDonationPage() {
  const [values, setValues] = useState({ trackingId: '', verificationSecret: '' });
  const [state, setState] = useState<TrackDonationState>({
    pending: false,
    error: null,
    donation: null,
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^MAL-[A-Z0-9_-]{12}$/.test(values.trackingId) || !values.verificationSecret) {
      return setState({
        ...state,
        error: 'Enter the complete tracking ID and private verification secret.',
      });
    }
    setState({ pending: true, error: null, donation: null });
    try {
      const response = await httpClient.post('/public/donations/track', values);
      setState({ pending: false, error: null, donation: response.donation });
    } catch (cause: unknown) {
      setState({
        pending: false,
        error: getErrorMessage(cause, 'Donation not available.'),
        donation: null,
      });
    }
  };

  return (
    <PublicPage
      title="Track a donation"
      lead="Private tracking requires the two credentials issued for the donation. CharityChain does not disclose donation details from a tracking ID alone."
    >
      <form className="tracking-form" noValidate onSubmit={submit}>
        {state.error && (
          <Alert tone="danger" title="Donation not available">
            {state.error}
          </Alert>
        )}
        <FormField id="tracking-id" label="Tracking ID" hint="For example: MAL-XXXXXXXXXXXX">
          <input
            id="tracking-id"
            value={values.trackingId}
            onChange={(event) =>
              setValues({ ...values, trackingId: event.target.value.toUpperCase().trim() })
            }
          />
        </FormField>
        <FormField id="verification-secret" label="Private verification secret">
          <input
            id="verification-secret"
            type="password"
            value={values.verificationSecret}
            onChange={(event) =>
              setValues({ ...values, verificationSecret: event.target.value })
            }
          />
        </FormField>
        <Button type="submit" loading={state.pending}>
          Track donation
        </Button>
      </form>
      {state.donation && (
        <section className="tracking-result" aria-live="polite">
          <h2>Donation record</h2>
          <dl>
            <dt>Tracking ID</dt>
            <dd>{state.donation.trackingId}</dd>
            <dt>Current status</dt>
            <dd>{state.donation.status}</dd>
            <dt>Amount</dt>
            <dd>KES {Number(state.donation.amount ?? 0).toLocaleString()}</dd>
            <dt>Recorded at</dt>
            <dd>{new Date(state.donation.createdAt).toLocaleString()}</dd>
          </dl>
        </section>
      )}
    </PublicPage>
  );
}
