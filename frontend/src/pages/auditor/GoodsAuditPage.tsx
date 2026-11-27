import { useEffect, useState } from 'react';
import { auditApi } from '../../features/auditTrail/services/audit.api';
import {
  AuditTimeline,
  type AuditEventItem
} from '../../features/auditTrail/components/AuditTimeline';

export function GoodsAuditPage() {
  const [items, setItems] = useState<AuditEventItem[]>([]);

  useEffect(() => {
    auditApi
      .events('?entityType=goodsCollection')
      .then((value) => setItems((value.items ?? []) as AuditEventItem[]))
      .catch(() => {});
  }, []);

  return (
    <main className="portal-page auditor-page">
      <p className="section-kicker">Goods audit</p>
      <h1>Physical donation and collection events.</h1>
      <AuditTimeline items={items} />
    </main>
  );
}
