import { useId, useRef, useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  MAX_REASON_LENGTH,
  MIN_REASON_LENGTH,
  parseRequestedAmount,
  validateApplication,
} from '../validation/application.schema';

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

export function ApplicationForm({
  outstandingBalance,
  onSubmit,
  pending = false,
}: ApplicationFormProps) {
  const baseId = useId();
  const amountId = `${baseId}-amount`;
  const amountErrorId = `${baseId}-amount-error`;
  const reasonId = `${baseId}-reason`;
  const reasonErrorId = `${baseId}-reason-error`;
  const amountRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

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
    if (Object.keys(next).length) {
      if (next.requestedAmount) amountRef.current?.focus();
      else if (next.reason) reasonRef.current?.focus();
      return;
    }
    onSubmit({
      type: values.type,
      requestedAmount: parseRequestedAmount(values.requestedAmount),
      reason: values.reason.trim(),
    });
  };

  return (
    <form className="cc-assist-form application-form" onSubmit={submit} noValidate>
      <fieldset className="cc-assist-fieldset">
        <legend>Support type</legend>
        <div className="cc-radio-grid">
          <label className="cc-radio-card" htmlFor={`${baseId}-tuition`}>
            <input
              id={`${baseId}-tuition`}
              type="radio"
              name="type"
              value="TUITION"
              checked={values.type === 'TUITION'}
              onChange={() => setValues({ ...values, type: 'TUITION' })}
            />
            <span className="cc-radio-card__control" aria-hidden="true" />
            <span className="cc-radio-card__content">
              <strong>Tuition fee assistance</strong>
            </span>
          </label>
          <label className="cc-radio-card" htmlFor={`${baseId}-upkeep`}>
            <input
              id={`${baseId}-upkeep`}
              type="radio"
              name="type"
              value="UPKEEP"
              checked={values.type === 'UPKEEP'}
              onChange={() => setValues({ ...values, type: 'UPKEEP' })}
            />
            <span className="cc-radio-card__control" aria-hidden="true" />
            <span className="cc-radio-card__content">
              <strong>Upkeep assistance</strong>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="cc-assist-field">
        <label htmlFor={amountId}>
          Requested amount (KES) <span aria-hidden="true">*</span>
        </label>
        <input
          ref={amountRef}
          id={amountId}
          name="requestedAmount"
          type="text"
          inputMode="numeric"
          required
          value={values.requestedAmount}
          aria-invalid={errors.requestedAmount ? 'true' : 'false'}
          aria-describedby={errors.requestedAmount ? amountErrorId : undefined}
          onChange={(event) => {
            const nextValues = { ...values, requestedAmount: event.target.value };
            setValues(nextValues);
            if (errors.requestedAmount) {
              const check = validateApplication(nextValues, { outstandingBalance });
              if (!check.requestedAmount) {
                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.requestedAmount;
                  return updated;
                });
              }
            }
          }}
        />
        {errors.requestedAmount && (
          <small id={amountErrorId} className="cc-field__error">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errors.requestedAmount}</span>
          </small>
        )}
      </div>

      <div className="cc-assist-field">
        <label htmlFor={reasonId}>
          Why is support needed now? <span aria-hidden="true">*</span>
        </label>
        <textarea
          ref={reasonRef}
          id={reasonId}
          name="reason"
          className="cc-assist-textarea"
          rows={5}
          required
          minLength={MIN_REASON_LENGTH}
          maxLength={MAX_REASON_LENGTH}
          value={values.reason}
          aria-invalid={errors.reason ? 'true' : 'false'}
          aria-describedby={errors.reason ? reasonErrorId : undefined}
          onChange={(event) => {
            const nextValues = { ...values, reason: event.target.value };
            setValues(nextValues);
            if (errors.reason) {
              const check = validateApplication(nextValues, { outstandingBalance });
              if (!check.reason) {
                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.reason;
                  return updated;
                });
              }
            }
          }}
        />
        {errors.reason && (
          <small id={reasonErrorId} className="cc-field__error">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errors.reason}</span>
          </small>
        )}
      </div>

      <button className="cc-btn cc-btn--primary" disabled={pending} type="submit">
        {pending ? 'Submitting…' : 'Submit for vetting'}
      </button>
    </form>
  );
}
