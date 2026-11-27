import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../../features/authentication/components/AuthShell';
import { RegisterForm, type RegisterFormValues } from '../../features/authentication/components/RegisterForm';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { useCountdown } from '../../features/authentication/hooks/useCountdown';
import { getErrorMessage, getRetryAfterSeconds, isRateLimited } from '../../services/errorMapper';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldown = useCountdown();

  const submit = async (values: RegisterFormValues) => {
    setPending(true);
    setError(null);
    try {
      const normalizedEmail = values.email.trim().toLowerCase();
      await register({ ...values, email: normalizedEmail });
      navigate('/auth/check-email', {
        replace: true,
        state: { email: normalizedEmail },
      });
    } catch (cause: unknown) {
      if (isRateLimited(cause)) {
        const seconds = getRetryAfterSeconds(cause) ?? 60;
        cooldown.start(seconds);
        setError(`Too many registration attempts. Please try again in ${seconds} seconds.`);
      } else {
        setError(getErrorMessage(cause, 'Unable to create account.'));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell portal="donor">
      <RegisterForm
        onSubmit={submit}
        pending={pending}
        error={error}
        cooldownSeconds={cooldown.remaining}
      />
    </AuthShell>
  );
}
