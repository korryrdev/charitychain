import { useState, type FormEvent } from 'react';

export interface CommitteeConflict {
  id: string;
  type: string;
  status: string;
}

export type ConflictDeclarationSubmission = {
  membershipId: string;
  type: string;
  description: string;
};

export interface ConflictDeclarationProps {
  membershipId: string;
  onSubmit: (values: ConflictDeclarationSubmission) => void | Promise<void>;
  conflicts?: CommitteeConflict[];
}

export function ConflictDeclaration({ membershipId, onSubmit, conflicts = [] }: ConflictDeclarationProps) {
  const [type, setType] = useState('PERSONAL_RELATIONSHIP');
  const [description, setDescription] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ membershipId, type, description });
  };

  return (
    <section className="conflict-declaration">
      <h2>Conflict of interest</h2>
      <p>
        Do not decide where a personal, family, financial, or organizational conflict exists. A declared conflict blocks
        your signature for this application.
      </p>
      {conflicts.length ? (
        <ul>
          {conflicts.map((conflict) => (
            <li key={conflict.id}>
              {conflict.type.replaceAll('_', ' ')} · {conflict.status}
            </li>
          ))}
        </ul>
      ) : null}
      <form onSubmit={submit}>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="FAMILY_RELATIONSHIP">Family relationship</option>
          <option value="FINANCIAL_INTEREST">Financial interest</option>
          <option value="ORGANIZATIONAL_RELATIONSHIP">Organizational relationship</option>
          <option value="PERSONAL_RELATIONSHIP">Personal relationship</option>
          <option value="OTHER">Other</option>
        </select>
        <textarea
          rows={4}
          minLength={15}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the conflict for the audit record."
          required
        />
        <button className="secondary-button">Declare conflict</button>
      </form>
    </section>
  );
}
