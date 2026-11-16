import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/common/Button.jsx';
import { FormField } from '../../../components/forms/FormField.jsx';
import { Alert } from '../../../components/feedback/Alert.jsx';
import { PORTAL_ROLE_OPTIONS, validateLogin } from '../validation/auth.schema.js';

export function LoginForm({ onSubmit, pending = false, error = null, defaultRole = 'STUDENT' }) {
  const [role, setRole] = useState(defaultRole);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const isStudent = role === 'STUDENT';

  const selectRole = (nextRole) => {
    setRole(nextRole);
    setErrors({});
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLogin({ ...values, role }, { role });
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) await onSubmit({ ...values, role });
  };

  return (
    <form noValidate onSubmit={submit}>
      <h1>Sign in</h1>
      <div className="auth-role-tabs" role="tablist" aria-label="Account portal">
        {PORTAL_ROLE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={role === option.id}
            className={`auth-role-tab${role === option.id ? ' auth-role-tab--active' : ''}`}
            onClick={() => selectRole(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && (
        <Alert tone="danger" title="Unable to sign in">
          {error}
        </Alert>
      )}
      <FormField
        id="email"
        label="Email address"
        hint={isStudent ? 'Format: name123456@students.must.ac.ke' : undefined}
        error={errors.email}
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={isStudent ? 'name123456@students.must.ac.ke' : undefined}
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          aria-invalid={Boolean(errors.email)}
        />
      </FormField>
      <FormField id="password" label="Password" error={errors.password}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          aria-invalid={Boolean(errors.password)}
        />
      </FormField>
      <Button type="submit" loading={pending}>
        Sign in
      </Button>
      <p>
        <Link to="/auth/password-recovery">Forgot your password?</Link>
      </p>
      <p>
        New here? <Link to="/auth/register">Create an account</Link>.
      </p>
    </form>
  );
}
