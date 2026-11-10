import { statusLabel, statusTone } from '../../utils/statuses.js';
export function StatusBadge({ status }) { return <span className={`status-badge status-badge--${statusTone(status)}`}>{statusLabel(status)}</span>; }
