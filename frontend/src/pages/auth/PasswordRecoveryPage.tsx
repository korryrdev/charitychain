import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/forms/FormField';
import { Alert } from '../../components/feedback/Alert';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { validateEmail } from '../../features/authentication/validation/auth.schema';
import { getErrorMessage } from '../../services/errorMapper';

interface RecoveryState {
  pending: boolean;
  error: string | null;
  complete: boolean;
}

export function PasswordRecoveryPage() {
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<RecoveryState>({
    pending: false,
    error: null,
    complete: false,
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.keys(validateEmail({ email })).length) {
      return setState({ ...state, error: 'Enter a valid email address.' });
    }
    setState({ pending: true, error: null, complete: false });
    try {
      const response = await requestPasswordReset(email);
      if (response?.developmentResetToken) {
        navigate('/auth/reset-password', {
          state: {
            email: email.trim().toLowerCase(),
            userId: response.userId,
            developmentResetToken: response.developmentResetToken
          }
        });
        return;
      }
      setState({ pending: false, error: null, complete: true });
    } catch (cause: unknown) {
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
          <Alert tone="success" title="Request accepted">
            Check your email for the next step.
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
        <Button type="submit" loading={state.pending}>
          Send reset instructions
        </Button>
      </form>
    </main>
  );
}
