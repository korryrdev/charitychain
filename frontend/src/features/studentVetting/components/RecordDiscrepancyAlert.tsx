import { Link } from 'react-router-dom';

export function RecordDiscrepancyAlert() {
  return <aside className="record-discrepancy" role="note"><strong>Is a simulated university record incorrect?</strong><p>You cannot edit official academic or finance data here. Use the appeal route to explain the discrepancy; the original record remains preserved for review.</p><Link to="/student/appeals">Report a discrepancy</Link></aside>;
}
