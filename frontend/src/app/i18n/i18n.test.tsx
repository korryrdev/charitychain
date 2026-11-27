import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProviders } from '@/app/Providers';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CommunityLayout } from '@/layouts/CommunityLayout';

describe('Wave 3 i18n (EN/SW) & WCAG SkipLink Shell Integration', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it('renders localized SkipLink, #main-content landmark, and toggles English <-> Kiswahili in PublicLayout', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProviders sessionLoader={async () => null}>
          <Routes>
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<div>Home content</div>} />
            </Route>
          </Routes>
        </AppProviders>
      </MemoryRouter>
    );

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getAllByRole('link', { name: 'Track donation' }).length).toBeGreaterThan(0);

    const langButton = screen.getByRole('button', { name: /Switch language/i });
    fireEvent.click(langButton);

    expect(screen.getByRole('link', { name: 'Ruka hadi maudhui makuu' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Fuatilia mchango' }).length).toBeGreaterThan(0);
    expect(document.documentElement.lang).toBe('sw');
  });

  it('renders SkipLink, #main-content landmark, and LanguageToggle inside CommunityLayout', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppProviders sessionLoader={async () => null}>
          <Routes>
            <Route path="/admin" element={<CommunityLayout />}>
              <Route index element={<div>Admin content</div>} />
            </Route>
          </Routes>
        </AppProviders>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content'
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('Super administration')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Switch language/i }));
    expect(screen.getByText('Utawala Mkuu')).toBeInTheDocument();
  });
});
