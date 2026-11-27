import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { AuthField } from './AuthField';
import { AuthPortalNav } from './AuthPortalNav';
import { useAuth } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import { nextAuthPath } from '../nextStep';
import { PORTALS, safeReturnPath } from '../portals';
import type { LoginPortalCode } from '../services/auth.api';
import { validateLogin, validatePortalEmail } from '../validation/auth.schema';
import {
  getErrorCode,
  getErrorMessage,
  getRetryAfterSeconds,
  isRateLimited,
} from '../../../services/errorMapper';

export interface AuthPortalLoginFormProps {
  portal: LoginPortalCode;
  verifiedBanner?: boolean;
}

interface LocationAuthState {
  from?: unknown;
  verified?: boolean;
  email?: string;
}

function rolesMatchPortal(portal: LoginPortalCode, roles: readonly string[] | undefined): boolean {
  const list = roles ?? [];
  if (portal === 'student') return list.includes('STUDENT');
  if (portal === 'donor') return list.includes('DONOR');
  return list.some((role) => role !== 'STUDENT' && role !== 'DONOR');
}

export function AuthPortalLoginForm({ portal, verifiedBanner }: AuthPortalLoginFormProps) {
  const config = PORTALS[portal];
  const { login, logout, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationAuthState | null) ?? null;

  const [values, setValues] = useState({
    email: typeof state?.email === 'string' ? state.email : '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const lockCountdown = useCountdown();
  const resendCountdown = useCountdown();

  const showVerified = Boolean(verifiedBanner ?? state?.verified);
  const emailValue = values.email.trim();
  const emailValid = Boolean(emailValue) && !validatePortalEmail(emailValue, config.emailRule);

  const changeEmail = (email: string) => {
    setValues((current) => ({ ...current, email }));
    if (errors.email) {
      const msg = validatePortalEmail(email, config.emailRule);
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
      const msg = validatePortalEmail(values.email, config.emailRule);
      setErrors((current) => {
        const next = { ...current };
        if (msg) next.email = msg;
        else delete next.email;
        return next;
      });
    }
  };

  const handleResend = async () => {
    if (!emailValue || resendPending || resendCountdown.active) return;
    setResendPending(true);
    setResendMessage(null);
    try {
      await resendVerification(emailValue);
      setResendMessage('If an unverified account exists for this address, a fresh verification link has been sent.');
      resendCountdown.start(60);
    } catch (cause: unknown) {
      const wait = getRetryAfterSeconds(cause);
      if (isRateLimited(cause) && wait !== null) resendCountdown.start(wait);
      setResendMessage(getErrorMessage(cause, 'Could not resend the verification email.'));
    } finally {
      setResendPending(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lockCountdown.active) return;

    const nextErrors = validateLogin(values, { role: config.emailRule });
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setPending(true);
    setFormError(null);
    setErrorCode(null);
    setResendMessage(null);
    try {
      const response = await login({
        email: values.email,
        password: values.password,
        portal,
      });

      if (!response?.requiresMfa && !response?.twoFactorRedirect && !rolesMatchPortal(portal, response?.roles)) {
        await logout();
        setFormError('The email or password is incorrect.');
        setErrorCode('INVALID_CREDENTIALS');
        return;
      }

      navigate(nextAuthPath(response, safeReturnPath(state?.from)), { replace: true });
    } catch (cause: unknown) {
      const code = getErrorCode(cause);
      setErrorCode(code);
      if (isRateLimited(cause)) {
        const seconds = getRetryAfterSeconds(cause) ?? 30;
        lockCountdown.start(seconds);
        setFormError(`Too many failed attempts. Please wait ${seconds} seconds before trying again.`);
      } else {
        setFormError(getErrorMessage(cause, 'Unable to sign in.'));
      }
    } finally {
      setPending(false);
    }
  };

  const submitDisabled = pending || lockCountdown.active;

  return (
    <form className="cc-form" noValidate onSubmit={submit}>
      <header className="cc-form__header">
        <p className="cc-eyebrow">{config.kicker}</p>
        <h1>{config.loginTitle}</h1>
        <p>{config.loginSubtitle}</p>
      </header>

      {(portal === 'donor' || portal === 'student') && (
        <AuthPortalNav mode="login" active={portal} />
      )}

      <div className="cc-form__panel">
        {showVerified && !formError && (
          <div className="cc-notice cc-notice--success" role="status">
            <CircleCheck size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>Email verified</strong>
              <p>Your account is active. You can sign in below.</p>
            </div>
          </div>
        )}

        {formError && (
          <div className="cc-notice cc-notice--danger" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>Unable to sign in</strong>
              <p>{formError}</p>
              {errorCode === 'ACCOUNT_NOT_VERIFIED' && (
                <div className="cc-notice__actions">
                  <button
                    type="button"
                    className="cc-btn cc-btn--secondary cc-btn--sm"
                    disabled={resendPending || resendCountdown.active || !emailValue}
                    onClick={handleResend}
                  >
                    {resendCountdown.active
                      ? `Resend in ${resendCountdown.remaining}s`
                      : resendPending
                        ? 'Sending…'
                        : 'Resend verification email'}
                  </button>
                </div>
              )}
              {errorCode === 'TEMP_PASSWORD_EXPIRED' && (
                <div className="cc-notice__actions">
                  <Link className="cc-link" to="/auth/password-recovery">
                    Reset your password
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {resendMessage && (
          <div className="cc-notice cc-notice--info" role="status">
            <Info size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <p>{resendMessage}</p>
            </div>
          </div>
        )}

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
          hint={config.emailHint}
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
          enterKeyHint="done"
          value={values.password}
          onChange={(password) => setValues((current) => ({ ...current, password }))}
          error={errors.password}
        />

        <div className="cc-form__row">
          <Link className="cc-link" to="/auth/password-recovery">
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
          disabled={submitDisabled}
          aria-busy={pending || undefined}
        >
          {pending && <span className="cc-spinner" aria-hidden="true" />}
          {lockCountdown.active
            ? `Try again in ${lockCountdown.remaining}s`
            : pending
              ? 'Signing in…'
              : 'Sign in'}
        </button>
      </div>

      {portal === 'donor' && (
        <>
          <p className="cc-form__alt">
            New donor?{' '}
            <Link className="cc-link" to="/auth/register">
              Create a donor account
            </Link>
          </p>
          <p className="cc-form__links">
            <Link className="cc-link" to="/student/auth/login">
              Student sign in
            </Link>
            <span aria-hidden="true">·</span>
            <Link className="cc-link" to="/staff/login">
              Staff sign in
            </Link>
          </p>
        </>
      )}

      {portal === 'student' && (
        <>
          <p className="cc-form__alt">
            New student?{' '}
            <Link className="cc-link" to="/student/auth/register">
              Create a student account
            </Link>
          </p>
          <p className="cc-form__links">
            <Link className="cc-link" to="/auth/login">
              Donor sign in
            </Link>
          </p>
        </>
      )}

      {portal === 'staff' && (
        <p className="cc-form__note">
          <Info size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Staff accounts are provisioned by an administrator. There is no self-registration.</span>
        </p>
      )}
    </form>
  );
}
