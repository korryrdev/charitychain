import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../../components/feedback/Alert';
import { PublicIdentityForm } from '../../features/donorIdentity/components/PublicIdentityForm';
import { PublicProfilePreview } from '../../features/donorIdentity/components/PublicProfilePreview';
import { donorAccountApi } from '../../features/donorIdentity/services/donorAccount.api';
import { donorIdentityApi } from '../../features/donorIdentity/services/donorIdentity.api';
import { authApi } from '../../features/authentication/services/auth.api';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { getErrorMessage } from '../../services/errorMapper';

const sections = Object.freeze([
  ['profile', 'Profile', 'Name and email'],
  ['identity', 'Public identity', 'Recognition preferences'],
  ['security', 'Security', 'Authenticator and recovery'],
  ['close', 'Close account', 'Disable account access']
]);

interface DonorAccountState {
  loading: boolean;
  user: Record<string, any> | null;
  identity: Record<string, any> | null;
  name: string;
  pending: boolean;
  message: string | null;
  error: string | null;
  mfa: Record<string, any> | null;
}

export function DonorAccountPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout, user: sessionUser } = useAuth();
  const requestedSection = searchParams.get('section');
  const activeSection = sections.some(([key]) => key === requestedSection) ? requestedSection : 'profile';
  const [state, setState] = useState<DonorAccountState>({
    loading: true,
    user: null,
    identity: null,
    name: '',
    pending: false,
    message: null,
    error: null,
    mfa: null,
  });
  const [mfaPassword, setMfaPassword] = useState('');
  const [closing, setClosing] = useState(false);
  const [closePassword, setClosePassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    Promise.all([donorAccountApi.mine(), donorIdentityApi.mine()])
      .then(([account, identity]) =>
        setState((current) => ({
          ...current,
          loading: false,
          user: account.user,
          identity: identity.donor,
          name: account.user.name,
        }))
      )
      .catch((cause: unknown) =>
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(cause, 'Unable to load account settings.'),
        }))
      );
  }, []);

  const selectSection = (section: string) =>
    setSearchParams(section === 'profile' ? {} : { section });

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
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

  const requestAlias = async (alias: string) => {
    setState((current) => ({ ...current, pending: true, message: null, error: null }));
    try {
      const response = await donorIdentityApi.requestAlias(alias);
      setState((current) => ({
        ...current,
        pending: false,
        identity: response.donor,
        message: 'Your alias change has been submitted for review.',
      }));
    } catch (cause: unknown) {
      setState((current) => ({
        ...current,
        pending: false,
        error: getErrorMessage(cause, 'Unable to update alias.'),
      }));
    }
  };

  const updateIdentity = async (settings: Record<string, unknown>) => {
    setState((current) => ({ ...current, pending: true, message: null, error: null }));
    try {
      const response = await donorIdentityApi.updatePublicSettings(settings);
      setState((current) => ({
        ...current,
        pending: false,
        identity: { ...(current.identity ?? {}), ...response.settings },
        message: 'Public identity settings saved.',
      }));
    } catch (cause: unknown) {
      setState((current) => ({
        ...current,
        pending: false,
        error: getErrorMessage(cause, 'Unable to update identity settings.'),
      }));
    }
  };

  const beginMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState((current) => ({ ...current, pending: true, message: null, error: null }));
    try {
      const result = await authApi.enableMfa(mfaPassword);
      setMfaPassword('');
      setState((current) => ({
        ...current,
        pending: false,
        mfa: result,
        message:
          'Two-factor setup started. Follow the authenticator instructions before leaving this page.',
      }));
    } catch (cause: unknown) {
      setState((current) => ({
        ...current,
        pending: false,
        error: getErrorMessage(cause, 'Unable to start two-factor setup.'),
      }));
    }
  };

  const closeAccount = async (event: FormEvent<HTMLFormElement>) => {
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

  if (state.loading) return <main className="portal-page"><p role="status">Loading account settings…</p></main>;

  return <main className="portal-page donor-page donor-account-page">
    <p className="section-kicker">Donor account</p><h1>Account and security.</h1><p className="portal-page__lead">Manage your private profile, public recognition identity, account security, and access in one place.</p>
    {state.message && <Alert tone="success" title="Updated">{state.message}</Alert>}{state.error && <Alert tone="danger" title="Unable to update account">{state.error}</Alert>}
    <div className="donor-settings-layout">
      <nav className="donor-settings-nav" aria-label="Account settings">{sections.map(([key, title, description]) => <button key={key} type="button" className={activeSection === key ? 'is-active' : ''} onClick={() => selectSection(key)}><strong>{title}</strong><span>{description}</span></button>)}</nav>
      <section className="donor-settings-panel">
        {activeSection === 'profile' && <form className="donor-account-card" onSubmit={saveProfile}><h2>Profile</h2><p>Your real name and email are private to this account. Public recognition choices are managed separately.</p><label>Full name<input value={state.name} onChange={(event) => setState((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required /></label><label>Email address<input value={state.user?.email ?? ''} readOnly aria-readonly="true" /></label><div className="account-status"><span>Email verification</span><strong>{state.user?.emailVerified ? 'Verified' : 'Pending'}</strong></div><button className="primary-button" type="submit" disabled={state.pending}>Save profile</button></form>}
        {activeSection === 'identity' && <div className="donor-settings-identity"><div className="donor-account-card"><h2>Public identity</h2><p>Control the name and contribution information shown in public recognition. Your private account details are never shown.</p><PublicIdentityForm profile={state.identity} onAlias={requestAlias} onSettings={updateIdentity} pending={state.pending} /></div><PublicProfilePreview profile={state.identity} userName={state.user?.name ?? sessionUser?.name} /></div>}
        {activeSection === 'security' && <section className="donor-account-card"><h2>Security</h2><div className="account-status"><span>Two-factor authentication</span><strong>{state.user?.twoFactorEnabled ? 'Enabled' : 'Not enabled'}</strong></div>{!state.user?.twoFactorEnabled && <form onSubmit={beginMfa}><p>Protect access to donation records and recognition settings with an authenticator app.</p><label>Confirm your password<input type="password" value={mfaPassword} onChange={(event) => setMfaPassword(event.target.value)} autoComplete="current-password" required /></label><button className="secondary-button" type="submit" disabled={state.pending}>Set up authenticator app</button></form>}{state.mfa && <p className="muted">Setup details were returned securely for this session. Complete the authenticator verification before signing out.</p>}<p className="muted">Use password recovery from the sign-in page if you lose access.</p></section>}
        {activeSection === 'close' && <section className="donor-account-card danger-zone"><h2>Close donor account</h2><p>Closing immediately revokes every session, disables sign-in, and removes this donor from public recognition. Confirmed donation and audit records are retained for reconciliation and legal accountability.</p>{!closing ? <button type="button" onClick={() => setClosing(true)}>Close this donor account</button> : <form className="danger-zone__confirm" onSubmit={closeAccount}><label>Current password<input type="password" value={closePassword} onChange={(event) => setClosePassword(event.target.value)} autoComplete="current-password" required /></label><label>Type DELETE to confirm<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" required /></label><div><button type="submit" disabled={state.pending || confirmation !== 'DELETE'}>Permanently close access</button><button className="secondary-button" type="button" onClick={() => { setClosing(false); setClosePassword(''); setConfirmation(''); }}>Cancel</button></div></form>}</section>}
      </section>
    </div>
  </main>;
}
