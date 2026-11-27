import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { httpClient } from '../../services/httpClient';
import { getErrorMessage } from '../../services/errorMapper';

export function StudentRegisterPage() {
  const navigate = useNavigate();
  const { verifyAccount, login } = useAuth();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    registrationNumber: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const normalizedRegistrationNumber = values.registrationNumber.trim().toUpperCase();
      const result = await httpClient.post('/public/auth/register-student', {
        ...values,
        registrationNumber: normalizedRegistrationNumber,
      });
      if (!result.developmentVerificationToken) {
        navigate('/auth/verify-account', { state: { email: values.email } });
        return;
      }
      await verifyAccount({ email: values.email, token: result.developmentVerificationToken });
      await login({ email: values.email, password: values.password });
      await httpClient.post('/students/claim', {
        registrationNumber: normalizedRegistrationNumber,
      });
      navigate('/student', { replace: true });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Unable to create student account.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page student-auth-page">
      <form className="student-auth-form" onSubmit={submit}>
        <p className="section-kicker">Student access</p>
        <h1>Create student account</h1>
        <p className="student-auth-form__lead">
          Create a separate student account and link your university registration number (e.g. CT206/204483/24 or CT201/000001/23).
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <label>
          Full name
          <input
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            required
          />
        </label>
        <label>
          Email address
          <input
            type="email"
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={12}
            value={values.password}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
            required
          />
        </label>
        <label>
          University registration number
          <input
            value={values.registrationNumber}
            onChange={(event) => setValues({ ...values, registrationNumber: event.target.value })}
            placeholder="CT206/204483/24"
            required
          />
        </label>
        <button className="primary-button" disabled={pending}>
          {pending ? 'Creating account…' : 'Create student account'}
        </button>
        <p className="student-auth-form__footer">
          Already have a student account? <Link to="/student/auth/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
