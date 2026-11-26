import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchInput({
  id = 'search-input',
  label = 'Search',
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  size = 'md',
}: SearchInputProps) {
  return (
    <div className={`cc-search cc-search--${size} ${className}`.trim()}>
      <label className="cc-sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="cc-search__control">
        <Search
          className="cc-search__icon"
          size={size === 'lg' ? 22 : 18}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />
        {value && (
          <button
            type="button"
            className="cc-search__clear"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => onChange('')}
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
