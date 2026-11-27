import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, Info } from 'lucide-react';
import { AuthField } from './AuthField';
import { AuthPortalNav } from './AuthPortalNav';
import { passwordStrength } from '../passwordStrength';
import { PORTALS } from '../portals';
import { validatePortalEmail, validateRegistration } from '../validation/auth.schema';

type RegisterField = 'name' | 'email' | 'password' | 'confirmPassword';

export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  role: 'DONOR';
};

export interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => void | Promise<void>;
  pending?: boolean;
  error?: string | null;
  cooldownSeconds?: number;
}

export function RegisterForm({
  onSubmit,
  pending = false,
  error = null,
  cooldownSeconds = 0,
}: RegisterFormProps) {
  const config = PORTALS.donor;
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const emailValue = values.email.trim();
  const emailValid = Boolean(emailValue) && !validatePortalEmail(emailValue, 'DONOR');
  const strength = passwordStrength(values.password);
  const passwordsMatch = Boolean(values.confirmPassword) && values.confirmPassword === values.password;

  const set = (field: RegisterField) => (value: string) => setValues({ ...values, [field]: value });

  const changeEmail = (email: string) => {
    setValues({ ...values, email });
    if (errors.email) {
      const msg = validatePortalEmail(email, 'DONOR');
      setErrors((current) => {
        const next = { ...current };
        if (msg) next.email = msg;
        else delete next.email;
        return next;
      });
    }
  };

  const blurEmail = () => {
    if (values.email.trim()) {
      const msg = validatePortalEmail(values.email, 'DONOR');
      setErrors((current) => {
        const next = { ...current };
        if (msg) next.email = msg;
        else delete next.email;
        return next;
      });
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldownSeconds > 0) return;
    const nextErrors = validateRegistration({ ...values, role: 'DONOR' }, { role: 'DONOR' });
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    await onSubmit({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      role: 'DONOR',
    });
  };

  const disabled = pending || cooldownSeconds > 0;

  return (
    <form className="cc-form" noValidate onSubmit={submit}>
      <header className="cc-form__header">
        <p className="cc-eyebrow">{config.kicker}</p>
        <h1>{config.registerTitle}</h1>
        <p>{config.registerSubtitle}</p>
      </header>

      <AuthPortalNav mode="register" active="donor" />

      <div className="cc-form__panel">
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
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          placeholder={config.emailPlaceholder}
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

        <button
          type="submit"
          className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
          disabled={disabled}
          aria-busy={pending || undefined}
        >
          {pending && <span className="cc-spinner" aria-hidden="true" />}
          {cooldownSeconds > 0
            ? `Try again in ${cooldownSeconds}s`
            : pending
              ? 'Creating account…'
              : 'Create donor account'}
        </button>
      </div>

      <p className="cc-form__alt">
        Already registered?{' '}
        <Link className="cc-link" to="/auth/login">
          Sign in
        </Link>
      </p>
      <p className="cc-form__links">
        <span>Are you a student?</span>
        <Link className="cc-link" to="/student/auth/register">
          Create a student account
        </Link>
      </p>
    </form>
  );
}
