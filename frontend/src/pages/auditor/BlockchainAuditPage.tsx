import { useEffect, useState } from 'react';
import { auditApi } from '../../features/auditTrail/services/audit.api';
import { EvidenceVerifier } from '../../features/auditTrail/components/EvidenceVerifier';
import { getErrorMessage } from '../../services/errorMapper';

interface AuditIntegrity {
  valid: boolean;
  message?: string;
}

export function BlockchainAuditPage() {
  const [integrity, setIntegrity] = useState<AuditIntegrity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auditApi
      .integrity()
      .then((value) => setIntegrity(value as AuditIntegrity))
      .catch((cause: unknown) => setError(getErrorMessage(cause, 'Failed to verify audit chain.')));
  }, []);

  return (
    <main className="portal-page auditor-page">
      <p className="section-kicker">Blockchain evidence</p>
      <h1>Verify tamper-evident audit chain.</h1>
      {error && <p className="form-error">{error}</p>}
      <EvidenceVerifier integrity={integrity} />
      <p className="muted">
        The audit trail stores verifiable hashes and state transitions; it does not place raw
        private student or donor records on a public chain.
      </p>
    </main>
  );
}
