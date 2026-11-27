import { Link } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { getErrorMessage } from '../../services/errorMapper';

interface MfaSetupResult {
  totpURI?: string;
  totpUri?: string;
  backupCodes?: string[];
}

export function SecurityIncidentsPage() {
  const { session, enableMfa } = useAuth();
  const [password, setPassword] = useState('');
  const [setup, setSetup] = useState<MfaSetupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const beginMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      setSetup((await enableMfa(password)) as MfaSetupResult);
      setPassword('');
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to prepare authenticator setup.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="portal-page admin-page">
      <p className="section-kicker">Security and audit</p>
      <h1>Protect administrative access.</h1>
      <div className="admin-two-column">
        <section className="portal-card">
          <h2>Administrative safeguards</h2>
          <ul>
            <li>High-risk user and role changes require MFA.</li>
            <li>Session revocation and account-status changes are audit logged.</li>
            <li>Suspected fraud is handled through restricted forensic cases.</li>
            <li>
              Donor references stay masked;{' '}
              <Link to="/admin/donor-identity" className="underline font-semibold">
                audited reveal console
              </Link>{' '}
              requires a logged justification.
            </li>
          </ul>
        </section>
        <section className="portal-card">
          <h2>Authenticator app</h2>
          {session?.mfaVerified ? (
            <p className="admin-feedback">Multi-factor authentication is enabled for this account.</p>
          ) : (
            <>
              <p>
                Set up an authenticator before creating staff accounts, changing roles, or
                suspending access.
              </p>
              <form onSubmit={beginMfa}>
                <label>
                  Confirm your password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </label>
                <button className="primary-button" disabled={pending}>
                  {pending ? 'Preparing…' : 'Set up authenticator'}
                </button>
              </form>
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          {setup && (
            <section className="mfa-setup-result">
              <p>
                Add this secure setup URI to an authenticator application, then sign out and sign in
                with a code to complete verification.
              </p>
              <code>
                {setup.totpURI ??
                  setup.totpUri ??
                  'Authenticator setup was created. Use the code shown by your authenticator application.'}
              </code>
              {setup.backupCodes?.length ? (
                <>
                  <h3>Backup codes</h3>
                  <p>Store these offline; they are shown only once.</p>
                  <code>{setup.backupCodes.join('\n')}</code>
                </>
              ) : null}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
