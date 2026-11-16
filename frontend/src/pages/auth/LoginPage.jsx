import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../../features/authentication/components/LoginForm.jsx';
import { useAuth } from '../../features/authentication/hooks/useAuth.js';

function destinationFor(response, fallback, role) {
  if (response?.requiresMfa) return '/auth/mfa';
  if (fallback) return fallback;
  if (response?.roles?.includes('STUDENT') || role === 'STUDENT') return '/student';
  if (response?.roles?.includes('DONOR')) return '/donor';
  if (response?.roles?.includes('ADMINISTRATOR') || response?.roles?.includes('ADMIN')) return '/admin';
  if (response?.roles?.includes('CLERK')) return '/clerk';
  if (response?.roles?.includes('COMMITTEE_MEMBER')) return '/committee';
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
    <main className="auth-page">
      <LoginForm onSubmit={submit} pending={pending} error={error} />
    </main>
  );
}
