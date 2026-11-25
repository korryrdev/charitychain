import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../features/authentication/components/AuthShell.jsx';
import { LoginForm } from '../../features/authentication/components/LoginForm.jsx';
import { useAuth } from '../../features/authentication/hooks/useAuth.js';
import { defaultAuthorizedPath } from '../../features/authorization/permissions.js';

function destinationFor(response, fallback, role) {
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
  const [error, setError] = useState(null);

  const submit = async (values) => {
    setPending(true);
    setError(null);
    try {
      const response = await login(values);
      navigate(destinationFor(response, location.state?.from, values.role), { replace: true });
    } catch (cause) {
      setError(cause.message);
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
