import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/forms/FormField';
import { Alert } from '../../components/feedback/Alert';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { useCountdown } from '../../features/authentication/hooks/useCountdown';
import { validateEmail } from '../../features/authentication/validation/auth.schema';
import { getErrorMessage, getRetryAfterSeconds, isRateLimited } from '../../services/errorMapper';

interface RecoveryState {
  pending: boolean;
  error: string | null;
  complete: boolean;
}

export function PasswordRecoveryPage() {
  const { requestPasswordReset } = useAuth();
  const cooldown = useCountdown();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<RecoveryState>({
    pending: false,
    error: null,
    complete: false,
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown.active) return;

    if (Object.keys(validateEmail({ email })).length) {
      return setState({ ...state, error: 'Enter a valid email address.' });
    }
    setState({ pending: true, error: null, complete: false });
    try {
      await requestPasswordReset(email);
      setState({ pending: false, error: null, complete: true });
    } catch (cause: unknown) {
      if (isRateLimited(cause)) {
        const seconds = getRetryAfterSeconds(cause) ?? 60;
        cooldown.start(seconds);
      }
      setState({
        pending: false,
        error: getErrorMessage(cause, 'Request failed.'),
        complete: false,
      });
    }
  };

  return (
    <main className="auth-page">
      <form noValidate onSubmit={submit}>
        <h1>Reset your password</h1>
        <p>We will send password-reset instructions if the address belongs to an account.</p>
        {state.error && (
          <Alert tone="danger" title="Request failed">
            {state.error}
          </Alert>
        )}
        {state.complete && (
          <Alert tone="success" title="Check your email">
            If an eligible account matches that address, we sent a password-reset link.
          </Alert>
        )}
        <FormField id="recovery-email" label="Email address">
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <Button type="submit" loading={state.pending} disabled={cooldown.active}>
          {cooldown.active ? `Try again in ${cooldown.remaining}s` : 'Send reset instructions'}
        </Button>
        <p className="cc-form__links" style={{ marginTop: '1rem' }}>
          <Link to="/auth/login">Donor sign in</Link>
          <Link to="/student/auth/login">Student sign in</Link>
          <Link to="/staff/login">Staff sign in</Link>
        </p>
      </form>
    </main>
  );
}
