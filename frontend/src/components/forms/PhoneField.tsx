import type { InputHTMLAttributes } from 'react';
import { FormField } from './FormField';

export interface PhoneFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id?: string;
  label?: string;
  error?: string | null;
}

export function PhoneField({
  id = 'phone',
  label = 'Phone number',
  error,
  ...props
}: PhoneFieldProps) {
  return (
    <FormField id={id} label={label} error={error} hint="Use 2547XXXXXXXX format.">
      <input
        id={id}
        name={props.name ?? id}
        inputMode="tel"
        autoComplete="tel"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
    </FormField>
  );
}
