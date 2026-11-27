import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicPage } from './PublicPage';
import { api } from '../../lib/api';
import { recognitionApi } from '../../features/recognitionTiers/services/recognition.api';
import { TierBadge } from '../../features/recognitionTiers/components/TierBadge';
import { RecognitionBoard } from '../../features/recognitionTiers/components/RecognitionBoard';
import { transparencyApi } from '../../features/transparency/services/transparency.api';

interface RecognitionTier {
  code: string;
  name?: string;
  minimumValue?: number;
}

interface RecognitionDonor {
  name: string;
  tier?: string | null;
}

interface DonorRecognitionState {
  loading: boolean;
  tiers: RecognitionTier[];
  donors: RecognitionDonor[];
  anonymousCount: number;
}

export function DonorRecognitionPage() {
  const [state, setState] = useState<DonorRecognitionState>({
    loading: true,
    tiers: [],
    donors: [],
    anonymousCount: 0,
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      recognitionApi.tiers(),
      transparencyApi.dashboard(),
      api.getRecognitionWall().catch(() => ({ entries: [], anonymousCount: 0 })),
    ])
      .then(([tierResponse, dashboardResponse, wallResponse]) => {
        if (active) {
          setState({
            loading: false,
            tiers: tierResponse.tiers ?? [],
            donors: (dashboardResponse.dashboard?.recognition ?? []).map(
              (entry: { name: string; tier?: string | null }) => ({
                name: entry.name,
                tier: entry.tier ?? null,
              })
            ),
            anonymousCount: wallResponse.anonymousCount ?? 0,
          });
        }
      })
      .catch(() => {
        if (active) setState({ loading: false, tiers: [], donors: [], anonymousCount: 0 });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PublicPage
      title="Recognition on your terms."
      lead="Every donor receives a unique generated alias at registration. Public recognition is always opt-in, omits contribution amounts and exact dates, and never influences vetting or committee decisions."
      eyebrow="Donor recognition"
    >
      <section className="recognition-intro">
        <span>Alias by default</span>
        <span>Real name by choice</span>
        <span>Amounts &amp; exact dates stay private</span>
      </section>
      <div className="flex flex-wrap gap-3 my-4">
        <Link className="cc-btn cc-btn--primary cc-btn--sm" to="/wall">
          Browse interactive supporter wall
        </Link>
        <Link className="cc-btn cc-btn--secondary cc-btn--sm" to="/donor/claim">
          Claim a receipt &amp; set display name
        </Link>
      </div>
      {state.anonymousCount >= 5 && (
        <p className="public-note" role="status">
          <strong>{state.anonymousCount}</strong> donors chose to stay anonymous (shown only once 5 or more opt out).
        </p>
      )}
      {state.loading && (
        <div className="public-data-state" role="status">
          Loading configured recognition tiers…
        </div>
      )}
      {!state.loading && state.tiers.length > 0 && (
        <section className="tier-grid">
          {state.tiers.map((tier) => (
            <article key={tier.code}>
              <TierBadge tier={tier.code} label={tier.name ?? tier.code} />
              <span>From KES {Number(tier.minimumValue ?? 0).toLocaleString()}</span>
            </article>
          ))}
        </section>
      )}
      <RecognitionBoard donors={state.donors} />
      <section className="public-note">
        <strong>How recognition works:</strong> confirmed monetary contributions and approved goods valuations determine private milestone tiers. To protect donor privacy under KDPA 2019, public views display only opted-in names, tier badges, and award month — never amounts or exact timestamps.
      </section>
    </PublicPage>
  );
}
