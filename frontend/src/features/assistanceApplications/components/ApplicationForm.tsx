import { useState, type FormEvent } from 'react';
import { validateApplication } from '../validation/application.schema';

export type ApplicationSupportType = 'TUITION' | 'UPKEEP';

export type ApplicationFormSubmission = {
  type: ApplicationSupportType;
  requestedAmount: number;
  reason: string;
};

export interface ApplicationFormProps {
  outstandingBalance?: number | string | null;
  onSubmit: (values: ApplicationFormSubmission) => void | Promise<void>;
  pending?: boolean;
}

export function ApplicationForm({ outstandingBalance, onSubmit, pending = false }: ApplicationFormProps) {
  const [values, setValues] = useState<{
    type: ApplicationSupportType;
    requestedAmount: string;
    reason: string;
  }>({ type: 'TUITION', requestedAmount: '', reason: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validateApplication(values, { outstandingBalance });
    setErrors(next);
    if (!Object.keys(next).length) onSubmit({ ...values, requestedAmount: Number(values.requestedAmount) });
  };

  return (
    <form className="application-form" onSubmit={submit}>
      <fieldset>
        <legend>Support type</legend>
        <label>
          <input
            type="radio"
            checked={values.type === 'TUITION'}
            onChange={() => setValues({ ...values, type: 'TUITION' })}
          />{' '}
          Tuition fee assistance
        </label>
        <label>
          <input
            type="radio"
            checked={values.type === 'UPKEEP'}
            onChange={() => setValues({ ...values, type: 'UPKEEP' })}
          />{' '}
          Upkeep assistance
        </label>
      </fieldset>
      <label>
        Requested amount (KES)
        <input
          type="number"
          min={1}
          value={values.requestedAmount}
          onChange={(event) => setValues({ ...values, requestedAmount: event.target.value })}
        />
        {errors.requestedAmount && <small>{errors.requestedAmount}</small>}
      </label>
      <label>
        Why is support needed now?
        <textarea
          rows={6}
          value={values.reason}
          onChange={(event) => setValues({ ...values, reason: event.target.value })}
        />
        {errors.reason && <small>{errors.reason}</small>}
      </label>
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? 'Submitting…' : 'Submit for vetting'}
      </button>
    </form>
  );
}
