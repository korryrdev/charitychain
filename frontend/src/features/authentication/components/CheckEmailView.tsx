import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleAlert, MailCheck } from 'lucide-react';
import { AuthField } from './AuthField';
import { useAuth } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import { PORTALS } from '../portals';
import { validateEmail } from '../validation/auth.schema';
import { getErrorMessage, getRetryAfterSeconds, isRateLimited } from '../../../services/errorMapper';

export interface CheckEmailViewProps {
  portal: 'student' | 'donor';
}

export function CheckEmailView({ portal }: CheckEmailViewProps) {
  const config = PORTALS[portal];
  const location = useLocation();
  const stateEmail = (location.state as { email?: string } | null)?.email;
  const { resendVerification } = useAuth();

  const [email, setEmail] = useState(typeof stateEmail === 'string' ? stateEmail : '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const cooldown = useCountdown();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown.active) return;

    const normalized = email.trim().toLowerCase();
    const validation = validateEmail({ email: normalized });
    if (validation.email) {
      setError(validation.email);
      return;
    }

    setPending(true);
    setError(null);
    setResent(false);
    try {
      await resendVerification(normalized);
      setResent(true);
      cooldown.start(60);
    } catch (cause: unknown) {
      const wait = getRetryAfterSeconds(cause);
      if (isRateLimited(cause) && wait !== null) cooldown.start(wait);
      setError(getErrorMessage(cause, 'Could not resend verification email.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="cc-form" noValidate onSubmit={submit}>
      <header className="cc-form__header">
        <p className="cc-eyebrow">{config.kicker}</p>
        <h1>Check your inbox</h1>
        <p>
          {email
            ? `If ${email} can be registered here, we sent a confirmation link to it.`
            : 'Enter your email address if you need us to send another confirmation link.'}{' '}
          Click the link in the email to verify your address before signing in.
        </p>
      </header>

      <div className="cc-form__panel">
        <div className="cc-notice cc-notice--info" role="status">
          <MailCheck size={20} strokeWidth={1.75} aria-hidden="true" />
          <div>
            <strong>Verification required before sign-in</strong>
            <p>You will not be signed in automatically. Check spam or junk folders if you do not see the email within a minute.</p>
          </div>
        </div>

        {error && (
          <div className="cc-notice cc-notice--danger" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>Unable to resend</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {resent && (
          <div className="cc-notice cc-notice--success" role="status">
            <MailCheck size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>Verification email requested</strong>
              <p>If that account is waiting for verification, a new link is on the way.</p>
            </div>
          </div>
        )}

        {!stateEmail && (
          <AuthField
            id="check-email-address"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder={config.emailPlaceholder}
            value={email}
            onChange={setEmail}
          />
        )}

        <button
          type="submit"
          className="cc-btn cc-btn--secondary cc-btn--lg cc-btn--block"
          disabled={pending || cooldown.active || !email.trim()}
          aria-busy={pending || undefined}
        >
          {cooldown.active
            ? `Resend email in ${cooldown.remaining}s`
            : pending
              ? 'Sending…'
              : 'Resend verification email'}
        </button>
      </div>

      <p className="cc-form__alt">
        Already verified?{' '}
        <Link className="cc-link" to={config.loginPath}>
          Go to sign in
        </Link>
      </p>
    </form>
  );
}
