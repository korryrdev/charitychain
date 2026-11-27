import { useEffect, useState } from 'react';
import { Alert } from '../../components/feedback/Alert';
import { PublicIdentityForm } from '../../features/donorIdentity/components/PublicIdentityForm';
import { PublicProfilePreview } from '../../features/donorIdentity/components/PublicProfilePreview';
import { donorIdentityApi } from '../../features/donorIdentity/services/donorIdentity.api';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { getErrorMessage } from '../../services/errorMapper';

interface PublicIdentityState {
  loading: boolean;
  profile: Record<string, any> | null;
  pending: boolean;
  message: string | null;
  error: string | null;
}

export function PublicIdentityPage() {
  const { user } = useAuth();
  const [state, setState] = useState<PublicIdentityState>({
    loading: true,
    profile: null,
    pending: false,
    message: null,
    error: null,
  });

  useEffect(() => {
    donorIdentityApi
      .mine()
      .then((response) =>
        setState((current) => ({ ...current, loading: false, profile: response.donor }))
      )
      .catch((error: unknown) =>
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Unable to load public identity.'),
        }))
      );
  }, []);

  const alias = async (value: string) => {
    setState({ ...state, pending: true, error: null });
    try {
      const response = await donorIdentityApi.requestAlias(value);
      setState({
        ...state,
        pending: false,
        profile: response.donor,
        message: 'Your alias change has been submitted for review.',
        error: null,
      });
    } catch (error: unknown) {
      setState({
        ...state,
        pending: false,
        error: getErrorMessage(error, 'Unable to update alias.'),
      });
    }
  };

  const settings = async (value: Record<string, unknown>) => {
    try {
      const response = await donorIdentityApi.updatePublicSettings(value);
      setState({
        ...state,
        profile: { ...(state.profile ?? {}), ...response.settings },
        message: 'Public visibility updated.',
        error: null,
      });
    } catch (error: unknown) {
      setState({
        ...state,
        error: getErrorMessage(error, 'Unable to update public settings.'),
      });
    }
  };

  if (state.loading) {
    return (
      <main className="portal-page">
        <p role="status">Loading public identity…</p>
      </main>
    );
  }
  return (
    <main className="portal-page donor-page donor-identity-page">
      <p className="section-kicker">Public identity</p>
      <h1>Control how you are recognised.</h1>
      <p className="portal-page__lead">
        Your generated alias is used by default. You decide whether to appear publicly and what contribution information is visible.
      </p>
      {state.message && (
        <Alert tone="success" title="Saved">
          {state.message}
        </Alert>
      )}
      {state.error && (
        <Alert tone="danger" title="Unable to update identity">
          {state.error}
        </Alert>
      )}
      <div className="identity-grid">
        <PublicIdentityForm
          profile={state.profile}
          onAlias={alias}
          onSettings={settings}
          pending={state.pending}
        />
        <PublicProfilePreview profile={state.profile} userName={user?.name} />
      </div>
    </main>
  );
}
