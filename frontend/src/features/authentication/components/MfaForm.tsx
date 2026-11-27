import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/common/Button';
import { FormField } from '../../../components/forms/FormField';
import { Alert } from '../../../components/feedback/Alert';
import { validateMfa } from '../validation/auth.schema';

export type MfaFormValues = {
  code: string;
  trustDevice: boolean;
};

export interface MfaFormProps {
  onSubmit: (values: MfaFormValues) => void | Promise<void>;
  pending?: boolean;
  error?: string | null;
}

export function MfaForm({ onSubmit, pending = false, error = null }: MfaFormProps) {
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateMfa({ code });
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) await onSubmit({ code, trustDevice });
  };

  return (
    <form noValidate onSubmit={submit}>
      <h1>Verify your sign-in</h1>
      <p>Enter the six-digit code from your authenticator.</p>
      {error && (
        <Alert tone="danger" title="Verification failed">
          {error}
        </Alert>
      )}
      <FormField id="mfa-code" label="Authentication code" error={errors.code}>
        <input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
        />
      </FormField>
      <label>
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(event) => setTrustDevice(event.target.checked)}
        />{' '}
        Trust this device
      </label>
      <Button type="submit" loading={pending}>
        Verify
      </Button>
    </form>
  );
}
