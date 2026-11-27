import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, LogOut, ShieldCheck } from 'lucide-react';
import { AuthField } from '../../features/authentication/components/AuthField';
import { AuthShell } from '../../features/authentication/components/AuthShell';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { CHANGE_PASSWORD_PATH, roleHomePath } from '../../features/authentication/nextStep';
import { loginPathForRoles } from '../../features/authentication/portals';
import { validateMfa } from '../../features/authentication/validation/auth.schema';
import type { MfaSetupResult } from '../../features/authentication/services/auth.api';
import { getErrorMessage } from '../../services/errorMapper';

function extractSecret(totpUri: string | undefined): string | null {
  if (!totpUri) return null;
  try {
    return new URL(totpUri).searchParams.get('secret');
  } catch {
    return null;
  }
}

export function MfaEnrollmentPage() {
  const { authenticated, ready, session, enableMfa, verifyMfa, logout } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [setup, setSetup] = useState<MfaSetupResult | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!ready) {
    return (
      <main className="foundation-shell">
        <p role="status">Checking your access…</p>
      </main>
    );
  }

  if (!authenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  if (session?.user?.mustChangePassword) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }

  const startEnrollment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password) {
      setFormError('Enter your password to generate an authenticator key.');
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const result = await enableMfa(password);
      setSetup(result);
    } catch (cause: unknown) {
      setFormError(getErrorMessage(cause, 'Could not start multi-factor authentication setup.'));
    } finally {
      setPending(false);
    }
  };

  const finishEnrollment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateMfa({ code });
    if (validation.code) {
      setCodeError(validation.code);
      return;
    }
    setCodeError(null);
    setPending(true);
    setFormError(null);
    try {
      const response = await verifyMfa({ code, trustDevice: false });
      navigate(roleHomePath(response), { replace: true });
    } catch (cause: unknown) {
      setFormError(getErrorMessage(cause, 'The verification code was not accepted.'));
    } finally {
      setPending(false);
    }
  };

  const handleSignOut = async () => {
    const target = loginPathForRoles(session?.roles);
    await logout();
    navigate(target, { replace: true });
  };

  const secret = extractSecret(setup?.totpURI);

  return (
    <AuthShell portal="staff">
      {!setup ? (
        <form className="cc-form" noValidate onSubmit={startEnrollment}>
          <header className="cc-form__header">
            <p className="cc-eyebrow">Security setup</p>
            <h1>Set up two-factor authentication</h1>
            <p>
              Administrative and committee accounts require an authenticator app before opening the workspace. Confirm your password to generate your setup key.
            </p>
          </header>

          <div className="cc-form__panel">
            {formError && (
              <div className="cc-notice cc-notice--danger" role="alert">
                <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <strong>Setup failed</strong>
                  <p>{formError}</p>
                </div>
              </div>
            )}

            <AuthField
              id="mfa-setup-password"
              label="Your password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
            />

            <button
              type="submit"
              className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
              disabled={pending}
              aria-busy={pending || undefined}
            >
              {pending && <span className="cc-spinner" aria-hidden="true" />}
              {pending ? 'Generating key…' : 'Generate authenticator key'}
            </button>
          </div>

          <p className="cc-form__links">
            <button type="button" className="cc-textlink" onClick={handleSignOut}>
              <LogOut size={14} strokeWidth={2} aria-hidden="true" />
              Sign out
            </button>
          </p>
        </form>
      ) : (
        <form className="cc-form" noValidate onSubmit={finishEnrollment}>
          <header className="cc-form__header">
            <p className="cc-eyebrow">Security setup</p>
            <h1>Add account to your authenticator</h1>
            <p>
              Enter this setup key into your authenticator app (such as Google Authenticator, 1Password, or Authy), save your backup codes, then enter the 6-digit code below.
            </p>
          </header>

          <div className="cc-form__panel">
            {formError && (
              <div className="cc-notice cc-notice--danger" role="alert">
                <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <strong>Verification failed</strong>
                  <p>{formError}</p>
                </div>
              </div>
            )}

            {secret && (
              <div>
                <strong>Manual setup key</strong>
                <div className="cc-codeblock" data-testid="mfa-secret">
                  {secret}
                </div>
              </div>
            )}

            {setup.totpURI && (
              <div>
                <strong>Authenticator URI</strong>
                <div className="cc-codeblock">{setup.totpURI}</div>
              </div>
            )}

            {setup.backupCodes && setup.backupCodes.length > 0 && (
              <div className="cc-notice cc-notice--warning" role="status">
                <ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <strong>Save these backup codes in a safe place</strong>
                  <p>Each code can be used once if you lose access to your authenticator device.</p>
                  <ul className="cc-backup-codes">
                    {setup.backupCodes.map((backup) => (
                      <li key={backup}>{backup}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <AuthField
              id="mfa-enroll-code"
              label="6-digit authenticator code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              error={codeError}
            />

            <button
              type="submit"
              className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
              disabled={pending}
              aria-busy={pending || undefined}
            >
              {pending && <span className="cc-spinner" aria-hidden="true" />}
              {pending ? 'Verifying…' : 'Verify and finish setup'}
            </button>
          </div>

          <p className="cc-form__links">
            <button type="button" className="cc-textlink" onClick={handleSignOut}>
              <LogOut size={14} strokeWidth={2} aria-hidden="true" />
              Sign out
            </button>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
