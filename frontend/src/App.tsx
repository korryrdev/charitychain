import { Link } from 'react-router-dom';

export function FoundationStatus() {
  return (
    <main className="foundation-shell">
      <section className="foundation-card" aria-labelledby="foundation-title">
        <p className="eyebrow">CharityChain</p>
        <h1 id="foundation-title">Foundation is running</h1>
        <p>The React workspace is connected and ready for backend implementation.</p>
        <Link to="/health">View frontend health</Link>
      </section>
    </main>
  );
}

export function FrontendHealth() {
  return <output aria-label="frontend health">ok</output>;
}

export default FoundationStatus;
