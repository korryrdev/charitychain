import { useState } from 'react';
import { Button } from '../../../components/common/Button.jsx';
import { FormField } from '../../../components/forms/FormField.jsx';
import { PaymentMethodSelector } from './PaymentMethodSelector.jsx';
import {
  normalizeKenyanPhoneNumber,
  validateDonation
} from '../validation/donation.schema.js';
export function DonationForm({ onSubmit, pending = false }) {
  const [values, setValues] = useState({
    amount: '',
    channel: 'MPESA_STK',
    phoneNumber: '',
    purpose: 'UNRESTRICTED',
    purposeReference: ''
  });
  const [errors, setErrors] = useState({});
  const update = (field, value) => setValues({ ...values, [field]: value });
  const submit = async (event) => {
    event.preventDefault();
    const next = validateDonation(values);
    setErrors(next);
    if (!Object.keys(next).length) {
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
    <form className="donation-form" noValidate onSubmit={submit}>
      <FormField id="donation-amount" label="Contribution amount (KES)" error={errors.amount}>
        <input
          id="donation-amount"
          type="number"
          min="1"
          step="1"
          inputMode="decimal"
          value={values.amount}
          onChange={(event) => update('amount', event.target.value)}
        />
      </FormField>
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
          />
        </FormField>
      )}
      <FormField id="donation-purpose" label="Support purpose" error={errors.purpose}>
        <select
          id="donation-purpose"
          value={values.purpose}
          onChange={(event) => update('purpose', event.target.value)}
        >
          <option value="UNRESTRICTED">Where support is most needed</option>
          <option value="TUITION">Tuition support</option>
          <option value="UPKEEP">Upkeep support</option>
        </select>
      </FormField>
      <FormField
        id="purpose-reference"
        label="Optional reference"
        hint="For a published campaign or approved reference only."
      >
        <input
          id="purpose-reference"
          value={values.purposeReference}
          onChange={(event) => update('purposeReference', event.target.value)}
        />
      </FormField>
      <Button type="submit" loading={pending}>
        Continue to payment
      </Button>
    </form>
  );
}
