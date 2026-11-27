import { statusLabel, statusTone } from '../../utils/statuses';

export interface StatusBadgeProps {
  status?: string | null;
  label?: string | null;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${statusTone(status)}`}>
      {label ?? statusLabel(status)}
    </span>
  );
}
