import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext.jsx';
import { ThemeToggle } from '../../components/common/ThemeToggle.jsx';

function ThemeConsumer() {
  const { theme, resolvedTheme, isDark, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <span data-testid="is-dark">{isDark ? 'true' : 'false'}</span>
      <button type="button" onClick={() => setTheme('dark')}>Set Dark</button>
      <button type="button" onClick={() => setTheme('light')}>Set Light</button>
      <button type="button" onClick={toggleTheme}>Toggle</button>
      <ThemeToggle />
    </div>
  );
}

describe('ThemeContext and ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('provides theme state and updates DOM data-theme attribute on toggle', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /switch to/i });
    expect(toggleBtn).toBeInTheDocument();

    // Toggle theme to dark
    fireEvent.click(toggleBtn);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark').textContent).toBe('true');

    // Toggle theme back to light
    fireEvent.click(toggleBtn);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(screen.getByTestId('is-dark').textContent).toBe('false');
  });

  it('persists selected theme in localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Set Dark'));
    expect(localStorage.getItem('charitychain_theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(screen.getByText('Set Light'));
    expect(localStorage.getItem('charitychain_theme')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
