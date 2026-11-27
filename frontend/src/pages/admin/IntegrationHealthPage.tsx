import { useEffect, useState } from 'react';
import { adminApi } from '../../features/administration/services/admin.api';

interface HealthStatus {
  status?: string;
}

export function IntegrationHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    adminApi
      .health()
      .then((value) => setHealth(value as HealthStatus))
      .catch(() => setHealth({ status: 'UNAVAILABLE' }));
  }, []);

  return (
    <main className="portal-page admin-page">
      <p className="section-kicker">Integration health</p>
      <h1>Service availability.</h1>
      <section className="portal-card">
        <strong>{health?.status ?? 'Checking…'}</strong>
        <p>
          Monitor database, IPFS, payment-provider, SMS, and blockchain-anchor health through
          authenticated operations without exposing credentials or callback secrets.
        </p>
      </section>
    </main>
  );
}
