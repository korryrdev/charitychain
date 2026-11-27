import { useState, type FormEvent } from 'react';

export type DecisionOption = 'APPROVE' | 'DECLINE';

export type DecisionFormValues = {
  decision: DecisionOption;
  rationale: string;
};

export interface DecisionFormProps {
  onSubmit: (values: DecisionFormValues) => void | Promise<void>;
  pending?: boolean;
  disabled?: boolean;
}

export function DecisionForm({ onSubmit, pending = false, disabled = false }: DecisionFormProps) {
  const [decision, setDecision] = useState<DecisionOption>('APPROVE');
  const [rationale, setRationale] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ decision, rationale });
  };

  return (
    <form className="decision-form" onSubmit={submit}>
      <label>
        Decision
        <select value={decision} onChange={(event) => setDecision(event.target.value as DecisionOption)}>
          <option value="APPROVE">Approve</option>
          <option value="DECLINE">Decline</option>
        </select>
      </label>
      <label>
        Rationale
        <textarea
          rows={5}
          minLength={15}
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          required
          placeholder="State the basis for your decision using the available evidence."
        />
      </label>
      <button className="primary-button" disabled={pending || disabled}>
        {pending ? 'Signing…' : 'Sign decision'}
      </button>
    </form>
  );
}
