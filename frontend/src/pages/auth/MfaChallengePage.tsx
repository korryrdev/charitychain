import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MfaForm } from '../../features/authentication/components/MfaForm';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { nextAuthPath } from '../../features/authentication/nextStep';
import { getErrorMessage } from '../../services/errorMapper';

export function MfaChallengePage() {
  const { verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (values: Record<string, unknown>) => {
    setPending(true);
    setError(null);
    try {
      const response = await verifyMfa(values);
      navigate(nextAuthPath(response), { replace: true });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Verification failed.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <MfaForm onSubmit={submit} pending={pending} error={error} />
    </main>
  );
}
