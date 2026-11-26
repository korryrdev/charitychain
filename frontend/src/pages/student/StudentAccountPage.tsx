import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../../components/feedback/Alert';
import { donorAccountApi } from '../../features/donorIdentity/services/donorAccount.api';
import { authApi } from '../../features/authentication/services/auth.api';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { getErrorMessage } from '../../services/errorMapper';

interface StudentAccountState {
  loading: boolean;
  user: Record<string, any> | null;
  name: string;
  pending: boolean;
  message: string | null;
  error: string | null;
  mfa: Record<string, any> | null;
}

export function StudentAccountPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get('section');
  const activeSection =
    requestedSection && ['profile', 'security', 'close'].includes(requestedSection)
      ? requestedSection
      : 'profile';
  const selectSection = (section: string) =>
    setSearchParams(section === 'profile' ? {} : { section });
  const [state, setState] = useState<StudentAccountState>({
    loading: true,
    user: null,
    name: '',
    pending: false,
    message: null,
    error: null,
    mfa: null,
  });
  const [password, setPassword] = useState('');
  const [closePassword, setClosePassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    donorAccountApi
      .mine()
      .then(({ user }) =>
        setState((current) => ({ ...current, loading: false, user, name: user.name }))
      )
      .catch((cause: unknown) =>
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(cause, 'Unable to load account settings.'),
        }))
      );
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!state.user || state.name.trim().length < 2) return;
    setState((current) => ({ ...current, pending: true, message: null, error: null }));
    try {
      const { user } = await donorAccountApi.updateProfile(state.user.id, {
        name: state.name.trim(),
      });
      setState((current) => ({
        ...current,
        pending: false,
        user,
        name: user.name,
        message: 'Profile details saved.',
      }));
    } catch (cause: unknown) {
      setState((current) => ({
        ...current,
        pending: false,
        error: getErrorMessage(cause, 'Unable to update profile.'),
      }));
    }
  };

  const enableMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState((current) => ({ ...current, pending: true, message: null, error: null }));
    try {
      const result = await authApi.enableMfa(password);
      setPassword('');
      setState((current) => ({
        ...current,
        pending: false,
        mfa: result,
        message:
          'Two-factor setup started. Complete authenticator verification before leaving this page.',
      }));
    } catch (cause: unknown) {
      setState((current) => ({
        ...current,
        pending: false,
        error: getErrorMessage(cause, 'Unable to start two-factor setup.'),
      }));
    }
  };

  const close = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmation !== 'DELETE') return;
    setState((current) => ({ ...current, pending: true, message: null, error: null }));
    try {
      await donorAccountApi.closeAccount(closePassword);
      await logout();
      navigate('/', { replace: true });
    } catch (cause: unknown) {
      setState((current) => ({
        ...current,
        pending: false,
        error: getErrorMessage(cause, 'Unable to close account.'),
      }));
    }
  };

  if (state.loading) {
    return (
      <main className="portal-page">
        <p role="status">Loading account settings…</p>
      </main>
    );
  }
  return (
    <main className="portal-page student-page student-account-page">
      <p className="section-kicker">Student account</p>
      <h1>Account and security.</h1>
      <p className="portal-page__lead">
        Manage your private profile and sign-in security. Your university record remains read-only and is managed separately.
      </p>
      {state.message && (
        <Alert tone="success" title="Updated">
          {state.message}
        </Alert>
      )}
      {state.error && (
        <Alert tone="danger" title="Unable to update account">
          {state.error}
        </Alert>
      )}
      <div className="student-settings-layout">
        <nav className="student-settings-nav" aria-label="Student account settings">
          <button
            className={activeSection === 'profile' ? 'is-active' : ''}
            onClick={() => selectSection('profile')}
          >
            <strong>Profile</strong>
            <span>Name and email</span>
          </button>
          <button
            className={activeSection === 'security' ? 'is-active' : ''}
            onClick={() => selectSection('security')}
          >
            <strong>Security</strong>
            <span>Authenticator and recovery</span>
          </button>
          <button
            className={activeSection === 'close' ? 'is-active' : ''}
            onClick={() => selectSection('close')}
          >
            <strong>Close account</strong>
            <span>Disable account access</span>
          </button>
        </nav>
        <section className="student-settings-panel">
          {activeSection === 'profile' && (
            <form className="student-account-card" onSubmit={save}>
              <h2>Profile</h2>
              <label>
                Full name
                <input
                  value={state.name}
                  onChange={(event) =>
                    setState((current) => ({ ...current, name: event.target.value }))
                  }
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                Email address
                <input value={state.user?.email ?? ''} readOnly />
              </label>
              <button className="primary-button" disabled={state.pending}>
                Save profile
              </button>
            </form>
          )}
          {activeSection === 'security' && (
            <section className="student-account-card">
              <h2>Security</h2>
              <p>
                Two-factor authentication:{' '}
                <strong>{state.user?.twoFactorEnabled ? 'Enabled' : 'Not enabled'}</strong>
              </p>
              {!state.user?.twoFactorEnabled && (
                <form onSubmit={enableMfa}>
                  <label>
                    Confirm your password
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <button className="secondary-button" disabled={state.pending}>
                    Set up authenticator app
                  </button>
                </form>
              )}
              {state.mfa && (
                <p className="muted">Authenticator setup is ready for verification.</p>
              )}
            </section>
          )}
          {activeSection === 'close' && (
            <section className="student-account-card student-account-card--danger">
              <h2>Close account</h2>
              <p>
                Closing disables sign-in and revokes sessions; confirmed support and audit records remain for accountability.
              </p>
              {!closing ? (
                <button type="button" onClick={() => setClosing(true)}>
                  Close this account
                </button>
              ) : (
                <form onSubmit={close}>
                  <label>
                    Current password
                    <input
                      type="password"
                      value={closePassword}
                      onChange={(event) => setClosePassword(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Type DELETE to confirm
                    <input
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      required
                    />
                  </label>
                  <button disabled={state.pending || confirmation !== 'DELETE'}>
                    Close account
                  </button>
                </form>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
