export interface ApplicationStatusProps {
  status?: string | null;
}

export function ApplicationStatus({ status }: ApplicationStatusProps) {
  return (
    <span className={`application-status application-status--${String(status).toLowerCase()}`}>
      {String(status ?? 'DRAFT').replaceAll('_', ' ')}
    </span>
  );
}
