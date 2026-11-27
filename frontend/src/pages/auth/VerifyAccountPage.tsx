import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/forms/FormField';
import { Alert } from '../../components/feedback/Alert';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { validateEmail } from '../../features/authentication/validation/auth.schema';
import { getErrorMessage } from '../../services/errorMapper';

interface VerifyAccountState {
  pending: boolean;
  error: string | null;
  complete: boolean;
}

export function VerifyAccountPage() {
  const { verifyAccount } = useAuth();
  const location = useLocation();
  const developmentToken = location.state?.developmentVerificationToken;
  const [values, setValues] = useState({
    email: location.state?.email ?? '',
    token: developmentToken ?? '',
  });
  const [state, setState] = useState<VerifyAccountState>({
    pending: false,
    error: null,
    complete: false,
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateEmail(values);
    if (Object.keys(errors).length || values.token.length < 32) {
      return setState({
        ...state,
        error: 'Enter your email and the complete verification token.',
      });
    }
    setState({ pending: true, error: null, complete: false });
    try {
      await verifyAccount(values);
      setState({ pending: false, error: null, complete: true });
    } catch (cause: unknown) {
      setState({
        pending: false,
        error: getErrorMessage(cause, 'Verification failed.'),
        complete: false,
      });
    }
  };

  return (
    <main className="auth-page">
      <form noValidate onSubmit={submit}>
        <h1>Verify your account</h1>
        <p>Use the verification token sent to your registered email address.</p>
        {developmentToken && (
          <Alert tone="warning" title="Local development token">
            Email delivery is not configured locally, so the token has been filled in for testing. It is never returned in production.
          </Alert>
        )}
        {state.error && (
          <Alert tone="danger" title="Verification failed">
            {state.error}
          </Alert>
        )}
        {state.complete && (
          <Alert tone="success" title="Account verified">
            <Link to="/auth/login">You can now sign in.</Link>
          </Alert>
        )}
        <FormField id="verify-email" label="Email address">
          <input
            id="verify-email"
            type="email"
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
          />
        </FormField>
        <FormField id="verification-token" label="Verification token">
          <input
            id="verification-token"
            value={values.token}
            onChange={(event) => setValues({ ...values, token: event.target.value })}
          />
        </FormField>
        <Button type="submit" loading={state.pending}>
          Verify account
        </Button>
      </form>
    </main>
  );
}
