import { useEffect, useState, type FormEvent } from 'react';
import { auditApi } from '../../features/auditTrail/services/audit.api';
import { EvidenceVerifier } from '../../features/auditTrail/components/EvidenceVerifier';
import { getErrorMessage } from '../../services/errorMapper';
import { verifyEvidenceCommitmentOnChain, type OnChainVerifyResult } from '@/lib/web3Verify';

interface AuditIntegrity {
  valid: boolean;
  message?: string;
}

export function BlockchainAuditPage() {
  const [integrity, setIntegrity] = useState<AuditIntegrity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commitment, setCommitment] = useState('');
  const [chainResult, setChainResult] = useState<OnChainVerifyResult | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    auditApi
      .integrity()
      .then((value) => setIntegrity(value as AuditIntegrity))
      .catch((cause: unknown) => setError(getErrorMessage(cause, 'Failed to verify audit chain.')));
  }, []);

  const verifyCommitment = async (e: FormEvent) => {
    e.preventDefault();
    setChecking(true);
    const res = await verifyEvidenceCommitmentOnChain({ commitment });
    setChainResult(res);
    setChecking(false);
  };

  return (
    <main className="portal-page auditor-page">
      <p className="section-kicker">Blockchain evidence</p>
      <h1>Verify tamper-evident audit chain.</h1>
      {error && <p className="form-error">{error}</p>}
      <EvidenceVerifier integrity={integrity} />

      <section className="portal-card">
        <h2>Verify Commitment on EvidenceRegistry (Web3.js)</h2>
        <form onSubmit={verifyCommitment} className="reconciliation-form">
          <label>
            Commitment Hash (0x...)
            <input
              value={commitment}
              onChange={(e) => {
                setCommitment(e.target.value);
                setChainResult(null);
              }}
              placeholder="0x..."
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={checking}>
            {checking ? 'Querying RPC…' : 'Verify On-Chain'}
          </button>
        </form>
        {chainResult && (
          <p className={chainResult.status === 'VERIFIED' ? 'muted' : 'form-error'}>
            <strong>{chainResult.status}:</strong> {chainResult.message}
          </p>
        )}
      </section>

      <p className="muted">
        The audit trail stores verifiable hashes and state transitions; it does not place raw
        private student or donor records on a public chain.
      </p>
    </main>
  );
}
