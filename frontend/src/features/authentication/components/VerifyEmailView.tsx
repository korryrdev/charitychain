import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleAlert, CircleCheck, ShieldCheck } from 'lucide-react';
import { AuthField } from './AuthField';
import { useAuth } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import { PORTALS } from '../portals';
import { validateEmail } from '../validation/auth.schema';
import { getErrorMessage, getRetryAfterSeconds, isRateLimited } from '../../../services/errorMapper';

export interface VerifyEmailViewProps {
  portal: 'student' | 'donor';
}

export function VerifyEmailView({ portal }: VerifyEmailViewProps) {
  const config = PORTALS[portal];
  const { verifyAccount, resendVerification } = useAuth();
  const [searchParams] = useSearchParams();

  const queryEmail = searchParams.get('email')?.trim() ?? '';
  const queryToken = searchParams.get('token')?.trim() ?? '';
  const hasQueryLink = Boolean(queryEmail && queryToken);

  const [values, setValues] = useState({
    email: queryEmail,
    token: queryToken,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const [resendPending, setResendPending] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const resendCooldown = useCountdown();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailErrors = validateEmail({ email: values.email });
    if (Object.keys(emailErrors).length || values.token.trim().length < 32) {
      setError('Enter your email and the complete verification token.');
      return;
    }

    setPending(true);
    setError(null);
    setResendInfo(null);
    try {
      await verifyAccount({ email: values.email.trim().toLowerCase(), token: values.token.trim() });
      setComplete(true);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Verification failed. The link may have expired or already been used.'));
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    const email = values.email.trim().toLowerCase();
    if (!email || resendPending || resendCooldown.active) return;
    setResendPending(true);
    setResendInfo(null);
    try {
      await resendVerification(email);
      setResendInfo('If your account still needs verification, a fresh link has been sent to your inbox.');
      resendCooldown.start(60);
    } catch (cause: unknown) {
      const wait = getRetryAfterSeconds(cause);
      if (isRateLimited(cause) && wait !== null) resendCooldown.start(wait);
      setResendInfo(getErrorMessage(cause, 'Could not send a new verification link.'));
    } finally {
      setResendPending(false);
    }
  };

  if (complete) {
    return (
      <div className="cc-form">
        <header className="cc-form__header">
          <p className="cc-eyebrow">{config.kicker}</p>
          <h1>Email verified</h1>
          <p>Your account is now active.</p>
        </header>

        <div className="cc-notice cc-notice--success" role="status">
          <CircleCheck size={20} strokeWidth={1.75} aria-hidden="true" />
          <div>
            <strong>Confirmation complete</strong>
            <p>You can now sign in with your email and password.</p>
          </div>
        </div>

        <Link
          className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
          to={config.loginPath}
          state={{ verified: true, email: values.email.trim().toLowerCase() }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="cc-form" noValidate onSubmit={submit}>
      <header className="cc-form__header">
        <p className="cc-eyebrow">{config.kicker}</p>
        <h1>Confirm your email</h1>
        <p>
          {hasQueryLink
            ? `Click below to confirm ${values.email} and activate your account.`
            : 'Paste the email address and verification token from your confirmation email.'}
        </p>
      </header>

      <div className="cc-form__panel">
        {error && (
          <div className="cc-notice cc-notice--danger" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>Verification failed</strong>
              <p>{error}</p>
              {values.email.trim() && (
                <div className="cc-notice__actions">
                  <button
                    type="button"
                    className="cc-btn cc-btn--secondary cc-btn--sm"
                    disabled={resendPending || resendCooldown.active}
                    onClick={handleResend}
                  >
                    {resendCooldown.active
                      ? `Send again in ${resendCooldown.remaining}s`
                      : resendPending
                        ? 'Sending…'
                        : 'Send a new verification link'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {resendInfo && (
          <div className="cc-notice cc-notice--info" role="status">
            <ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <p>{resendInfo}</p>
            </div>
          </div>
        )}

        {!hasQueryLink && (
          <>
            <AuthField
              id="verify-email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder={config.emailPlaceholder}
              value={values.email}
              onChange={(email) => setValues((current) => ({ ...current, email }))}
            />
            <AuthField
              id="verification-token"
              label="Verification token"
              value={values.token}
              onChange={(token) => setValues((current) => ({ ...current, token }))}
            />
          </>
        )}

        <button
          type="submit"
          className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
          disabled={pending}
          aria-busy={pending || undefined}
        >
          {pending && <span className="cc-spinner" aria-hidden="true" />}
          {pending ? 'Confirming…' : 'Confirm my email'}
        </button>
      </div>

      <p className="cc-form__alt">
        <Link className="cc-link" to={config.loginPath}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
