import { useId, useState, type FocusEventHandler, type InputHTMLAttributes, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, Eye, EyeOff } from 'lucide-react';

export interface AuthFieldProps {
  id: string;
  label: ReactNode;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  value: string;
  onChange: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  error?: string | null;
  hint?: ReactNode;
  valid?: boolean;
  placeholder?: string;
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
  children?: ReactNode;
}

/**
 * Labelled text input used by the auth forms: label above, helper text,
 * inline error (linked with aria-describedby), optional valid indicator and
 * a show/hide toggle for password fields.
 */
export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  hint,
  valid = false,
  placeholder,
  autoComplete,
  children,
}: AuthFieldProps) {
  const reactId = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const state = error ? ' is-invalid' : valid ? ' is-valid' : '';

  return (
    <div className="cc-field" data-field={reactId}>
      <label className="cc-field__label" htmlFor={id}>
        {label}
      </label>
      <div className={`cc-field__control${state}`}>
        <input
          id={id}
          className="cc-input"
          type={isPassword && revealed ? 'text' : type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {isPassword && (
          <button
            type="button"
            className="cc-field__toggle"
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={18} strokeWidth={1.75} aria-hidden="true" />}
          </button>
        )}
        {!isPassword && valid && !error && (
          <span className="cc-field__status" aria-hidden="true">
            <CircleCheck size={18} strokeWidth={1.75} />
          </span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p className="cc-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="cc-field__error" id={errorId} role="alert">
          <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
