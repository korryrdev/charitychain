import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { SearchInput } from '../../components/forms/SearchInput';
import { approvalsApi } from '../../features/committeeApprovals/services/approvals.api';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../services/errorMapper';

interface ReviewQueueApplication {
  id: string;
  reference: string;
  type: string;
  status: string;
  requestedAmount: string | number;
  semester: {
    code: string;
  };
}

const caseRef = (application: Pick<ReviewQueueApplication, 'reference'>): string =>
  `CASE-${application.reference.slice(-8)}`;

export function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewQueueApplication[]>([]);
  const [status, setStatus] = useState('VERIFIED');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 150).trim().toLowerCase();

  useEffect(() => {
    approvalsApi
      .queue({ status, pageSize: 100 })
      .then(({ items: value }) => setItems((value ?? []) as ReviewQueueApplication[]))
      .catch((cause: unknown) =>
        setError(getErrorMessage(cause, 'Failed to load review queue.'))
      );
  }, [status]);

  const filteredItems = useMemo(
    () =>
      items.filter((application) => {
        if (!debouncedQuery) return true;
        return `${caseRef(application)} ${application.reference ?? ''} ${application.type ?? ''} ${application.status ?? ''} ${application.semester?.code ?? ''} ${application.requestedAmount ?? ''}`
          .toLowerCase()
          .includes(debouncedQuery);
      }),
    [items, debouncedQuery]
  );

  return (
    <main className="portal-page committee-page">
      <p className="section-kicker">Review queue</p>
      <h1>Applications ready for committee action.</h1>
      <div className="queue-toolbar">
        <label className="queue-filter">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="VERIFIED">Verified</option>
            <option value="MANUAL_REVIEW">Manual review</option>
            <option value="AWAITING_APPROVALS">Awaiting approvals</option>
            <option value="APPROVED">Approved</option>
          </select>
        </label>
        <SearchInput
          id="committee-queue-search"
          label="Search cases"
          value={query}
          onChange={setQuery}
          placeholder="Search case code, type, or semester…"
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="committee-queue">
        {filteredItems.map((application) => (
          <Link key={application.id} to={`/committee/review/${application.id}`}>
            <strong>{caseRef(application)}</strong>
            <span>{application.type} · KES {Number(application.requestedAmount).toLocaleString()}</span>
            <small>{application.status.replaceAll('_', ' ')} · {application.semester.code}</small>
          </Link>
        ))}
      </div>
      {!filteredItems.length && !error && (
        <p className="muted">
          {items.length ? 'No applications match your search.' : 'No applications are in this queue.'}
        </p>
      )}
    </main>
  );
}
