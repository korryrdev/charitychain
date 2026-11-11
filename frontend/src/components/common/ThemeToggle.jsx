import { useTheme } from '../../app/theme/ThemeContext.jsx';

export function ThemeToggle({ className = '', showLabel = false }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'theme-toggle--dark' : 'theme-toggle--light'} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode (currently ${resolvedTheme})`}
      title={`Current mode: ${resolvedTheme}. Click to switch to ${isDark ? 'light' : 'dark'} mode.`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isDark ? (
          /* Sun icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        ) : (
          /* Moon icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
      </span>
      {showLabel && (
        <span className="theme-toggle__label">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

