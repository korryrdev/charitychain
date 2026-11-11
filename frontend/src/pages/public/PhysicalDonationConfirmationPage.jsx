import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { physicalDonationsApi } from '../../features/physicalDonations/services/physicalDonations.api.js';
import { ConfirmationStatus } from '../../features/physicalDonations/components/ConfirmationStatus.jsx';

export function PhysicalDonationConfirmationPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [state, setState] = useState('AWAITING_DONOR_CONFIRMATION');
  const [message, setMessage] = useState('Compare every item and quantity in the SMS with what you handed to the clerk.');
  const [busy, setBusy] = useState(false);

  const respond = async (decision) => {
    if (!token.trim()) { setMessage('Enter the secure confirmation code from your SMS first.'); return; }
    setBusy(true);
    try {
      await physicalDonationsApi.respondToConfirmation({ token: token.trim(), decision });
      setState(decision === 'YES' ? 'CONFIRMED' : 'REJECTED');
      setMessage(decision === 'YES' ? 'Thank you. The receipt is confirmed and can now be processed.' : 'The receipt was rejected. The clerk must create a new, correct entry.');
    } catch (error) {
      setMessage(error?.message ?? 'The confirmation could not be completed. The link may have expired.');
    } finally { setBusy(false); }
  };

  return <main className="public-page confirmation-page"><section className="confirmation-page__card"><p className="eyebrow">Secure handover confirmation</p><h1>Confirm what the clerk recorded.</h1><ConfirmationStatus status={state} /><p>{message}</p>{state === 'AWAITING_DONOR_CONFIRMATION' && <><label className="confirmation-page__token">SMS confirmation code<input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste your secure code" autoComplete="one-time-code" /></label><div className="confirmation-page__actions"><button className="primary-button" disabled={busy} onClick={() => respond('YES')}>Yes, it is correct</button><button className="secondary-button" disabled={busy} onClick={() => respond('NO')}>No, reject this entry</button></div></>}</section></main>;
}
