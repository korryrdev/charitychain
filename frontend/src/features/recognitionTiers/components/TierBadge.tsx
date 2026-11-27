const tones: Readonly<Record<string, string>> = Object.freeze({
  SILVER: 'tier-badge--silver',
  GOLD: 'tier-badge--gold',
  DIAMOND: 'tier-badge--diamond',
  PLATINUM: 'tier-badge--platinum',
});

export interface TierBadgeProps {
  tier?: string | null;
  label?: string | null;
}

export function TierBadge({ tier, label }: TierBadgeProps) {
  if (!tier) return null;
  return <span className={`tier-badge ${tones[tier] ?? 'tier-badge--default'}`}>{label ?? tier}</span>;
}
