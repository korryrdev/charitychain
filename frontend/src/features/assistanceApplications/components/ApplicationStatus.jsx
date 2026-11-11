export function ApplicationStatus({ status }) {
  return <span className={`application-status application-status--${String(status).toLowerCase()}`}>{String(status ?? 'DRAFT').replaceAll('_', ' ')}</span>;
}
