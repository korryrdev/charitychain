import { useEffect, useState } from 'react';
import { AppealForm } from '../../features/complaints/components/AppealForm';
import { complaintsApi } from '../../features/complaints/services/complaints.api';
import { applicationsApi } from '../../features/assistanceApplications/services/applications.api';
import { getErrorMessage } from '../../services/errorMapper';

interface AppealApplicationSummary {
  id: string;
  reference: string;
  type: string;
  [key: string]: any;
}

export function StudentAppealsPage() {
  const [appeals, setAppeals] = useState<Array<Record<string, any>>>([]);
  const [applications, setApplications] = useState<AppealApplicationSummary[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    Promise.all([complaintsApi.myAppeals(), applicationsApi.mine({ pageSize: 50 })])
      .then(([appealResponse, applicationResponse]) => {
        setAppeals(appealResponse.items ?? []);
        setApplications(applicationResponse.items ?? []);
      })
      .catch((cause: unknown) => setError(getErrorMessage(cause, 'Unable to load appeals.')));

  useEffect(() => {
    load();
  }, []);

  const create = async (payload: Record<string, unknown>) => {
    setPending(true);
    setError(null);
    try {
      const { appeal } = await complaintsApi.createAppeal(payload);
      setAppeals((items) => [appeal, ...items]);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Unable to submit review request.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="portal-page appeals-page">
      <p className="section-kicker">Review and correction</p>
      <h1>Report a discrepancy or request a review.</h1>
      <p className="portal-page__lead">
        Appeals do not overwrite your university record or alter a committee decision. They create a traceable review request while the original evidence remains intact.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <section className="portal-card">
        <h2>New review request</h2>
        <AppealForm applications={applications} onSubmit={create} pending={pending} />
      </section>
      <section className="appeal-history">
        <h2>Your submitted requests</h2>
        {appeals.length ? (
          <div className="appeal-list">
            {appeals.map((appeal) => (
              <article key={appeal.id}>
                <div>
                  <strong>{appeal.category.replaceAll('_', ' ')}</strong>
                  <p>{appeal.message}</p>
                </div>
                <span>{appeal.status.replaceAll('_', ' ')}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No review requests have been submitted.</p>
        )}
      </section>
    </main>
  );
}
