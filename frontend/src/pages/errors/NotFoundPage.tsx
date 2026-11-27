import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="portal-page">
      <p className="section-kicker">404</p>
      <h1>Page not found.</h1>
      <p className="portal-page__lead">
        The requested CharityChain page could not be found or may have moved.
      </p>
      <p>
        <Link to="/" className="primary-button">
          Return to CharityChain
        </Link>{' '}
        <Link to="/help">Visit the help center</Link>
      </p>
    </main>
  );
}
