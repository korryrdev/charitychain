import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { preferencesStore } from '../../store/preferences.store.js';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'charitychain_theme';

function getStoredTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    const pref = preferencesStore.get()?.theme;
    if (pref === 'light' || pref === 'dark' || pref === 'system') return pref;
  } catch {
    // Local storage access can fail in restricted environments
  }
  return 'system';
}

function resolveEffectiveTheme(theme) {
  if (theme === 'dark' || theme === 'light') return theme;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyThemeToDOM(theme, resolved) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.content = resolved;
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const resolvedTheme = useMemo(() => {
    if (theme === 'dark' || theme === 'light') return theme;
    return systemDark ? 'dark' : 'light';
  }, [theme, systemDark]);

  useEffect(() => {
    applyThemeToDOM(theme, resolvedTheme);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemDark(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY && (event.newValue === 'light' || event.newValue === 'dark' || event.newValue === 'system')) {
        setThemeState(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = (nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark' && nextTheme !== 'system') return;
    setThemeState(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      preferencesStore.set({ theme: nextTheme });
    } catch {
      // Ignore write errors in private browsing/sandboxes
    }
  };

  const toggleTheme = () => {
    // If currently dark (resolved), switch to light; if light, switch to dark
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

