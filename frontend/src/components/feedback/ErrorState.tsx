import { getErrorMessage } from '../../services/errorMapper';

export interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Unable to load this information',
  error,
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="error-state" role="alert">
      <h2>{title}</h2>
      <p>{getErrorMessage(error, 'Please try again.')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </section>
  );
}
