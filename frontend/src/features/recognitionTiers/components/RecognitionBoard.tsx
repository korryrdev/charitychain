import { TierBadge } from './TierBadge';

export interface RecognitionBoardDonor {
  name: string;
  tier?: string | null;
}

export interface RecognitionBoardProps {
  donors?: RecognitionBoardDonor[];
}

export function RecognitionBoard({ donors = [] }: RecognitionBoardProps) {
  return (
    <section className="recognition-board" aria-labelledby="recognition-board-title">
      <div>
        <h2 id="recognition-board-title">Recognition board</h2>
        <p>
          Displayed names and tiers follow each donor’s opt-in preference. Contribution amounts and exact dates are never shown publicly.
        </p>
      </div>
      {donors.length ? (
        <ol>
          {donors.map((donor, index) => (
            <li key={`${donor.name}-${index}`}>
              <span className="recognition-board__rank">{String(index + 1).padStart(2, '0')}</span>
              <strong>{donor.name}</strong>
              <TierBadge tier={donor.tier} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="recognition-board__empty">No donors have opted into public recognition yet.</p>
      )}
    </section>
  );
}
