import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../features/authentication/components/AuthShell';
import { LoginForm } from '../../features/authentication/components/LoginForm';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { defaultAuthorizedPath } from '../../features/authorization/permissions';
import { getErrorMessage } from '../../services/errorMapper';

function destinationFor(
  response: Record<string, any> | null | undefined,
  fallback: string | undefined,
  role: string | undefined
): string {
  if (response?.requiresMfa) return '/auth/mfa';
  if (fallback) return fallback;
  const authorized = defaultAuthorizedPath(response);
  if (authorized !== '/') return authorized;
  if (response?.roles?.includes('ADMIN')) return '/admin';
  if (role === 'STUDENT') return '/student';
  if (role === 'DONOR') return '/donor';
  return '/';
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    values: Record<string, any> & { email: string; role?: string }
  ) => {
    setPending(true);
    setError(null);
    try {
      const response = await login(values);
      navigate(destinationFor(response, location.state?.from, values.role), { replace: true });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Unable to sign in.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell>
      <LoginForm onSubmit={submit} pending={pending} error={error} />
    </AuthShell>
  );
}
