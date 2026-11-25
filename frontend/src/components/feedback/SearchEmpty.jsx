import { SearchX } from 'lucide-react';

/** Empty state for filtered lists, with a way back. */
export function SearchEmpty({ title = 'No matches found', hint, onClear, clearLabel = 'Clear search' }) {
  return (
    <div className="cc-empty" role="status">
      <span className="cc-empty__icon" aria-hidden="true">
        <SearchX size={26} strokeWidth={1.5} />
      </span>
      <p className="cc-empty__title">{title}</p>
      {hint && <p className="cc-empty__hint">{hint}</p>}
      {onClear && (
        <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={onClear}>
          {clearLabel}
        </button>
      )}
    </div>
  );
}
