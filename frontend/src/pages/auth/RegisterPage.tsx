import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../../features/authentication/components/AuthShell';
import { RegisterForm } from '../../features/authentication/components/RegisterForm';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { getErrorMessage } from '../../services/errorMapper';

export function RegisterPage() {
  const { register, verifyAccount, login } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    values: Record<string, any> & { email: string; role?: string }
  ) => {
    setPending(true);
    setError(null);
    try {
      const result = await register(values);
      if (result.developmentVerificationToken) {
        await verifyAccount({ email: values.email, token: result.developmentVerificationToken });
        const session = await login(values);
        const destination =
          session.roles?.includes('STUDENT') || values.role === 'STUDENT'
            ? '/student'
            : session.roles?.includes('DONOR')
              ? '/donor'
              : '/';
        navigate(destination, { replace: true });
        return;
      }
      navigate('/auth/verify-account', { state: { email: values.email } });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Unable to create account.'));
    } finally {
      setPending(false);
    }
  };
  return (
    <AuthShell>
      <RegisterForm onSubmit={submit} pending={pending} error={error} />
    </AuthShell>
  );
}
