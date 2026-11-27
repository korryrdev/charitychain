import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, Info, LogOut } from 'lucide-react';
import { AuthField } from '../../features/authentication/components/AuthField';
import { AuthShell } from '../../features/authentication/components/AuthShell';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { useCountdown } from '../../features/authentication/hooks/useCountdown';
import { nextAuthPath } from '../../features/authentication/nextStep';
import { passwordStrength } from '../../features/authentication/passwordStrength';
import { loginPathForRoles } from '../../features/authentication/portals';
import { validateChangePassword } from '../../features/authentication/validation/auth.schema';
import { getErrorMessage, getRetryAfterSeconds, isRateLimited } from '../../services/errorMapper';

export function ChangePasswordPage() {
  const { authenticated, ready, session, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const cooldown = useCountdown();

  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!ready) {
    return (
      <main className="foundation-shell">
        <p role="status">Checking your access…</p>
      </main>
    );
  }

  if (!authenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  const strength = passwordStrength(values.newPassword);
  const passwordsMatch =
    Boolean(values.confirmPassword) && values.confirmPassword === values.newPassword;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown.active) return;

    const nextErrors = validateChangePassword(values);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setPending(true);
    setFormError(null);
    try {
      const response = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      navigate(nextAuthPath(response), { replace: true });
    } catch (cause: unknown) {
      if (isRateLimited(cause)) {
        const seconds = getRetryAfterSeconds(cause) ?? 30;
        cooldown.start(seconds);
        setFormError(`Too many attempts. Please wait ${seconds} seconds before trying again.`);
      } else {
        setFormError(getErrorMessage(cause, 'Could not update your password.'));
      }
    } finally {
      setPending(false);
    }
  };

  const handleSignOut = async () => {
    const target = loginPathForRoles(session?.roles);
    await logout();
    navigate(target, { replace: true });
  };

  return (
    <AuthShell portal="staff">
      <form className="cc-form" noValidate onSubmit={submit}>
        <header className="cc-form__header">
          <p className="cc-eyebrow">Account setup</p>
          <h1>Choose your own password</h1>
          <p>
            Before you can use CharityChain, replace the temporary password from your invitation email. Once updated, the temporary password stops working immediately.
          </p>
        </header>

        <div className="cc-form__panel">
          <div className="cc-notice cc-notice--info" role="status">
            <Info size={20} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>Temporary password invalidated on save</strong>
              <p>Any other active sessions will also be signed out.</p>
            </div>
          </div>

          {formError && (
            <div className="cc-notice cc-notice--danger" role="alert">
              <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
              <div>
                <strong>Unable to change password</strong>
                <p>{formError}</p>
              </div>
            </div>
          )}

          <AuthField
            id="currentPassword"
            label="Current (temporary) password"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={(currentPassword) =>
              setValues((current) => ({ ...current, currentPassword }))
            }
            error={errors.currentPassword}
          />

          <AuthField
            id="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 12 characters."
            value={values.newPassword}
            onChange={(newPassword) => setValues((current) => ({ ...current, newPassword }))}
            error={errors.newPassword}
          >
            {values.newPassword && (
              <div className="cc-strength" data-level={strength.level}>
                <div className="cc-strength__bar" role="presentation">
                  <span style={{ width: `${strength.percent}%` }} />
                </div>
                <span className="cc-strength__label" aria-live="polite">
                  Strength: {strength.label}
                  {strength.needed
                    ? ` (${strength.needed} more character${strength.needed === 1 ? '' : 's'})`
                    : ''}
                </span>
              </div>
            )}
          </AuthField>

          <AuthField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(confirmPassword) =>
              setValues((current) => ({ ...current, confirmPassword }))
            }
            error={errors.confirmPassword}
            hint={passwordsMatch ? 'Passwords match.' : undefined}
          />

          <button
            type="submit"
            className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
            disabled={pending || cooldown.active}
            aria-busy={pending || undefined}
          >
            {pending && <span className="cc-spinner" aria-hidden="true" />}
            {cooldown.active
              ? `Try again in ${cooldown.remaining}s`
              : pending
                ? 'Saving password…'
                : 'Save password and continue'}
          </button>
        </div>

        <p className="cc-form__links">
          <button type="button" className="cc-textlink" onClick={handleSignOut}>
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            Sign out
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
