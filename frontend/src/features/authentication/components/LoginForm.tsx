import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { AuthField } from './AuthField';
import { PortalSelector } from './PortalSelector';
import { validateLogin, validatePortalEmail, type PortalRoleCode } from '../validation/auth.schema';

const SUBTITLES: Record<PortalRoleCode, string> = {
  STUDENT: 'Use your MUST student email to open your support portal.',
  DONOR: 'Track your giving and manage how you are recognised.',
  ADMIN: 'Staff access for platform administration.',
  SECRETARIAT: 'Staff access for the records and committee office.',
};

export type LoginFormValues = {
  email: string;
  password: string;
  role: PortalRoleCode;
};

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  pending?: boolean;
  error?: string | null;
  defaultRole?: PortalRoleCode;
}

export function LoginForm({ onSubmit, pending = false, error = null, defaultRole = 'STUDENT' }: LoginFormProps) {
  const [role, setRole] = useState<PortalRoleCode>(defaultRole);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isStudent = role === 'STUDENT';
  const emailValue = values.email.trim();
  const emailValid = Boolean(emailValue) && !validatePortalEmail(emailValue, role);

  const withEmailError = (
    current: Record<string, string>,
    email: string,
    nextRole: PortalRoleCode,
  ): Record<string, string> => {
    const message = validatePortalEmail(email, nextRole);
    const next = { ...current };
    if (message) next.email = message;
    else delete next.email;
    return next;
  };

  const selectRole = (nextRole: PortalRoleCode) => {
    setRole(nextRole);
    setErrors({});
  };

  const changeEmail = (email: string) => {
    setValues({ ...values, email });
    if (errors.email) setErrors((current) => withEmailError(current, email, role));
  };

  const blurEmail = () => {
    if (values.email.trim()) setErrors((current) => withEmailError(current, values.email, role));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateLogin({ ...values, role }, { role });
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    await onSubmit({ ...values, role });
  };

  return (
    <form className="cc-form" noValidate onSubmit={submit}>
      <header className="cc-form__header">
        <h1>Welcome back</h1>
        <p>{SUBTITLES[role]}</p>
      </header>

      <PortalSelector role={role} onChange={selectRole} idPrefix="login" />

      <div className="cc-form__panel" role="tabpanel" id="login-panel" aria-labelledby={`login-tab-${role}`}>
        {error && (
          <div className="cc-notice cc-notice--danger" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>Unable to sign in</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <AuthField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder={isStudent ? 'name123456@students.must.ac.ke' : 'you@example.org'}
          hint={isStudent ? 'Format: name123456@students.must.ac.ke' : undefined}
          value={values.email}
          onChange={changeEmail}
          onBlur={blurEmail}
          error={errors.email}
          valid={emailValid}
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(password) => setValues({ ...values, password })}
          error={errors.password}
        />

        <div className="cc-form__row">
          <Link className="cc-link" to="/auth/password-recovery">
            Forgot your password?
          </Link>
        </div>

        <button type="submit" className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block" disabled={pending} aria-busy={pending || undefined}>
          {pending && <span className="cc-spinner" aria-hidden="true" />}
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </div>

      <p className="cc-form__alt">
        New here? <Link className="cc-link" to="/auth/register">Create an account</Link>
      </p>
    </form>
  );
}
