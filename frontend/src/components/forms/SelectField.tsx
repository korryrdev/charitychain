import type { SelectHTMLAttributes } from 'react';
import { FormField } from './FormField';
import type { SelectOption } from '@/types';

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id: string;
  label: string;
  options: SelectOption[];
  error?: string | null;
  placeholder?: string;
}

export function SelectField({
  id,
  label,
  options,
  error,
  placeholder = 'Select an option',
  ...props
}: SelectFieldProps) {
  return (
    <FormField id={id} label={label} error={error}>
      <select id={id} name={props.name ?? id} aria-invalid={Boolean(error)} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
