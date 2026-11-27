import { useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/forms/FormField';
import { Alert } from '../../components/feedback/Alert';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { validatePasswordReset } from '../../features/authentication/validation/auth.schema';
import { getErrorMessage } from '../../services/errorMapper';

interface ResetPasswordState {
  pending: boolean;
  error: string | null;
  complete: boolean;
}

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = (location.state as { userId?: string; token?: string } | null) ?? null;

  const queryUserId = searchParams.get('userId')?.trim() ?? '';
  const queryToken = searchParams.get('token')?.trim() ?? '';
  const hasQueryLink = Boolean(queryUserId && queryToken);

  const [values, setValues] = useState({
    userId: queryUserId || locationState?.userId || '',
    token: queryToken || locationState?.token || '',
    password: '',
    confirmPassword: '',
  });
  const [state, setState] = useState<ResetPasswordState>({
    pending: false,
    error: null,
    complete: false,
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validatePasswordReset(values);
    if (Object.keys(errors).length) {
      return setState({ ...state, error: Object.values(errors)[0] ?? 'Password reset failed.' });
    }
    setState({ pending: true, error: null, complete: false });
    try {
      await resetPassword({
        userId: values.userId.trim(),
        token: values.token.trim(),
        password: values.password,
      });
      setState({ pending: false, error: null, complete: true });
    } catch (cause: unknown) {
      setState({
        pending: false,
        error: getErrorMessage(cause, 'Password reset failed.'),
        complete: false,
      });
    }
  };

  return (
    <main className="auth-page">
      <form noValidate onSubmit={submit}>
        <h1>Choose a new password</h1>
        <p>Enter a new password of at least 12 characters for your account.</p>
        {state.error && (
          <Alert tone="danger" title="Password reset failed">
            {state.error}
          </Alert>
        )}
        {state.complete && (
          <Alert tone="success" title="Password reset">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <Link to="/auth/login">Donor sign in</Link>
              <Link to="/student/auth/login">Student sign in</Link>
              <Link to="/staff/login">Staff sign in</Link>
            </div>
          </Alert>
        )}
        {!hasQueryLink && (
          <>
            <FormField id="user-id" label="User ID">
              <input
                id="user-id"
                value={values.userId}
                onChange={(event) => setValues({ ...values, userId: event.target.value })}
              />
            </FormField>
            <FormField id="reset-token" label="Reset token">
              <input
                id="reset-token"
                value={values.token}
                onChange={(event) => setValues({ ...values, token: event.target.value })}
              />
            </FormField>
          </>
        )}
        <FormField id="reset-password" label="New password" hint="At least 12 characters.">
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
          />
        </FormField>
        <FormField id="reset-password-confirmation" label="Confirm new password">
          <input
            id="reset-password-confirmation"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
          />
        </FormField>
        <Button type="submit" loading={state.pending}>
          Reset password
        </Button>
      </form>
    </main>
  );
}
