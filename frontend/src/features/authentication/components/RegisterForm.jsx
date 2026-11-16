import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/common/Button.jsx';
import { FormField } from '../../../components/forms/FormField.jsx';
import { Alert } from '../../../components/feedback/Alert.jsx';
import { PORTAL_ROLE_OPTIONS, validateRegistration } from '../validation/auth.schema.js';

export function RegisterForm({ onSubmit, pending = false, error = null, defaultRole = 'STUDENT' }) {
  const [role, setRole] = useState(defaultRole);
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const isStudent = role === 'STUDENT';

  const selectRole = (nextRole) => {
    setRole(nextRole);
    setErrors({});
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegistration({ ...values, role }, { role });
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) {
      await onSubmit({ name: values.name, email: values.email, password: values.password, role });
    }
  };

  return (
    <form noValidate onSubmit={submit}>
      <h1>Create an account</h1>
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
      <p>
        {isStudent
          ? 'Sign up with your MUST student email address (e.g. name123456@students.must.ac.ke).'
          : 'Roles for staff and committee members are assigned by the organisation; they cannot be selected here.'}
      </p>
      {error && (
        <Alert tone="danger" title="Unable to create account">
          {error}
        </Alert>
      )}
      <FormField id="name" label="Full name" error={errors.name}>
        <input
          id="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          aria-invalid={Boolean(errors.name)}
        />
      </FormField>
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
      <FormField id="password" label="Password" hint="At least 12 characters." error={errors.password}>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          aria-invalid={Boolean(errors.password)}
        />
      </FormField>
      <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
          aria-invalid={Boolean(errors.confirmPassword)}
        />
      </FormField>
      <Button type="submit" loading={pending}>
        Create account
      </Button>
      <p>
        Already registered? <Link to="/auth/login">Sign in</Link>.
      </p>
    </form>
  );
}
