const tones = Object.freeze({ SILVER: 'tier-badge--silver', GOLD: 'tier-badge--gold', DIAMOND: 'tier-badge--diamond', PLATINUM: 'tier-badge--platinum' });
export function TierBadge({ tier, label = tier }) { if (!tier) return null; return <span className={`tier-badge ${tones[tier] ?? 'tier-badge--default'}`}>{label}</span>; }
