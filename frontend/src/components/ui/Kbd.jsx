export function Kbd({ children, className = '' }) {
  return (
    <kbd className={`cc-kbd ${className}`.trim()} aria-hidden="true">
      {children}
    </kbd>
  );
}
