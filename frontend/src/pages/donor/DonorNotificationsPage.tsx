import { useEffect, useState } from 'react';
import { notificationsApi } from '../../features/notifications/services/notifications.api';
import { getErrorMessage } from '../../services/errorMapper';

const dateTime = (value: string | null | undefined): string =>
  value
    ? new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value)
      )
    : 'Pending delivery';

interface DonorNotificationsState {
  loading: boolean;
  items: Array<Record<string, any>>;
  error: string | null;
}

export function DonorNotificationsPage() {
  const [state, setState] = useState<DonorNotificationsState>({
    loading: true,
    items: [],
    error: null,
  });

  useEffect(() => {
    let active = true;
    notificationsApi.mine()
      .then((response) => active && setState({ loading: false, items: response.notifications ?? [], error: null }))
      .catch(
        (cause: unknown) =>
          active &&
          setState({
            loading: false,
            items: [],
            error: getErrorMessage(cause, 'Unable to load notifications.'),
          })
      );
    return () => { active = false; };
  }, []);

  return <main className="portal-page donor-page donor-notifications-page">
    <p className="section-kicker">Donation updates</p>
    <h1>Stay informed about your contributions.</h1>
    <p className="portal-page__lead">Confirmation, correction, allocation, reconciliation, recognition, and account-security messages are recorded here when they are sent to your donor account.</p>
    {state.loading && <p role="status">Loading notifications…</p>}
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {!state.loading && !state.error && <div className="notification-list">{state.items.length ? state.items.map((item) => <article key={item.id}><div><strong>{item.title ?? 'CharityChain update'}</strong><p>{item.body}</p></div><small>{dateTime(item.deliveredAt ?? item.sentAt ?? item.createdAt)} · {item.status.replaceAll('_', ' ')}</small></article>) : <p>There are no donation updates yet.</p>}</div>}
  </main>;
}
