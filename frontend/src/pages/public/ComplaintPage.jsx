import { Link } from 'react-router-dom';
import { PublicPage } from './PublicPage.jsx';
export function ComplaintPage() { return <PublicPage title="Raise a complaint" lead="A complaint record should clearly describe the issue, relevant dates, and any safe reference identifiers. Do not include passwords, tracking secrets, or one-time codes."><p>Authenticated users will be able to submit and follow a complaint from their portal. For urgent suspected fraud, use the dedicated <Link to="/report-fraud">fraud reporting page</Link>.</p></PublicPage>; }
