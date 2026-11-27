import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicPage, InformationGrid } from './PublicPage';
import { transparencyApi } from '../../features/transparency/services/transparency.api';
import { TransparencySummary } from '../../features/transparency/components/TransparencySummary';
import { FundFlowChart } from '../../features/transparency/components/FundFlowChart';
import { GoodsDistributionChart } from '../../features/transparency/components/GoodsDistributionChart';

interface TransparencyState {
  loading: boolean;
  data: Record<string, any> | null;
}

export function TransparencyPage() {
  const [state, setState] = useState<TransparencyState>({ loading: true, data: null });

  useEffect(() => {
    let active = true;
    transparencyApi
      .dashboard()
      .then((response) => {
        if (active) setState({ loading: false, data: response.dashboard });
      })
      .catch(() => {
        if (active) setState({ loading: false, data: null });
      });
    return () => {
      active = false;
    };
  }, []);

  const dashboard = state.data;
  const auditItems: Array<Record<string, any>> = dashboard?.audit ?? [];

  return (
    <PublicPage
      title="Transparency that protects people."
      lead="This dashboard publishes confirmed and reconciled aggregate information. It never exposes student identities, registration numbers, contacts, financial records, or committee deliberations."
      actions={[{ to: '/track', label: 'Track a private donation' }]}
      eyebrow="Public transparency"
    >
      {state.loading && (
        <div className="public-data-state" role="status">
          Loading the latest reconciled public figures…
        </div>
      )}
      {!state.loading && !dashboard && (
        <div className="public-data-state">
          Public reporting is temporarily unavailable. Please try again later.
        </div>
      )}
      {dashboard && (
        <>
          <TransparencySummary dashboard={dashboard} />
          <div className="transparency-visuals">
            <FundFlowChart flows={dashboard.fundFlow} currency={dashboard.currency} />
            <GoodsDistributionChart inventory={dashboard.inventory} />
          </div>
          <section className="transparency-columns">
            <article>
              <h2>Public audit summary</h2>
              {auditItems.length ? (
                <ul>
                  {auditItems.slice(0, 5).map((item) => (
                    <li key={`${item.action}-${item.outcome}`}>
                      <span>{String(item.action).replaceAll('_', ' ').toLowerCase()}</span>
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No public audit summary is available yet.</p>
              )}
            </article>
            <article>
              <h2>Recognition and privacy</h2>
              <p>
                Public donor names, aliases, tiers, and optional totals are only shown when a donor has explicitly enabled them.
              </p>
              <Link to="/recognition">View donor recognition</Link>
            </article>
          </section>
        </>
      )}
      <InformationGrid
        items={[
          {
            title: 'Money flow',
            body: 'Public reporting distinguishes received donations, central-pool balance, and verified disbursements after reconciliation.',
          },
          {
            title: 'Goods flow',
            body: 'Available stock is grouped by category, rather than exposing restricted stock identifiers or locations.',
          },
          {
            title: 'Recognition',
            body: 'A donor is listed only under their selected public identity and preferences.',
          },
        ]}
      />
    </PublicPage>
  );
}
