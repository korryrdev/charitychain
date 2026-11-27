import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, Info } from 'lucide-react';
import { AuthField } from './AuthField';
import { PortalSelector } from './PortalSelector';
import { passwordStrength } from '../passwordStrength';
import { validatePortalEmail, validateRegistration, type PortalRoleCode } from '../validation/auth.schema';

type RegisterRoleCode = 'STUDENT' | 'DONOR';
type RegisterField = 'name' | 'email' | 'password' | 'confirmPassword';

const SUBTITLES: Record<RegisterRoleCode, string> = {
  STUDENT: 'Sign up with your MUST student email address.',
  DONOR: 'Create a donor account to give and follow your impact.',
};

export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  role: RegisterRoleCode;
};

export interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => void | Promise<void>;
  pending?: boolean;
  error?: string | null;
  defaultRole?: PortalRoleCode;
}

export function RegisterForm({ onSubmit, pending = false, error = null, defaultRole = 'STUDENT' }: RegisterFormProps) {
  const [role, setRole] = useState<RegisterRoleCode>(defaultRole === 'DONOR' ? 'DONOR' : 'STUDENT');
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isStudent = role === 'STUDENT';
  const emailValue = values.email.trim();
  const emailValid = Boolean(emailValue) && !validatePortalEmail(emailValue, role);
  const strength = passwordStrength(values.password);
  const passwordsMatch = Boolean(values.confirmPassword) && values.confirmPassword === values.password;

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
    setRole(nextRole === 'DONOR' ? 'DONOR' : 'STUDENT');
    setErrors({});
  };

  const set = (field: RegisterField) => (value: string) => setValues({ ...values, [field]: value });

  const changeEmail = (email: string) => {
    setValues({ ...values, email });
    if (errors.email) setErrors((current) => withEmailError(current, email, role));
  };

  const blurEmail = () => {
    if (values.email.trim()) setErrors((current) => withEmailError(current, values.email, role));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRegistration({ ...values, role }, { role });
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    await onSubmit({ name: values.name, email: values.email, password: values.password, role });
  };

  return (
    <form className="cc-form" noValidate onSubmit={submit}>
      <header className="cc-form__header">
        <h1>Create your account</h1>
        <p>{SUBTITLES[role]}</p>
      </header>

      <PortalSelector role={role} onChange={selectRole} idPrefix="register" allowStaff={false} />

      <div className="cc-form__panel" role="tabpanel" id="register-panel" aria-labelledby={`register-tab-${role}`}>
        {error && (
          <div className="cc-notice cc-notice--danger" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>Unable to create account</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <AuthField
          id="name"
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={set('name')}
          error={errors.name}
        />

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
          autoComplete="new-password"
          hint="At least 12 characters."
          value={values.password}
          onChange={set('password')}
          error={errors.password}
        >
          {values.password && (
            <div className="cc-strength" data-level={strength.level}>
              <div className="cc-strength__bar" role="presentation">
                <span style={{ width: `${strength.percent}%` }} />
              </div>
              <span className="cc-strength__label" aria-live="polite">
                Strength: {strength.label}
                {strength.needed ? ` (${strength.needed} more character${strength.needed === 1 ? '' : 's'})` : ''}
              </span>
            </div>
          )}
        </AuthField>

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
          hint={passwordsMatch ? 'Passwords match.' : undefined}
        />

        <p className="cc-form__note">
          <Info size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Staff and committee accounts are created by an administrator, so they are not available here.</span>
        </p>

        <button type="submit" className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block" disabled={pending} aria-busy={pending || undefined}>
          {pending && <span className="cc-spinner" aria-hidden="true" />}
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </div>

      <p className="cc-form__alt">
        Already registered? <Link className="cc-link" to="/auth/login">Sign in</Link>
      </p>
    </form>
  );
}
