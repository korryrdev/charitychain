import { Link } from 'react-router-dom';
export function AccessDeniedPage() { return <main className="auth-page"><h1>Access denied</h1><p>Your account does not have permission for that page. Contact an administrator if you believe this is a mistake.</p><Link to="/">Return to CharityChain</Link></main>; }
