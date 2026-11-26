import { useEffect, useState } from 'react';
import { auditApi } from '../../features/auditTrail/services/audit.api';
import {
  AuditTimeline,
  type AuditEventItem
} from '../../features/auditTrail/components/AuditTimeline';

export function MoneyAuditPage() {
  const [items, setItems] = useState<AuditEventItem[]>([]);

  useEffect(() => {
    auditApi
      .events('?entityType=moneyDonation')
      .then((value) => setItems((value.items ?? []) as AuditEventItem[]))
      .catch(() => {});
  }, []);

  return (
    <main className="portal-page auditor-page">
      <p className="section-kicker">Money audit</p>
      <h1>Donation and payout events.</h1>
      <AuditTimeline items={items} />
    </main>
  );
}
