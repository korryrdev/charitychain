import { useState } from 'react';
import { Button } from '../../../components/common/Button.jsx';
import { FormField } from '../../../components/forms/FormField.jsx';
import { PaymentMethodSelector } from './PaymentMethodSelector.jsx';
import { normalizeKenyanPhoneNumber, validateDonation } from '../validation/donation.schema.js';

const suggestedAmounts = [500, 1000, 2500, 5000];

export function DonationForm({ onSubmit, pending = false }) {
  const [values, setValues] = useState({
    amount: '',
    channel: 'MPESA_STK',
    phoneNumber: '',
    purpose: 'UNRESTRICTED',
    purposeReference: ''
  });
  const [errors, setErrors] = useState({});
  const update = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validateDonation(values);
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) {
      await onSubmit({
        ...values,
        phoneNumber:
          values.channel === 'MPESA_STK'
            ? normalizeKenyanPhoneNumber(values.phoneNumber)
            : values.phoneNumber,
        amount: Number(values.amount),
        purposeReference: values.purposeReference || undefined
      });
    }
  };

  return (
    <form className="donation-form donation-form--refined" noValidate onSubmit={submit}>
      <section className="donation-form__section">
        <div className="donation-form__heading">
          <span>1</span>
          <div>
            <h2>Choose your amount</h2>
            <p>Your contribution is recorded only after provider confirmation and reconciliation.</p>
          </div>
        </div>
        <div className="donation-amount-field">
          <label htmlFor="donation-amount">Contribution amount (KES)</label>
          <div>
            <b aria-hidden="true">KES</b>
            <input
              id="donation-amount"
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={values.amount}
              onChange={(event) => update('amount', event.target.value)}
              placeholder="0"
              aria-describedby={errors.amount ? 'donation-amount-error' : undefined}
            />
          </div>
        </div>
        {errors.amount && (
          <p id="donation-amount-error" className="form-error" role="alert">
            {errors.amount}
          </p>
        )}
        <div className="suggested-amounts" aria-label="Suggested contribution amounts">
          {suggestedAmounts.map((amount) => (
            <button
              type="button"
              key={amount}
              className={Number(values.amount) === amount ? 'is-selected' : ''}
              onClick={() => update('amount', String(amount))}
            >
              KES {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </section>

      <section className="donation-form__section">
        <div className="donation-form__heading">
          <span>2</span>
          <div>
            <h2>Select payment method</h2>
            <p>Use normal fiat payments only; a secure tracking record is created for every request.</p>
          </div>
        </div>
        <PaymentMethodSelector
          value={values.channel}
          onChange={(value) => update('channel', value)}
          error={errors.channel}
        />
        {values.channel === 'MPESA_STK' && (
          <FormField
            id="donation-phone"
            label="M-Pesa phone number"
            hint="Enter a Kenyan mobile number as 07…, 01…, 254…, or +254…."
            error={errors.phoneNumber}
          >
            <input
              id="donation-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={values.phoneNumber}
              onChange={(event) => update('phoneNumber', event.target.value.trim())}
              placeholder="0712345678"
            />
          </FormField>
        )}
      </section>

      <section className="donation-form__section">
        <div className="donation-form__heading">
          <span>3</span>
          <div>
            <h2>Direct your support</h2>
            <p>You may give to the central pool or select a support category.</p>
          </div>
        </div>
        <div className="donation-purpose-grid">
          <label htmlFor="donation-purpose">
            <span>Support purpose</span>
            <select
              id="donation-purpose"
              value={values.purpose}
              onChange={(event) => update('purpose', event.target.value)}
            >
              <option value="UNRESTRICTED">Where support is most needed</option>
              <option value="TUITION">Tuition support</option>
              <option value="UPKEEP">Upkeep support</option>
            </select>
          </label>
          <label htmlFor="purpose-reference">
            <span>Optional reference</span>
            <input
              id="purpose-reference"
              value={values.purposeReference}
              onChange={(event) => update('purposeReference', event.target.value)}
              placeholder="Campaign or approved reference"
            />
          </label>
        </div>
        {errors.purpose && (
          <p className="form-error" role="alert">
            {errors.purpose}
          </p>
        )}
      </section>

      <div className="donation-form__submit">
        <div>
          <strong>Before you continue</strong>
          <p>You will receive a private tracking ID and verification secret. Keep them secure.</p>
        </div>
        <Button type="submit" loading={pending}>
          Continue to payment
        </Button>
      </div>
    </form>
  );
}
